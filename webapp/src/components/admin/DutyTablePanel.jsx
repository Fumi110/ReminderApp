// /src/components/admin/DutyTablePanel.jsx
// ReminderApp Ver.3.1 — 当番一覧（完全版）

import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { detectEnv } from "../../utils/detectEnv";
import { prefixCollection } from "../../utils/firestorePrefix";

export default function DutyTablePanel() {
  const env = detectEnv();  // "dev" | "prod"

  // Firestore コレクション名
  const dutiesCol = prefixCollection("duties", env);
  const usersCol = prefixCollection("users", env);

  // 状態
  const [duties, setDuties] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  // フィルタ
  const [filterType, setFilterType] = useState("all"); // all | bath | garbage
  const [filterDate, setFilterDate] = useState("");

  // ------------------------------------------
  // Firestore 読み込み
  // ------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        // Users 読み込み（UID → 名前）
        const usersSnap = await getDocs(collection(db, usersCol));
        const map = {};
        usersSnap.forEach((doc) => {
          map[doc.id] = doc.data().display_name || "(名前なし)";
        });
        setUsersMap(map);

        // Duties 読み込み
        const dutiesSnap = await getDocs(collection(db, dutiesCol));
        const arr = dutiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 日付でソート
        arr.sort((a, b) => (a.date > b.date ? 1 : -1));

        setDuties(arr);
      } catch (err) {
        console.error("[DutyTablePanel] load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ------------------------------------------
  // 表示用フィルタ後データ
  // ------------------------------------------
  const filtered = duties.filter((duty) => {
    if (filterType !== "all" && duty.type !== filterType) return false;
    if (filterDate && duty.date !== filterDate) return false;
    return true;
  });

  // ------------------------------------------
  // 表示
  // ------------------------------------------
  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">📅 当番一覧</h2>

      {/* ---------- フィルタ操作 ---------- */}
      <div className="flex gap-6 items-end">
        
        {/* 種類フィルタ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            種類フィルタ
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded p-2"
          >
            <option value="all">すべて</option>
            <option value="garbage">ゴミ当番</option>
            <option value="bath">風呂当番</option>
          </select>
        </div>

        {/* 日付フィルタ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            日付フィルタ
          </label>
          <input
            type="date"
            className="border rounded p-2"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            setFilterDate("");
            setFilterType("all");
          }}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          フィルタ解除
        </button>
      </div>

      {/* ---------- テーブル ---------- */}
      <div className="overflow-auto border rounded shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left">日付</th>
              <th className="px-4 py-2 text-left">種類</th>
              <th className="px-4 py-2 text-left">担当者</th>
              <th className="px-4 py-2 text-left">ステータス</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((duty) => (
              <tr key={duty.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{duty.date}</td>
                <td className="px-4 py-2">
                  {duty.type === "garbage" ? "🗑 ゴミ" : "🛁 風呂"}
                </td>

                <td className="px-4 py-2">
                  {duty.assigned
                    ?.map((uid) => usersMap[uid] || "(不明ユーザー)")
                    .join("、 ")}
                </td>

                <td className="px-4 py-2 text-gray-700">
                  {duty.status || "pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* データ0件の場合 */}
      {filtered.length === 0 && (
        <div className="text-gray-500 mt-4">該当するデータがありません。</div>
      )}
    </div>
  );
}
