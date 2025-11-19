// /webapp/src/components/DutyWeekView.jsx
// 週間当番ビュー（7日間カード表示）
// ReminderApp Ver.3.1

import React from "react";

const DUTY_TYPE_LABELS = {
  garbage: "ゴミ当番",
  garbage1: "ゴミ当番1",
  garbage2: "ゴミ当番2",
  bath: "風呂当番",
};

function formatDayLabel(date) {
  const d = new Date(date);
  const weekdayJP = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdayJP})`;
}

/**
 * props:
 * - dates: string[] ("YYYY-MM-DD" の配列 7日分)
 * - dutiesByDate: { [dateStr]: Duty[] }
 * - userMap: { [uid]: display_name }
 * - isAdmin: boolean
 * - onClickDate: (dateStr: string) => void （admin のみ編集モーダルを開く）
 */
function DutyWeekView({ dates, dutiesByDate, userMap, isAdmin, onClickDate }) {
  const getUserName = (uid) => {
    if (!uid) return "（未割当）";
    const u = userMap[uid];
    return u?.display_name || u?.name || uid;
  };

  const cardColorByStatus = (status) => {
    if (status === "done") return "bg-emerald-100 border-emerald-300 text-emerald-900";
    if (status === "pending") return "bg-blue-100 border-blue-300 text-blue-900";
    return "bg-gray-100 border-gray-300 text-gray-800";
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {dates.map((dateStr) => {
        const duties = dutiesByDate[dateStr] || [];

        return (
          <button
            key={dateStr}
            type="button"
            className="min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm active:scale-[0.98]"
            onClick={() => isAdmin && onClickDate(dateStr)}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                {formatDayLabel(dateStr)}
              </div>
              {isAdmin && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                  編集
                </span>
              )}
            </div>

            {duties.length === 0 ? (
              <p className="text-xs text-gray-500">当番は登録されていません。</p>
            ) : (
              <div className="space-y-2">
                {duties.map((duty) => (
                  <div
                    key={duty.id}
                    className={`rounded-md border px-2 py-1.5 text-xs ${cardColorByStatus(
                      duty.status
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {DUTY_TYPE_LABELS[duty.type] || "当番"}
                      </span>
                      <span className="text-[10px] opacity-80">
                        {duty.status === "done"
                          ? "完了"
                          : duty.status === "pending"
                          ? "未完了"
                          : "未設定"}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px]">{getUserName(duty.assigned_to)}</div>
                  </div>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default DutyWeekView;
