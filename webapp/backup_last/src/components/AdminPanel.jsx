// /src/components/AdminPanel.jsx
// Holiday management panel for admin users with data persistence
// ReminderApp Ver.2.8.1 - Full Implementation

import { useState, useMemo, useEffect } from "react";
import useAppStore from "../store/appStore";
import { prefixCollection } from "../utils/firestorePrefix";
import {
  getCurrentJSTDate,
  getStartOfMonth,
  getEndOfMonth,
  addDays,
  formatDate,
  getJapaneseDayOfWeek,
  isSameDay
} from "../utils/datejs";

function AdminPanel() {
  const envMode = useAppStore((state) => state.envMode);
  const isAdmin = useAppStore((state) => state.isAdmin);
  const holidayDataStore = useAppStore((state) => state.holidayData);
  const saveHolidays = useAppStore((state) => state.saveHolidays);
  const loadHolidays = useAppStore((state) => state.loadHolidays);
  
  const [currentDate, setCurrentDate] = useState(getCurrentJSTDate());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const presets = [
    {
      id: "preset_newyear",
      name: "年末年始",
      dateRange: {
        start: new Date(currentDate.getFullYear(), 11, 28),
        end: new Date(currentDate.getFullYear() + 1, 0, 5)
      }
    },
    {
      id: "preset_golden_week",
      name: "ゴールデンウィーク",
      dateRange: {
        start: new Date(currentDate.getFullYear(), 4, 1),
        end: new Date(currentDate.getFullYear(), 4, 7)
      }
    }
  ];
  
  // Load holidays for current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const key = `${year}-${month}`;
    
    if (!holidayDataStore[key]) {
      // Initialize empty holidays for this month
      saveHolidays(year, month, new Set());
    }
  }, [currentDate, holidayDataStore, saveHolidays]);
  
  const dateRange = useMemo(() => {
    const start = getStartOfMonth(currentDate);
    const end = getEndOfMonth(currentDate);
    const startDay = start.getDay();
    const extendedStart = addDays(start, -startDay);
    const endDay = end.getDay();
    const extendedEnd = addDays(end, 6 - endDay);
    return { start: extendedStart, end: extendedEnd };
  }, [currentDate]);
  
  const dates = useMemo(() => {
    const datesArray = [];
    let current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      datesArray.push(new Date(current));
      current = addDays(current, 1);
    }
    return datesArray;
  }, [dateRange]);
  
  const getCurrentMonthHolidays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const key = `${year}-${month}`;
    return holidayDataStore[key] || new Set();
  };
  
  const handleDateClick = (date) => {
    if (!isAdmin) return;
    
    const dateStr = formatDate(date);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const key = `${year}-${month}`;
    const currentHolidays = new Set(holidayDataStore[key] || []);
    
    if (currentHolidays.has(dateStr)) {
      currentHolidays.delete(dateStr);
      showToastMessage(`${dateStr} を不要日から解除しました`);
    } else {
      currentHolidays.add(dateStr);
      showToastMessage(`${dateStr} を不要日に設定しました`);
    }
    
    saveHolidays(year, month, currentHolidays);
    
    // Placeholder: Save to Firestore
    // const holidaysCollection = prefixCollection("holidays", envMode);
    console.log("Saving holiday:", dateStr, "to collection:", prefixCollection("holidays", envMode));
  };
  
  const handleApplyPreset = (preset) => {
    if (!isAdmin) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const key = `${year}-${month}`;
    const currentHolidays = new Set(holidayDataStore[key] || []);
    
    let current = new Date(preset.dateRange.start);
    const end = preset.dateRange.end;
    
    while (current <= end) {
      currentHolidays.add(formatDate(current));
      current = addDays(current, 1);
    }
    
    saveHolidays(year, month, currentHolidays);
    showToastMessage(`プリセット「${preset.name}」を適用しました`);
  };
  
  const handleClearMonth = () => {
    if (!isAdmin) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    saveHolidays(year, month, new Set());
    showToastMessage(`${year}年${month + 1}月の不要日を全て解除しました`);
  };
  
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  const navigatePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const navigateNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  const navigateToday = () => {
    setCurrentDate(getCurrentJSTDate());
  };
  
  const isCurrentMonth = (date) => date.getMonth() === currentDate.getMonth();
  const isToday = (date) => isSameDay(date, getCurrentJSTDate());
  const isHoliday = (date) => getCurrentMonthHolidays().has(formatDate(date));
  
  const getHolidayCountForMonth = () => {
    const monthStart = getStartOfMonth(currentDate);
    const monthEnd = getEndOfMonth(currentDate);
    
    return Array.from(getCurrentMonthHolidays()).filter((dateStr) => {
      const date = new Date(dateStr);
      return date >= monthStart && date <= monthEnd;
    }).length;
  };
  
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">
            管理者専用ページ
          </h2>
          <p className="text-red-700 mb-4">
            このページは管理者のみアクセスできます
          </p>
          <p className="text-sm text-red-600">
            管理者権限が必要な場合は、システム管理者にお問い合わせください
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>⚙️</span>
              <span>管理パネル</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
              （不要日: {getHolidayCountForMonth()}日）
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 md:mt-4 gap-2">
          <button
            onClick={navigatePreviousMonth}
            className="px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs md:text-sm font-medium transition-colors text-gray-800"
          >
            ← 前月
          </button>
          <button
            onClick={navigateToday}
            className="px-3 md:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs md:text-sm font-medium transition-colors"
          >
            今月
          </button>
          <button
            onClick={navigateNextMonth}
            className="px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs md:text-sm font-medium transition-colors text-gray-800"
          >
            次月 →
          </button>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 md:p-4">
        <h3 className="font-semibold text-blue-900 text-sm md:text-base mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>使い方</span>
        </h3>
        <ul className="text-xs md:text-sm text-blue-800 space-y-1">
          <li>• カレンダーの日付をクリックして不要日を設定/解除</li>
          <li>• 赤色の日付が不要日（当番・食数投票をスキップ）</li>
          <li>• プリセットボタンで連続した休暇期間を一括設定</li>
        </ul>
      </div>
      
      {/* Preset Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-3">
          プリセット
        </h3>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="px-3 md:px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs md:text-sm font-medium transition-colors"
            >
              {preset.name}
            </button>
          ))}
          <button
            onClick={handleClearMonth}
            className="px-3 md:px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs md:text-sm font-medium transition-colors"
          >
            今月の不要日を全て解除
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-[640px]">
          {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
            <div
              key={day}
              className={`text-center text-xs md:text-sm font-semibold py-2 ${
                index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"
              }`}
            >
              {day}
            </div>
          ))}
          
          {dates.map((date) => {
            const isCurrentMonthDate = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const isHolidayDate = isHoliday(date);
            
            return (
              <button
                key={formatDate(date)}
                onClick={() => handleDateClick(date)}
                className={`
                  min-h-[60px] md:min-h-[80px] p-2 md:p-3 rounded-lg border-2 transition-all
                  active:scale-95 md:hover:shadow-md md:hover:scale-105
                  ${isTodayDate ? "border-blue-500" : "border-gray-200"}
                  ${!isCurrentMonthDate ? "opacity-40" : ""}
                  ${isHolidayDate 
                    ? "bg-red-100 border-red-400" 
                    : isTodayDate ? "bg-blue-50" : "bg-white"
                  }
                `}
              >
                <div className={`text-base md:text-lg font-bold mb-1 ${
                  isHolidayDate ? "text-red-600" : isTodayDate ? "text-blue-600" : "text-gray-900"
                }`}>
                  {date.getDate()}
                </div>
                
                <div className="text-xs text-gray-600">
                  {getJapaneseDayOfWeek(date)}
                </div>
                
                {isHolidayDate && (
                  <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-red-700 font-semibold">
                    不要日
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600 mb-1">今月の不要日</div>
          <div className="text-2xl md:text-3xl font-bold text-red-600">
            {getHolidayCountForMonth()}日
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600 mb-1">全不要日</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {Object.values(holidayDataStore).reduce((sum, set) => sum + set.size, 0)}日
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600 mb-1">環境</div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">
            {envMode.toUpperCase()}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-gray-800 text-gray-100 px-6 py-3 rounded-lg shadow-lg max-w-sm">
            <span className="font-medium text-sm md:text-base">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;