// /src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import useAppStore from "../../store/appStore";
import { getCurrentJSTDate, formatDate } from "../../utils/datejs";
import { prefixCollection } from "../../utils/firestorePrefix";
import { getUserDisplayName } from "../../utils/userName";

export default function AdminDashboard() {
  const envMode = useAppStore((s) => s.envMode);
  const [todayDuties, setTodayDuties] = useState([]);
  const [mealSummary, setMealSummary] = useState({
    morningCount: 0,
    eveningCount: 0,
    missingUsers: [],
  });

  const today = getCurrentJSTDate();
  const todayKey = formatDate(today);

  // 今日の当番読み込み
  useEffect(() => {
    const loadTodayDuties = async () => {
      const q = query(
        collection(db, "duties"),
        where("date", "==", todayKey)
      );
      const snap = await getDocs(q);

      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTodayDuties(arr);
    };

    loadTodayDuties();
  }, [todayKey]);

  // 今日の食数投票読み込み
  useEffect(() => {
    const loadMealVotes = async () => {
      const usersCol = prefixCollection("users", envMode);
      const userSnap = await getDocs(collection(db, usersCol));
      const users = userSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const ref = doc(db, "meal_votes", todayKey);
      const voteSnap = await getDoc(ref);

      if (!voteSnap.exists()) {
        setMealSummary({
          morningCount: 0,
          eveningCount: 0,
          missingUsers: users.map((u) => getUserDisplayName(u)),
        });
        return;
      }

      const votes = voteSnap.data().votes || {};
      let morning = 0;
      let evening = 0;

      Object.values(votes).forEach((v) => {
        if (v.morning) morning++;
        if (v.evening) evening++;
      });

      const missing = users
        .filter((u) => !votes[u.id] || (!votes[u.id].morning && !votes[u.id].evening))
        .map((u) => getUserDisplayName(u));

      setMealSummary({
        morningCount: morning,
        eveningCount: evening,
        missingUsers: missing,
      });
    };

    loadMealVotes();
  }, [todayKey, envMode]);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">管理ダッシュボード</h1>

      {/* 当番 */}
      <section className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-lg font-semibold mb-2">🧹 今日の当番</h2>
        <p className="text-sm text-gray-500">{todayKey}</p>

        {todayDuties.length === 0 ? (
          <p className="text-gray-600">データなし</p>
        ) : (
          <div className="space-y-2">
            {todayDuties.map((d) => (
              <div key={d.id} className="border p-3 rounded">
                <div className="font-bold">{d.type}</div>
                <div className="text-sm">
                  担当: {getUserDisplayName(d.userProfile || {})}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 食数 */}
      <section className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-lg font-semibold mb-2">🍚 今日の食数</h2>

        <div className="flex gap-3">
          <div className="flex-1 bg-blue-50 p-3 rounded border">
            <div className="text-xs text-gray-600">朝食</div>
            <div className="text-xl font-bold text-blue-700">
              {mealSummary.morningCount} 人
            </div>
          </div>

          <div className="flex-1 bg-orange-50 p-3 rounded border">
            <div className="text-xs text-gray-600">夕食</div>
            <div className="text-xl font-bold text-orange-700">
              {mealSummary.eveningCount} 人
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xs font-semibold mb-1">未提出者</div>
          {mealSummary.missingUsers.length === 0 ? (
            <p className="text-sm text-gray-600">全員が提出済みです。</p>
          ) : (
            <ul className="text-sm list-disc ml-4">
              {mealSummary.missingUsers.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
