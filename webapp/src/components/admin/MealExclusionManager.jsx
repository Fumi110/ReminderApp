// /src/components/admin/MealExclusionManager.jsx
// ReminderApp Ver.3.1 — 食数管理：除外設定（毎週 + カレンダー統合）

import { useEffect, useState } from "react";
import {
  getStartOfMonth,
  getEndOfMonth,
  addDays,
  addMonths,
  formatDate,
} from "../../utils/datejs";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function MealExclusionManager({ onUnsavedChange }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // JS 版（型を排除）
  const [weeklyHolidays, setWeeklyHolidays] = useState([]);
  const [excludedDates, setExcludedDates] = useState([]);
  const [skipWeeklyDates, setSkipWeeklyDates] = useState([]);

  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (onUnsavedChange) {
      onUnsavedChange(dirty);
    }
  }, [dirty, onUnsavedChange]);

  const markDirty = () => {
    if (!dirty) setDirty(true);
  };

  // カレンダー生成
  const buildCalendarDates = () => {
    const start = getStartOfMonth(currentMonth);
    const end = getEndOfMonth(currentMonth);

    const calendarStart = new Date(start);
    calendarStart.setDate(start.getDate() - start.getDay());

    const dates = [];
    let iter = new Date(calendarStart);

    while (iter <= end || iter.getDay() !== 0) {
      dates.push(new Date(iter));
      iter = addDays(iter, 1);
    }

    return dates;
  };

  const dates = buildCalendarDates();

  // 毎週の休みトグル
  const toggleWeeklyHoliday = (dow) => {
    setWeeklyHolidays((prev) => {
      let next;
      if (prev.includes(dow)) {
        next = prev.filter((d) => d !== dow);

        // 解除した曜日に関連する skipWeeklyDates を削除
        setSkipWeeklyDates((prevSkip) =>
          prevSkip.filter((dateStr) => {
            const d = new Date(dateStr);
            return d.getDay() !== dow;
          })
        );
      } else {
        next = [...prev, dow];
      }
      return next;
    });
    markDirty();
  };

  // 日付クリック
  const toggleDate = (dateStr) => {
    const d = new Date(dateStr);
    const dow = d.getDay();
    const isWeekly = weeklyHolidays.includes(dow);

    if (isWeekly) {
      setSkipWeeklyDates((prev) => {
        if (prev.includes(dateStr)) {
          return prev.filter((s) => s !== dateStr);
        }
        return [...prev, dateStr];
      });
      markDirty();
      return;
    }

    setExcludedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      }
      return [...prev, dateStr];
    });
    markDirty();
  };

  const isHolidayDate = (d) => {
    const key = formatDate(d);
    const dow = d.getDay();
    const isWeekly = weeklyHolidays.includes(dow);
    const isSkippedWeekly = skipWeeklyDates.includes(key);
    const isExtraExcluded = excludedDates.includes(key);

    if (isWeekly && !isSkippedWeekly) return true;
    if (isExtraExcluded) return true;
    return false;
  };

  const goPrevMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1));
  };

  const goNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const saveExclusions = () => {
    const payload = {
      weekly_holidays: weeklyHolidays,
      excluded_dates: excludedDates,
      skip_weekly_dates: skipWeeklyDates,
    };

    console.log("📌 保存データ:", payload);
    alert("除外設定を保存しました（現在はコンソール出力のみ）");
    setDirty(false);
  };

  const ymLabel = `${currentMonth.getFullYear()}年 ${
    currentMonth.getMonth() + 1
  }月`;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">食数管理：除外設定</h1>

      <section className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="text-lg font-semibold">休み日設定</h2>

        {/* 曜日ボタン */}
        <div className="grid grid-cols-7 gap-2">
          {WEEK_LABELS.map((w, idx) => {
            const active = weeklyHolidays.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => toggleWeeklyHoliday(idx)}
                className={`py-2 rounded border text-center text-sm ${
                  active ? "bg-red-100 border-red-400" : "bg-gray-50"
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>

        {/* カレンダー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={goPrevMonth}
              className="px-3 py-1 border rounded text-sm"
            >
              ←
            </button>
            <div className="font-semibold text-lg">{ymLabel}</div>
            <button
              onClick={goNextMonth}
              className="px-3 py-1 border rounded text-sm"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-600">
            {WEEK_LABELS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mt-1">
            {dates.map((d, idx) => {
              const key = formatDate(d);
              const isCurrentMonth = d.getMonth() === currentMonth.getMonth();
              const textClass = isCurrentMonth
                ? "text-gray-900"
                : "text-gray-300";

              const holiday = isHolidayDate(d);

              return (
                <div
                  key={idx}
                  onClick={() => toggleDate(key)}
                  className={`h-12 flex items-center justify-center border rounded cursor-pointer text-sm ${textClass} ${
                    holiday ? "bg-red-100 border-red-400" : "bg-white"
                  }`}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <button
        onClick={saveExclusions}
        className={`w-full py-2 rounded shadow text-sm ${
          dirty
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!dirty}
      >
        変更を保存
      </button>
    </div>
  );
}
