// /src/components/admin/AdminDutyCycle.jsx
// Admin-only UI for managing duty_cycle_current and weekly_excluded
// ReminderApp Ver.3.1 — Phase C3

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";

import useAppStore from "../../store/appStore";
import {
  getStartOfWeek,
  getEndOfWeek,
  formatDate,
  addDays,
} from "../../utils/datejs";

export default function AdminDutyCycle() {
  const isAdmin = useAppStore((state) => state.isAdmin);

  // 全ユーザー
  const [users, setUsers] = useState([]);

  // duty_cycle_current
  const [cycle, setCycle] = useState({});
  const [loadingCycle, setLoadingCycle] = useState(true);

  // weekly_excluded
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const [excluded, setExcluded] = useState([]);
  const [loadingExcluded, setLoadingExcluded] = useState(true);

  const weekRangeLabel = `${formatDate(weekStart)} ~ ${formatDate(
    getEndOfWeek(weekStart)
  )}`;

  // ---------------------------------------------------------
  // Load users
  // ---------------------------------------------------------
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const arr = [];
      snap.forEach((d) => arr.push({ uid: d.id, ...d.data() }));
      setUsers(arr);
    };
    loadUsers();
  }, []);

  // ---------------------------------------------------------
  // Load duty_cycle_current
  // ---------------------------------------------------------
  useEffect(() => {
    const loadCycle = async () => {
      const ref = doc(db, "config", "duty_cycle_current");
      const snap = await getDoc(ref);
      if (snap.exists()) setCycle(snap.data());
      setLoadingCycle(false);
    };
    loadCycle();
  }, []);

  // ---------------------------------------------------------
  // Load weekly_excluded
  // ---------------------------------------------------------
  useEffect(() => {
    const loadExcluded = async () => {
      const ref = doc(db, "config", "weekly_excluded");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        const key = `${formatDate(weekStart)}~${formatDate(
          getEndOfWeek(weekStart)
        )}`;
        setExcluded(data[key] || []);
      }
      setLoadingExcluded(false);
    };
    loadExcluded();
  }, [weekStart]);

  // ---------------------------------------------------------
  // Save cycle
  // ---------------------------------------------------------
  const saveCycle = async () => {
    await updateDoc(doc(db, "config", "duty_cycle_current"), cycle);
    alert("当番サイクルを更新しました。");
  };

  // ---------------------------------------------------------
  // Save excluded
  // ---------------------------------------------------------
  const saveExcluded = async () => {
    const ref = doc(db, "config", "weekly_excluded");

    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};

    const newData = {
      ...data,
      [weekRangeLabel]: excluded,
    };

    await updateDoc(ref, newData);
    alert("免除者リストを更新しました。");
  };

  // ---------------------------------------------------------
  // UI Components
  // ---------------------------------------------------------
  if (!isAdmin)
    return <div className="text-red-600">管理者のみアクセスできます。</div>;

  if (loadingCycle || loadingExcluded)
    return <div className="p-4 text-gray-600">読み込み中...</div>;

  return (
    <div className="space-y-6">
      {/* Duty cycle editor */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          当番サイクル管理
        </h3>

        <div className="space-y-4">
          {Object.keys(cycle).map((dutyType) => (
            <div key={dutyType}>
              <div className="mb-1 text-gray-700 font-medium">
                {dutyType === "garbage" && "ゴミ出し当番"}
                {dutyType === "bath" && "風呂掃除当番"}
              </div>

              <select
                className="w-full border p-2 rounded"
                value={cycle[dutyType]}
                onChange={(e) =>
                  setCycle({ ...cycle, [dutyType]: e.target.value })
                }
              >
                <option value="">未設定</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.name || u.uid}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <button
          onClick={saveCycle}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          保存
        </button>
      </div>

      {/* Weekly exclusion editor */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          週別免除者管理
        </h3>

        {/* Week navigation */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            ← 前週
          </button>
          <div className="font-medium">{weekRangeLabel}</div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            次週 →
          </button>
        </div>

        {/* Multi-select exclusion */}
        <div className="space-y-2">
          {users.map((u) => (
            <label key={u.uid} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={excluded.includes(u.uid)}
                onChange={() => {
                  if (excluded.includes(u.uid)) {
                    setExcluded(excluded.filter((x) => x !== u.uid));
                  } else {
                    setExcluded([...excluded, u.uid]);
                  }
                }}
              />
              <span>{u.name || u.uid}</span>
            </label>
          ))}
        </div>

        <button
          onClick={saveExcluded}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          保存
        </button>
      </div>
    </div>
  );
}
