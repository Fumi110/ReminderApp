// /src/components/HistoryTab.jsx
// ReminderApp Ver.3.1 — 一般ユーザー向け「履歴」タブ
// ・月次カレンダー
// ・朝食/夕食の人数のみ集計
// ・日付クリックで親コンポーネント（Votes.jsx）のモーダルを開く

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { formatDate } from "../utils/datejs";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function HistoryTab({ onDateClick }) {
  const [historyMonth, setHistoryMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [historyMonthlyData, setHistoryMonthlyData] = useState({});
  const [historyStats, setHistoryStats] = useState({
    morningAvg: 0,
    eveningAvg: 0,
  });

  useEffect(() => {
    const loadMonthVotes = async () => {
      const y = historyMonth.getFullYear();
      const m = historyMonth.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();

      const result = {};
      let totalMorning = 0;
      let totalEvening = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(y, m, day);
        const key = formatDate(d);
        const snap = await getDoc(doc(db, "meal_votes", key));

        let morningCount = 0;
        let eveningCount = 0;

        if (snap.exists()) {
          const votes = snap.data().votes || {};

          Object.values(votes).forEach((v) => {
            if (v?.morning) morningCount++;
            if (v?.evening) eveningCount++;
          });
        }

        totalMorning += morningCount;
        totalEvening += eveningCount;

        result[key] = {
          morningCount,
          eveningCount,
        };
      }

      setHistoryMonthlyData(result);

      const divisor = daysInMonth || 1;
      setHistoryStats({
        morningAvg: totalMorning / divisor,
        eveningAvg: totalEvening / divisor,
      });
    };

    loadMonthVotes();
  }, [historyMonth]);

  const getHistoryCalendarDays = () => {
    const year = historyMonth.getFullYear();
    const month = historyMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // 日曜始まり

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const historyCalendarDays = getHistoryCalendarDays();
  const historyYmLabel = `${historyMonth.getFullYear()}年${
    historyMonth.getMonth() + 1
  }月`;

  const prevHistoryMonth = () => {
    const d = new Date(historyMonth);
    d.setMonth(d.getMonth() - 1);
    setHistoryMonth(d);
  };

  const nextHistoryMonth = () => {
    const d = new Date(historyMonth);
    d.setMonth(d.getMonth() + 1);
    setHistoryMonth(d);
  };

  return (
    <div className="space-y-4">
      {/* 月次サマリー + 月ナビ */}
      <div className="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={prevHistoryMonth}
            className="px-3 py-1 border rounded text-sm"
          >
            ◀
          </button>
          <div className="font-semibold text-lg">{historyYmLabel}</div>
          <button
            onClick={nextHistoryMonth}
            className="px-3 py-1 border rounded text-sm"
          >
            ▶
          </button>
        </div>

        <div className="text-sm text-gray-700 space-y-1 sm:text-right">
          <div>
            朝食平均：{" "}
            <span className="font-semibold">
              {historyStats.morningAvg.toFixed(1)}
            </span>
            人 / 日
          </div>
          <div>
            夕食平均：{" "}
            <span className="font-semibold">
              {historyStats.eveningAvg.toFixed(1)}
            </span>
            人 / 日
          </div>
        </div>
      </div>

      {/* カレンダー */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <div className="grid grid-cols-7 text-center font-semibold text-gray-600 text-xs">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-[2px] mt-1">
          {historyCalendarDays.map((d, idx) => {
            const key = formatDate(d);
            const isCurrentMonth = d.getMonth() === historyMonth.getMonth();
            const dayData = historyMonthlyData[key] || {
              morningCount: 0,
              eveningCount: 0,
            };

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onDateClick && onDateClick(key)}
                className={`h-20 border rounded px-1 py-1 text-[11px] flex flex-col items-center justify-start
                  ${
                    isCurrentMonth
                      ? "bg-white"
                      : "bg-gray-100 text-gray-400"
                  }
                  hover:bg-blue-50
                `}
              >
                <div className="font-semibold mb-1">{d.getDate()}</div>
                <div className="text-[10px] text-blue-700">
                  朝: {dayData.morningCount}
                </div>
                <div className="text-[10px] text-orange-700">
                  夕: {dayData.eveningCount}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
