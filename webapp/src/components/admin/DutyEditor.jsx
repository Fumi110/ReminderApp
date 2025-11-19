// /src/components/admin/DutyEditor.jsx
// ReminderApp Ver.3.3 — 管理者用 当番編集
// - duties.type が trash1 / trash2 / garbage / bath など何でも編集可能
// - 月表示 / 週表示切替（週表示は縦に日付を並べる）
// - 担当者・ステータスを編集して保存可能
// - ラベルは「ゴミ出し」「風呂掃除」など日本語表示

import { useEffect, useState, useMemo } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";

import useAppStore from "../../store/appStore";
import {
  addDays,
  getCurrentJSTDate,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfWeek,
  getEndOfWeek,
  isSameDay,
  formatDate,
  getJapaneseDayOfWeek,
} from "../../utils/datejs";

// ------------------------------------------------------------
// ラベル: Firestore の type を日本語名にマッピング
// ------------------------------------------------------------
const DUTY_LABEL_JP = {
  trash: "ゴミ出し",
  trash1: "ゴミ出し①",
  trash2: "ゴミ出し②",
  garbage: "ゴミ出し",
  garbage1: "ゴミ出し①",
  garbage2: "ゴミ出し②",
  bath: "風呂掃除",
};

function getDutyLabel(type) {
  return DUTY_LABEL_JP[type] || `当番 (${type})`;
}

// ------------------------------------------------------------
// メインコンポーネント
// ------------------------------------------------------------
export default function DutyEditor() {
  const envMode = useAppStore((s) => s.envMode || "dev");
  const isAdmin = useAppStore((s) => s.isAdmin);

  if (!isAdmin) {
    return (
      <div className="p-4 text-red-600">
        管理者のみアクセスできます。
      </div>
    );
  }

  const dutiesCol = envMode === "dev" ? "development_duties" : "duties";
  const usersCol = envMode === "dev" ? "development_users" : "users";

  const [dutiesByDate, setDutiesByDate] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("month"); // "month" | "week"
  const [currentDate, setCurrentDate] = useState(getCurrentJSTDate());

  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ------------------------------------------------------------
  // duties リアルタイム購読
  // ------------------------------------------------------------
  useEffect(() => {
    const qRef = query(collection(db, dutiesCol), orderBy("date"));
    const unsubscribe = onSnapshot(qRef, (snap) => {
      const grouped = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (!data.date || !data.type) return;

        if (!grouped[data.date]) grouped[data.date] = {};
        grouped[data.date][data.type] = { ...data, id: d.id };
      });

      setDutiesByDate(grouped);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [envMode, dutiesCol]);

  // ------------------------------------------------------------
  // ユーザー一覧読み込み
  // ------------------------------------------------------------
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, usersCol));
      const map = {};
      snap.forEach((d) => {
        const data = d.data();
        map[d.id] = data.display_name || data.name || d.id;
      });
      setUsersMap(map);
    };
    loadUsers();
  }, [envMode, usersCol]);

  // ------------------------------------------------------------
  // カレンダー範囲（表示モードで変化）
  // ------------------------------------------------------------
  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const s = getStartOfMonth(currentDate);
      const e = getEndOfMonth(currentDate);
      return {
        start: addDays(s, -s.getDay()),
        end: addDays(e, 6 - e.getDay()),
      };
    } else {
      // week
      return {
        start: getStartOfWeek(currentDate),
        end: getEndOfWeek(currentDate),
      };
    }
  }, [currentDate, viewMode]);

  const dates = useMemo(() => {
    const arr = [];
    let d = new Date(dateRange.start);
    while (d <= dateRange.end) {
      arr.push(new Date(d));
      d = addDays(d, 1);
    }
    return arr;
  }, [dateRange]);

  const openModal = (date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-xl font-bold mb-2">当番編集（管理者用）</h1>

      {/* 表示モード切り替え + 月移動 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            月表示
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            週表示
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() =>
              setCurrentDate(
                addDays(currentDate, viewMode === "month" ? -30 : -7)
              )
            }
            className="px-2 py-1 border rounded"
          >
            ◀
          </button>
          <span>
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </span>
          <button
            onClick={() =>
              setCurrentDate(
                addDays(currentDate, viewMode === "month" ? 30 : 7)
              )
            }
            className="px-2 py-1 border rounded"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 見出し（曜日） */}
      {viewMode === "month" && (
        <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-center">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
      )}

      {/* カレンダー本体 */}
      {viewMode === "month" ? (
        // ---- 月表示：7×6 グリッド ----
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date) => {
            const dateStr = formatDate(date);
            const ds = dutiesByDate[dateStr] || {};
            const today = isSameDay(date, getCurrentJSTDate());
            const hasDuty = Object.keys(ds).length > 0;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => openModal(date)}
                className={`relative min-h-[78px] p-1 rounded border text-left text-xs
                  ${
                    today
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 bg-white"
                  }
                  ${hasDuty ? "hover:bg-blue-50" : "hover:bg-gray-50"}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{date.getDate()}</span>
                  {hasDuty && (
                    <span className="text-[10px] text-blue-600 border px-1 rounded">
                      編集
                    </span>
                  )}
                </div>

                {hasDuty ? (
                  Object.values(ds).map((duty) => (
                    <div
                      key={duty.id}
                      className="text-[10px] mt-0.5 px-1 py-0.5 bg-gray-50 rounded border"
                    >
                      {getDutyLabel(duty.type)}
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-gray-400">
                    当番なし
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        // ---- 週表示：縦に日付を並べる ----
        <div className="space-y-2">
          {dates.map((date) => {
            const dateStr = formatDate(date);
            const ds = dutiesByDate[dateStr] || {};
            const today = isSameDay(date, getCurrentJSTDate());
            const hasDuty = Object.keys(ds).length > 0;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => openModal(date)}
                className={`w-full text-left rounded-lg border px-3 py-3 flex flex-col gap-1
                  ${
                    today
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 bg-white"
                  } hover:bg-blue-50`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                    <span className="text-sm text-gray-500">
                      （{getJapaneseDayOfWeek(date)}）
                    </span>
                  </div>
                  {hasDuty && (
                    <span className="text-xs text-blue-600 border px-2 py-0.5 rounded-full">
                      編集
                    </span>
                  )}
                </div>

                {hasDuty ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.values(ds).map((duty) => (
                      <span
                        key={duty.id}
                        className="text-xs px-2 py-1 bg-gray-50 border rounded"
                      >
                        {getDutyLabel(duty.type)}：{" "}
                        {usersMap[duty.assigned_to] || "未設定"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    当番は登録されていません。
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 編集モーダル */}
      {showModal && selectedDate && (
        <DutyEditModal
          date={selectedDate}
          dutiesByDate={dutiesByDate}
          usersMap={usersMap}
          dutiesCol={dutiesCol}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// DutyEditModal: 1日の当番をまとめて編集
// ------------------------------------------------------------
function DutyEditModal({ date, dutiesByDate, usersMap, dutiesCol, onClose }) {
  const dateStr = formatDate(date);
  const dayDuties = dutiesByDate[dateStr] || {};

  // その日に存在する type を列挙（固定配列ではなく実データベース）
  const dutyTypes = Object.keys(dayDuties);

  // ローカル編集用 state
  const [local, setLocal] = useState(() => {
    const init = {};
    dutyTypes.forEach((t) => {
      init[t] = { ...dayDuties[t] };
    });
    return init;
  });

  const handleChange = (type, field, value) => {
    setLocal((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSaveOne = async (type) => {
    const duty = local[type];
    if (!duty || !duty.id) return;

    try {
      await updateDoc(doc(db, dutiesCol, duty.id), {
        assigned_to: duty.assigned_to || null,
        status: duty.status || "pending",
      });
      alert(`${getDutyLabel(type)} を更新しました。`);
    } catch (e) {
      console.error(e);
      alert("更新時にエラーが発生しました。");
    }
  };

  const hasDuties = dutyTypes.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-5 space-y-4 shadow-lg">
        <h2 className="text-lg font-bold mb-2">
          {dateStr}（{getJapaneseDayOfWeek(date)}）の当番編集
        </h2>

        {!hasDuties && (
          <p className="text-sm text-gray-600">
            この日には当番が登録されていません。
          </p>
        )}

        {hasDuties &&
          dutyTypes.map((type) => {
            const duty = local[type];
            if (!duty) return null;

            return (
              <div
                key={type}
                className="border rounded-lg p-3 bg-gray-50 space-y-2"
              >
                <div className="font-semibold text-sm">
                  {getDutyLabel(type)}
                </div>

                {/* 担当者セレクト */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">担当者</div>
                  <select
                    value={duty.assigned_to || ""}
                    onChange={(e) =>
                      handleChange(type, "assigned_to", e.target.value)
                    }
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="">（未設定）</option>
                    {Object.entries(usersMap).map(([uid, name]) => (
                      <option key={uid} value={uid}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ステータスセレクト（完了報告編集） */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">
                    ステータス（完了報告）
                  </div>
                  <select
                    value={duty.status || "pending"}
                    onChange={(e) =>
                      handleChange(type, "status", e.target.value)
                    }
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="pending">未完了</option>
                    <option value="done">完了</option>
                  </select>
                </div>

                <button
                  onClick={() => handleSaveOne(type)}
                  className="w-full mt-2 bg-blue-600 text-white rounded py-2 text-sm font-semibold hover:bg-blue-700"
                >
                  この当番を保存
                </button>
              </div>
            );
          })}

        <button
          onClick={onClose}
          className="w-full mt-2 bg-gray-300 text-gray-900 rounded py-2 text-sm"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
