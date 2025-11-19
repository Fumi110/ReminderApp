// /src/components/DutyCalendar.jsx
// ReminderApp Ver.3.1 — 完成版（交代申請候補 / 今日強調 / 月&週ビュー）

import { useState, useEffect, useMemo } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import useAppStore from "../store/appStore";
import {
  getCurrentJSTDate,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfWeek,
  getEndOfWeek,
  addDays,
  formatDate,
  getJapaneseDayOfWeek,
  isSameDay,
} from "../utils/datejs";

// ------------------------------------------------------------
// UI 設定
// ------------------------------------------------------------
const DUTY_TYPE_LABELS = {
  trash1: "ゴミ出し①",
  trash2: "ゴミ出し②",
  bath: "風呂掃除①",
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  done: "bg-green-100 text-green-800 border-green-300",
  swap_requested: "bg-orange-100 text-orange-800 border-orange-300",
  null: "bg-gray-100 text-gray-400 border-gray-300",
};

// 今日の日付強調
const TODAY_STYLE =
  "border-2 border-blue-600 bg-blue-50 shadow-sm relative";

const TodayBadge = () => (
  <span className="absolute top-1 right-1 text-[10px] bg-blue-600 text-white px-1 rounded">
    今日
  </span>
);

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------
export default function DutyCalendar() {
  const envMode = useAppStore((s) => s.envMode || "dev");
  const userProfile = useAppStore((s) => s.userProfile);

  const dutiesCol =
    envMode === "dev" ? "development_duties" : "duties";
  const usersCol =
    envMode === "dev" ? "development_users" : "users";

  const [duties, setDuties] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  // UI state
  const [viewMode, setViewMode] = useState("month"); // month / week
  const [currentDate, setCurrentDate] = useState(getCurrentJSTDate());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ------------------------------------------------------------
  // Firestore duties リアルタイム同期
  // ------------------------------------------------------------
  useEffect(() => {
    const col = collection(db, dutiesCol);
    const q = query(col, orderBy("date", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const grouped = {};

      snap.docs.forEach((d) => {
        const data = d.data();

        // 旧フォーマットは無視
        if (!data.date || !data.type) return;

        if (!grouped[data.date]) grouped[data.date] = {};
        grouped[data.date][data.type] = { ...data, id: d.id };
      });

      setDuties(grouped);
      setLoading(false);
    });

    return () => unsub();
  }, [envMode]);

  // ------------------------------------------------------------
  // ユーザー一覧読み込み（交代候補選択用）
  // ------------------------------------------------------------
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, usersCol));
      const map = {};
      snap.forEach((d) => {
        const data = d.data();
        map[d.id] = data.name || data.display_name || "名無し";
      });
      setUsersMap(map);
    };
    loadUsers();
  }, [envMode]);

  // ------------------------------------------------------------
  // カレンダー範囲計算
  // ------------------------------------------------------------
  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const start = getStartOfMonth(currentDate);
      const end = getEndOfMonth(currentDate);

      const s = addDays(start, -start.getDay());
      const e = addDays(end, 6 - end.getDay());
      return { start: s, end: e };
    }

    return {
      start: getStartOfWeek(currentDate),
      end: getEndOfWeek(currentDate),
    };
  }, [currentDate, viewMode]);

  const dates = useMemo(() => {
    const arr = [];
    let cur = new Date(dateRange.start);
    while (cur <= dateRange.end) {
      arr.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    return arr;
  }, [dateRange]);

  // ------------------------------------------------------------
  // 当番クリック → モーダル表示
  // ------------------------------------------------------------
  const openModal = (date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setShowModal(false);
  };

  // ------------------------------------------------------------
  // 完了報告
  // ------------------------------------------------------------
  const handleFinish = async (duty) => {
    await updateDoc(doc(db, dutiesCol, duty.id), {
      status: "done",
    });
    closeModal();
  };

  // ------------------------------------------------------------
  // 交代申請（複数候補）
  // ------------------------------------------------------------
  const handleSwap = async (duty, candidates) => {
    await updateDoc(doc(db, dutiesCol, duty.id), {
      status: "swap_requested",
      swap_request: {
        requested_by: userProfile.uid,
        candidates,
        created_at: Date.now(), // emulator互換
      },
    });
    closeModal();
  };

  // ------------------------------------------------------------
  // DutyCard（小UI）
  // ------------------------------------------------------------
  const DutyCard = ({ duty }) => {
    if (!duty)
      return (
        <div className="px-3 py-2 rounded border text-xs bg-gray-50 text-gray-400 border-gray-200">
          ー
        </div>
      );

    const color = STATUS_COLORS[duty.status] || STATUS_COLORS.pending;

    return (
      <div className={`px-3 py-2 rounded border text-xs ${color}`}>
        {DUTY_TYPE_LABELS[duty.type]}：{usersMap[duty.assigned_to] || "??"}
      </div>
    );
  };

  // ------------------------------------------------------------
  // MONTH VIEW
  // ------------------------------------------------------------
  const MonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
        <div key={i} className="text-center text-xs font-semibold py-2">
          {d}
        </div>
      ))}

      {dates.map((date) => {
        const dateStr = formatDate(date);
        const today = isSameDay(date, getCurrentJSTDate());
        const dayDuties = duties[dateStr] || {};
        const hasDuty = Object.keys(dayDuties).length > 0;

        return (
          <button
            key={dateStr}
            onClick={() => openModal(date)}
            className={`
              relative min-h-[80px] p-1 rounded-lg border text-left
              ${today ? TODAY_STYLE : "border-gray-300"}
              ${hasDuty ? "bg-yellow-50" : ""}
            `}
          >
            {today && <TodayBadge />}

            <div className="text-xs font-bold mb-1">
              {date.getDate()}
            </div>

            {hasDuty &&
              Object.values(dayDuties).map((d) => (
                <div
                  key={d.type}
                  className={`text-[10px] mb-1 px-1 py-0.5 rounded border ${STATUS_COLORS[d.status]}`}
                >
                  {DUTY_TYPE_LABELS[d.type]}
                </div>
              ))}
          </button>
        );
      })}
    </div>
  );

  // ------------------------------------------------------------
  // WEEK VIEW
  // ------------------------------------------------------------
  const WeekView = () => (
    <div className="space-y-3">
      {dates.map((date) => {
        const dateStr = formatDate(date);
        const dayDuties = duties[dateStr] || {};
        const today = isSameDay(date, getCurrentJSTDate());

        return (
          <button
            key={dateStr}
            onClick={() => openModal(date)}
            className={`
              relative w-full p-3 rounded-lg border bg-white text-left
              ${today ? TODAY_STYLE : ""}
            `}
          >
            {today && <TodayBadge />}

            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold">{date.getDate()}</div>
              <div className="text-sm text-gray-500">
                {getJapaneseDayOfWeek(date)}
              </div>
            </div>

            <div className="space-y-1">
              <DutyCard duty={dayDuties.trash1} />
              <DutyCard duty={dayDuties.trash2} />
              <DutyCard duty={dayDuties.bath} />
            </div>
          </button>
        );
      })}
    </div>
  );

  // ------------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------------
  if (loading) return <div className="p-4">読み込み中...</div>;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">当番カレンダー</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 rounded ${
              viewMode === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            月表示
          </button>

          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 rounded ${
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            週表示
          </button>
        </div>
      </div>

      {/* View */}
      <div className="bg-white p-3 rounded-lg shadow">
        {viewMode === "month" ? <MonthView /> : <WeekView />}
      </div>

      {/* Modal */}
      {showModal && selectedDate && (
        <DutyModal
          date={selectedDate}
          duties={duties}
          usersMap={usersMap}
          onClose={closeModal}
          userProfile={userProfile}
          onFinish={handleFinish}
          onSwap={handleSwap}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// DutyModal（別コンポーネント）
// ------------------------------------------------------------
function DutyModal({
  date,
  duties,
  usersMap,
  onClose,
  userProfile,
  onFinish,
  onSwap,
}) {
  const dateStr = formatDate(date);
  const dayDuties = duties[dateStr] || {};
  const [swapCandidates, setSwapCandidates] = useState([]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-4 space-y-4 shadow-lg">
        <h3 className="text-lg font-bold">
          {dateStr}（{getJapaneseDayOfWeek(date)}）
        </h3>

        {["trash1", "trash2", "bath"].map((type) => {
          const duty = dayDuties[type];

          return (
            <div key={type} className="p-3 bg-gray-50 rounded border">
              <div className="font-semibold mb-1">
                {DUTY_TYPE_LABELS[type]}
              </div>

              <div className="mb-2 text-sm">
                担当者：{usersMap[duty?.assigned_to] || "ー"}
              </div>

              {duty && (
                <div
                  className={`inline-block px-3 py-1 rounded border text-sm ${STATUS_COLORS[duty.status]}`}
                >
                  状態：{duty.status}
                </div>
              )}

              {/* 自分が担当なら操作表示 */}
              {duty?.assigned_to === userProfile?.uid &&
                duty.status !== "done" && (
                  <div className="mt-3 space-y-3">
                    {/* 交代候補者 */}
                    <div>
                      <div className="text-sm font-medium mb-1">
                        交代候補者：
                      </div>
                      <select
                        multiple
                        className="w-full border rounded p-2 h-28"
                        value={swapCandidates}
                        onChange={(e) => {
                          const opts = Array.from(
                            e.target.selectedOptions
                          );
                          setSwapCandidates(opts.map((o) => o.value));
                        }}
                      >
                        {Object.entries(usersMap).map(
                          ([uid, name]) =>
                            uid !== userProfile.uid && (
                              <option key={uid} value={uid}>
                                {name}
                              </option>
                            )
                        )}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onFinish(duty)}
                        className="flex-1 bg-blue-600 text-white rounded px-3 py-2"
                      >
                        完了報告
                      </button>

                      <button
                        onClick={() =>
                          onSwap(duty, swapCandidates)
                        }
                        className="flex-1 bg-orange-600 text-white rounded px-3 py-2 disabled:bg-gray-300"
                        disabled={swapCandidates.length === 0}
                      >
                        交代申請
                      </button>
                    </div>
                  </div>
                )}
            </div>
          );
        })}

        <button
          onClick={onClose}
          className="w-full bg-gray-300 text-gray-900 rounded px-3 py-2 mt-2"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
