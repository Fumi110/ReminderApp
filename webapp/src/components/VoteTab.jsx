// /src/components/VoteTab.jsx
// ReminderApp Ver.3.1 — React Error #31 永久対策版（完全週次食数投票 UI）

import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

import {
  getStartOfWeek,
  addDays,
  formatDate,
  getJapaneseDayOfWeek,
  parseDate,
  getCurrentJSTDate,
} from "../utils/datejs";

export default function VoteTab({ uid, onUnsavedChange }) {
  const [weekStart, setWeekStart] = useState(
    formatDate(getStartOfWeek(new Date()))
  );

  const [weekVotes, setWeekVotes] = useState({});
  const [weekLoading, setWeekLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const nowJST = getCurrentJSTDate();

  /** UI 表示用の日付ラベル */
  function formatDateLabel(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const w = getJapaneseDayOfWeek(date);
    return `${m}/${d}(${w})`;
  }

  /** 週範囲・締切を計算 */
  const { weekLabel, deadlineLabel, isClosed } = useMemo(() => {
    const monday = parseDate(weekStart);
    const startLabel = formatDateLabel(monday);
    const endLabel = formatDateLabel(addDays(monday, 6));

    // 前週金曜 24:00 = 月曜 -3日（＝金曜 23:59:59）
    const deadlineDate = addDays(monday, -3);
    const deadline = new Date(deadlineDate);
    deadline.setHours(23, 59, 59, 999);

    const closed = nowJST > deadline;

    return {
      weekLabel: `${startLabel} 〜 ${endLabel}`,
      deadlineLabel: `${formatDateLabel(deadlineDate)} 24:00`,
      isClosed: closed,
    };
  }, [weekStart, nowJST]);

  /** 週の日付配列 */
  const getWeekDates = () => {
    const base = parseDate(weekStart);
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(base, i);
      return { date, key: formatDate(date) };
    });
  };

  /** Firestore から週の投票をロード */
  useEffect(() => {
    if (!uid) return;

    const loadWeek = async () => {
      setWeekLoading(true);
      const base = parseDate(weekStart);

      const result = {};

      for (let i = 0; i < 7; i++) {
        const d = addDays(base, i);
        const key = formatDate(d);

        const ref = doc(db, "meal_votes", key);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const raw = snap.data()?.votes?.[uid];
          result[key] = {
            morning: raw?.morning === true,
            evening: raw?.evening === true,
          };
        } else {
          result[key] = { morning: false, evening: false };
        }
      }

      setWeekVotes(result);
      setHasUnsavedChanges(false);
      setWeekLoading(false);
    };

    loadWeek();
  }, [uid, weekStart]);

  /** 未保存状態を親へ通知 */
  useEffect(() => {
    if (onUnsavedChange) onUnsavedChange(hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  /** チェックを切り替え */
  const toggleVote = (dateKey, field) => {
    if (isClosed) return;

    setWeekVotes((prev) => {
      const d = prev[dateKey] || { morning: false, evening: false };
      return {
        ...prev,
        [dateKey]: {
          ...d,
          [field]: !d[field],
        },
      };
    });

    setHasUnsavedChanges(true);
  };

  /** 週移動 */
  const changeWeek = (offset) => {
    if (hasUnsavedChanges) {
      const ok = window.confirm(
        "この週の変更が保存されていません。\n保存せずに移動すると入力内容が失われます。\n移動しますか？"
      );
      if (!ok) return;
    }

    const base = parseDate(weekStart);
    const next = addDays(base, offset * 7);
    setWeekStart(formatDate(next));
    setHasUnsavedChanges(false);
  };

  /** Firestore へ保存 */
  const saveWeekVotes = async () => {
    if (isClosed || !uid) return;

    setWeekLoading(true);

    try {
      const base = parseDate(weekStart);

      for (let i = 0; i < 7; i++) {
        const d = addDays(base, i);
        const key = formatDate(d);

        const current = weekVotes[key] || { morning: false, evening: false };

        const ref = doc(db, "meal_votes", key);
        const snap = await getDoc(ref);

        const existing = snap.exists() ? snap.data() : {};
        const votes = existing.votes || {};

        votes[uid] = {
          morning: current.morning === true,
          evening: current.evening === true,
        };

        await setDoc(ref, { ...existing, votes }, { merge: false });
      }

      alert("この週の食数投票を保存しました。");
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error(e);
      alert("保存中にエラー: " + e.message);
    }

    setWeekLoading(false);
  };

  const dates = getWeekDates();
  const saveDisabled = weekLoading || isClosed || !hasUnsavedChanges;

  return (
    <div className="space-y-4">

      {/* 週ナビ */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <div className="flex items-center justify-between">
          <button onClick={() => changeWeek(-1)}
            className="px-3 py-1 border rounded text-sm">
            ◀
          </button>

          <div className="text-sm font-semibold">{weekLabel}</div>

          <button onClick={() => changeWeek(1)}
            className="px-3 py-1 border rounded text-sm">
            ▶
          </button>
        </div>

        <div className="text-xs text-gray-600">
          この週の締切： <b>{deadlineLabel}</b>
        </div>

        {isClosed && (
          <div className="text-xs text-red-600">
            ※ この週は締切済みのため変更できません
          </div>
        )}
      </div>

      {/* 投票テーブル */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h3 className="font-semibold text-lg">今週の食数投票</h3>

        {weekLoading ? (
          <p className="text-sm text-gray-600">読み込み中...</p>
        ) : (
          <>
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 border w-32">日付</th>
                  <th className="px-2 py-1 border">朝食</th>
                  <th className="px-2 py-1 border">夕食</th>
                </tr>
              </thead>
              <tbody>
                {dates.map(({ date, key }) => {
                  const v = weekVotes[key] || {
                    morning: false,
                    evening: false,
                  };

                  return (
                    <tr key={key}
                      className={`text-center ${isClosed ? "bg-gray-100 text-gray-400" : ""}`}>
                      
                      <td className="border px-2 py-1">
                        {formatDateLabel(date)}
                      </td>

                      <td className="border px-2 py-1">
                        <label className="inline-flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={v.morning}
                            disabled={isClosed}
                            onChange={() => toggleVote(key, "morning")}
                          />
                          食べる
                        </label>
                      </td>

                      <td className="border px-2 py-1">
                        <label className="inline-flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={v.evening}
                            disabled={isClosed}
                            onChange={() => toggleVote(key, "evening")}
                          />
                          食べる
                        </label>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 保存ボタン */}
            <div className="mt-3 flex justify-end">
              <button
                disabled={saveDisabled}
                onClick={saveWeekVotes}
                className={`px-4 py-2 rounded text-sm ${
                  saveDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {weekLoading ? "保存中..." : "この週を保存"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
