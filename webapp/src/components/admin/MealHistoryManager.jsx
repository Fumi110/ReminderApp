// /src/components/admin/MealHistoryManager.jsx
// ReminderApp Ver.3.1 — 管理者向け 食数投票履歴管理（完全安全版）
// React Error #31（オブジェクトが JSX に混入）の永久対策を実装済み

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { formatDate } from "../../utils/datejs";
import { getUserDisplayName } from "../../utils/userName";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** votes の構造を sanitize（不正データ混入防止） */
function sanitizeVotesObject(votes) {
  if (!votes || typeof votes !== "object") return {};
  const clean = {};

  for (const [uid, v] of Object.entries(votes)) {
    if (!v || typeof v !== "object") continue;
    const morning = v.morning === true;
    const evening = v.evening === true;
    clean[uid] = { morning, evening };
  }

  return clean;
}

/** ユーザーID配列を sanitize */
function sanitizeIdArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === "string");
}

/** 表示名リスト（string[] 保証） */
function buildNameList(userIds, findUser) {
  if (!Array.isArray(userIds)) return [];
  return userIds
    .map((uid) => {
      if (typeof uid !== "string") return null;
      const u = findUser(uid);
      return getUserDisplayName(u);
    })
    .filter((x) => typeof x === "string");
}

export default function MealHistoryManager({ onUnsavedChange }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [userList, setUserList] = useState([]);

  const [monthlyData, setMonthlyData] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({
    morningAvg: 0,
    eveningAvg: 0,
  });

  const [modalInfo, setModalInfo] = useState(null);
  const [modalSelectedUserId, setModalSelectedUserId] = useState("");
  const [modalMealType, setModalMealType] = useState("morning");

  /** ユーザー一覧ロード */
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUserList(arr);
    };
    loadUsers();
  }, []);

  const findUser = (uid) => userList.find((u) => u.id === uid) || null;

  /** 月次投票データ読み込み */
  useEffect(() => {
    const loadMonthVotes = async () => {
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();

      const result = {};
      let totalMorning = 0;
      let totalEvening = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(y, m, day);
        const key = formatDate(d);

        const snap = await getDoc(doc(db, "meal_votes", key));

        let morningUserIds = [];
        let eveningUserIds = [];

        if (snap.exists()) {
          const rawVotes = sanitizeVotesObject(snap.data().votes);
          for (const [uid, v] of Object.entries(rawVotes)) {
            if (v.morning === true) morningUserIds.push(uid);
            if (v.evening === true) eveningUserIds.push(uid);
          }
        }

        morningUserIds = sanitizeIdArray(morningUserIds);
        eveningUserIds = sanitizeIdArray(eveningUserIds);

        totalMorning += morningUserIds.length;
        totalEvening += eveningUserIds.length;

        result[key] = {
          morningCount: morningUserIds.length,
          eveningCount: eveningUserIds.length,
          morningUserIds,
          eveningUserIds,
        };
      }

      setMonthlyData(result);
      setMonthlyStats({
        morningAvg: totalMorning / daysInMonth,
        eveningAvg: totalEvening / daysInMonth,
      });

      if (onUnsavedChange) onUnsavedChange(false);
    };

    loadMonthVotes();
  }, [currentMonth]);

  /** カレンダー */
  const getCalendarDays = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();

    const firstDay = new Date(y, m, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const ymLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  /** 未投票者 */
  const getMissingUsers = (dateKey) => {
    const d = monthlyData[dateKey] || {
      morningUserIds: [],
      eveningUserIds: [],
    };
    const voted = new Set([...d.morningUserIds, ...d.eveningUserIds]);
    return userList.filter((u) => !voted.has(u.id));
  };

  /** モーダルを開く（Date型を必ず渡す） */
  const openModal = (dateObj) => {
    const dateKey = formatDate(dateObj);

    const dayData = monthlyData[dateKey] || {
      morningUserIds: [],
      eveningUserIds: [],
    };

    const morningNames = buildNameList(dayData.morningUserIds, findUser);
    const eveningNames = buildNameList(dayData.eveningUserIds, findUser);

    setModalInfo({
      dateKey,
      morningNames,
      eveningNames,
    });

    const missing = getMissingUsers(dateKey);
    setModalSelectedUserId(missing[0]?.id || "");
    setModalMealType("morning");
  };

  const closeModal = () => {
    setModalInfo(null);
    setModalSelectedUserId("");
    setModalMealType("morning");
  };

  /** 未投票者追加 */
  const handleAddVote = async () => {
    if (!modalInfo || !modalSelectedUserId) return;

    const { dateKey } = modalInfo;
    const ref = doc(db, "meal_votes", dateKey);
    const snap = await getDoc(ref);

    const existing = snap.exists() ? snap.data() : {};
    const votes = sanitizeVotesObject(existing.votes);

    const prevVote = votes[modalSelectedUserId] || {
      morning: false,
      evening: false,
    };

    const newVote = {
      morning:
        modalMealType === "morning" ||
        modalMealType === "both" ||
        prevVote.morning,
      evening:
        modalMealType === "evening" ||
        modalMealType === "both" ||
        prevVote.evening,
    };

    votes[modalSelectedUserId] = newVote;

    await setDoc(ref, { votes }, { merge: false });

    /** state 更新 */
    setMonthlyData((prev) => {
      const old = prev[dateKey] || {
        morningUserIds: [],
        eveningUserIds: [],
      };

      const mIds = sanitizeIdArray([...old.morningUserIds]);
      const eIds = sanitizeIdArray([...old.eveningUserIds]);

      if (newVote.morning && !mIds.includes(modalSelectedUserId)) mIds.push(modalSelectedUserId);
      if (newVote.evening && !eIds.includes(modalSelectedUserId)) eIds.push(modalSelectedUserId);

      const updatedDay = {
        morningUserIds: mIds,
        eveningUserIds: eIds,
        morningCount: mIds.length,
        eveningCount: eIds.length,
      };

      const updated = {
        ...prev,
        [dateKey]: updatedDay,
      };

      // 月次統計更新
      let tm = 0;
      let te = 0;
      Object.values(updated).forEach((v) => {
        tm += v.morningCount;
        te += v.eveningCount;
      });

      const days = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      ).getDate();

      setMonthlyStats({
        morningAvg: tm / days,
        eveningAvg: te / days,
      });

      // モーダル表示も更新
      setModalInfo((info) =>
        info && info.dateKey === dateKey
          ? {
              ...info,
              morningNames: buildNameList(mIds, findUser),
              eveningNames: buildNameList(eIds, findUser),
            }
          : info
      );

      return updated;
    });

    const missing = getMissingUsers(dateKey);
    setModalSelectedUserId(missing[0]?.id || "");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">食数投票履歴（管理者）</h1>

      {/* 月次サマリー */}
      <div className="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
              )
            }
            className="px-3 py-1 border rounded text-sm"
          >
            ◀
          </button>

          <div className="font-semibold text-lg">{ymLabel}</div>

          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
              )
            }
            className="px-3 py-1 border rounded text-sm"
          >
            ▶
          </button>
        </div>

        <div className="text-sm text-gray-700 sm:text-right">
          <div>
            朝食平均：
            <span className="font-semibold">{monthlyStats.morningAvg.toFixed(1)}</span> 人 / 日
          </div>
          <div>
            夕食平均：
            <span className="font-semibold">{monthlyStats.eveningAvg.toFixed(1)}</span> 人 / 日
          </div>
        </div>
      </div>

      {/* カレンダー */}
      <div className="bg-white p-4 rounded shadow">
        <div className="grid grid-cols-7 text-center font-semibold text-gray-600 text-xs">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-[2px] mt-1">
          {calendarDays.map((d, idx) => {
            const key = formatDate(d);
            const inside = d.getMonth() === currentMonth.getMonth();
            const dayData = monthlyData[key] || {
              morningCount: 0,
              eveningCount: 0,
            };

            return (
              <button
                key={idx}
                type="button"
                onClick={() => openModal(d)}  // ★ 修正済み：Date を直接渡す
                className={`h-20 border rounded px-1 py-1 text-[11px] flex flex-col items-center justify-start
                  ${inside ? "bg-white" : "bg-gray-100 text-gray-400"}
                  hover:bg-blue-50`}
              >
                <div className="font-semibold mb-1">{d.getDate()}</div>
                <div className="text-[10px] text-blue-700">朝: {dayData.morningCount}</div>
                <div className="text-[10px] text-orange-700">夕: {dayData.eveningCount}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* モーダル */}
      {modalInfo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl space-y-4">
            <h2 className="text-lg font-bold">{modalInfo.dateKey} の投票者</h2>

            {/* 未投票者追加 */}
            <div className="border rounded p-3 space-y-2">
              <div className="text-sm font-semibold">未投票者の追加</div>

              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <select
                  className="border rounded px-2 py-1 text-sm flex-1"
                  value={modalSelectedUserId}
                  onChange={(e) => setModalSelectedUserId(e.target.value)}
                >
                  <option value="">未投票者を選択</option>
                  {getMissingUsers(modalInfo.dateKey).map((u) => (
                    <option key={u.id} value={u.id}>
                      {getUserDisplayName(u)}
                    </option>
                  ))}
                </select>

                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={modalMealType}
                  onChange={(e) => setModalMealType(e.target.value)}
                >
                  <option value="morning">朝食</option>
                  <option value="evening">夕食</option>
                  <option value="both">両方</option>
                </select>

                <button
                  onClick={handleAddVote}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  disabled={!modalSelectedUserId}
                >
                  追加
                </button>
              </div>
            </div>

            {/* 朝/夕 2カラム */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <section>
                <h3 className="font-semibold text-sm mb-1">朝食</h3>
                {modalInfo.morningNames.length === 0 ? (
                  <p className="text-sm text-gray-500">投票者なし</p>
                ) : (
                  <ul className="list-disc ml-5 text-sm max-h-56 overflow-auto">
                    {modalInfo.morningNames.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="font-semibold text-sm mb-1">夕食</h3>
                {modalInfo.eveningNames.length === 0 ? (
                  <p className="text-sm text-gray-500">投票者なし</p>
                ) : (
                  <ul className="list-disc ml-5 text-sm max-h-56 overflow-auto">
                    {modalInfo.eveningNames.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <button
              onClick={closeModal}
              className="w-full mt-2 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
