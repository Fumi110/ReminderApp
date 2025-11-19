// /src/components/admin/DutyManager.jsx
// ReminderApp Ver.3.2 — 1-1: 当番生成 & 除外日設定
// ・AdminHeader を採用
// ・当番生成ロジックを最新仕様に統合
// ・週次除外日 / 単発除外日 / 除外ユーザー を統合
// ・Cloud Functions 統合版 generateWeeklyDuties() 呼び出し

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";

import useAppStore from "../../store/appStore";
import AdminHeader from "./AdminHeader"; // ← 重要：必ず先頭に差し込む

import { formatDate, addDays } from "../../utils/datejs";

export default function DutyManager() {
  const userProfile = useAppStore((s) => s.userProfile);
  const envMode = useAppStore((s) => s.envMode || "dev");

  // dev/prod 切替
  const COL_USERS = envMode === "dev" ? "development_users" : "users";
  const COL_EXCLUDED = envMode === "dev" ? "development_excluded_days" : "excluded_days";

  if (userProfile?.role !== "admin") {
    return <div className="p-4">管理者のみアクセス可能です。</div>;
  }

  // ---------------------------------------------------------
  // state
  // ---------------------------------------------------------
  const [userList, setUserList] = useState([]);
  const [excludedDates, setExcludedDates] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");
  const [excludedUsers, setExcludedUsers] = useState([]);

  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [period, setPeriod] = useState(1); // 1週間単位
  const [message, setMessage] = useState("");

  // ---------------------------------------------------------
  // LOAD: users
  // ---------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, COL_USERS));
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 例: 学年 + 五十音順
      arr.sort((a, b) => {
        const ay = a.enrollment_year ?? 9999;
        const by = b.enrollment_year ?? 9999;
        if (ay !== by) return ay - by;
        return (a.name_kana || "").localeCompare(b.name_kana || "");
      });

      setUserList(arr);
    };
    load();
  }, [COL_USERS]);

  // ---------------------------------------------------------
  // LOAD: excluded days
  // ---------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, COL_EXCLUDED));
      const arr = snap.docs.map((d) => d.id);
      setExcludedDates(arr);
    };
    load();
  }, [COL_EXCLUDED]);

  // ---------------------------------------------------------
  // EXCLUDED DAYS: toggle
  // ---------------------------------------------------------
  const toggleExcludedDate = async (dateStr) => {
    const ref = doc(db, COL_EXCLUDED, dateStr);
    if (excludedDates.includes(dateStr)) {
      await deleteDoc(ref);
      setExcludedDates(excludedDates.filter((d) => d !== dateStr));
    } else {
      await setDoc(ref, { date: dateStr });
      setExcludedDates([...excludedDates, dateStr]);
    }
  };

  // ---------------------------------------------------------
  // WEEKLY CALENDAR (6 weeks grid)
  // ---------------------------------------------------------
  const today = new Date();
  const ym = new Date(today.getFullYear(), today.getMonth(), 1);

  const getCalendarDays = () => {
    const first = new Date(ym.getFullYear(), ym.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const calendarDays = getCalendarDays();

  // ---------------------------------------------------------
  // 当番生成（Cloud Functions）
  // ---------------------------------------------------------
  const handleGenerate = async () => {
    setMessage("");

    const endDate = addDays(new Date(startDate), period * 7);

    try {
      const res = await fetch(
        "https://asia-northeast1-management-app-746a3.cloudfunctions.net/generateWeeklyDuties",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate,
            endDate: formatDate(endDate),
            excludedUsers,
            excludedDates
          })
        }
      );

      const text = await res.text();
      setMessage("✔ 当番生成が完了しました。\n" + text);
    } catch (err) {
      console.error(err);
      setMessage("❌ エラー: " + err.message);
    }
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="p-4 space-y-6">
      <AdminHeader title="当番生成" />

      {/* 期間設定 */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h3 className="font-semibold text-lg">① 生成期間</h3>

        <div className="flex gap-4 items-end">
          <div>
            <label className="text-sm">開始日</label>
            <input
              type="date"
              className="border p-2 rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">期間（週）</label>
            <input
              type="number"
              className="border p-2 rounded w-20"
              value={period}
              min={1}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* 除外ユーザー */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h3 className="font-semibold text-lg">② 除外ユーザー</h3>

        <div className="flex gap-2">
          <select
            className="border p-2 rounded"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">選択してください</option>
            {userList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name || u.name}
              </option>
            ))}
          </select>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => {
              if (selectedUser && !excludedUsers.includes(selectedUser)) {
                setExcludedUsers([...excludedUsers, selectedUser]);
              }
              setSelectedUser("");
            }}
          >
            追加
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {excludedUsers.map((uid) => {
            const u = userList.find((x) => x.id === uid);
            return (
              <span
                key={uid}
                className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm flex items-center gap-1"
              >
                {u?.display_name || u?.name}
                <button
                  className="text-xs"
                  onClick={() =>
                    setExcludedUsers(excludedUsers.filter((x) => x !== uid))
                  }
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      </div>

      {/* 単発除外日（カレンダー） */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h3 className="font-semibold text-lg">③ 休み日設定</h3>

        <div className="grid grid-cols-7 text-center font-semibold">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-center">
          {calendarDays.map((d, idx) => {
            const ds = formatDate(d);
            const isEx = excludedDates.includes(ds);
            const isCur = d.getMonth() === ym.getMonth();

            return (
              <div
                key={idx}
                onClick={() => toggleExcludedDate(ds)}
                className={`p-2 border cursor-pointer select-none
                  ${isCur ? "" : "text-gray-400 bg-gray-100"}
                  ${isEx ? "bg-blue-200" : "hover:bg-blue-50"}`}
              >
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      {/* 実行 */}
      <button
        onClick={handleGenerate}
        className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold"
      >
        当番を生成する
      </button>

      {message && (
        <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded border text-sm">
          {message}
        </pre>
      )}
    </div>
  );
}
