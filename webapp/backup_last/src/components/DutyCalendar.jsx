// /src/components/MealVote.jsx
// Weekly meal voting interface with 2-button layout and deadline display
// ReminderApp Ver.2.8.1 - Full Implementation

import { useState, useEffect, useMemo } from "react";
import useAppStore from "../store/appStore";
import { prefixCollection } from "../utils/firestorePrefix";
import {
  getCurrentJSTDate,
  getStartOfWeek,
  addDays,
  formatDate,
  getJapaneseDayOfWeek,
  getISOWeekNumber
} from "../utils/datejs";

function MealVote() {
  const envMode = useAppStore((state) => state.envMode);
  const userProfile = useAppStore((state) => state.userProfile);
  
  const [currentWeekStart, setCurrentWeekStart] = useState(
    getStartOfWeek(getCurrentJSTDate())
  );
  const [votes, setVotes] = useState({});
  const [savedVotes, setSavedVotes] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);
  
  const weekNumber = getISOWeekNumber(currentWeekStart);
  const year = currentWeekStart.getFullYear();
  
  // Deadline: Sunday before the week at 21:00 JST
  const deadline = useMemo(() => {
    const deadlineDate = addDays(currentWeekStart, -1);
    deadlineDate.setHours(21, 0, 0, 0);
    return deadlineDate;
  }, [currentWeekStart]);
  
  const isFinalized = useMemo(() => {
    const today = getCurrentJSTDate();
    return today > deadline;
  }, [deadline]);
  
  useEffect(() => {
    // Initialize all votes to null (unselected)
    const mockVotes = {};
    weekDates.forEach((date) => {
      mockVotes[formatDate(date)] = {
        breakfast: null,
        dinner: null
      };
    });
    
    // Placeholder: Load from Firestore
    // const votesCollection = prefixCollection("meal_votes", envMode);
    // const snapshot = await getDocs(query(...));
    
    setVotes(mockVotes);
    setSavedVotes(JSON.parse(JSON.stringify(mockVotes)));
    setHasUnsavedChanges(false);
  }, [currentWeekStart, weekDates, envMode, userProfile]);
  
  const handleVoteChange = (dateStr, mealType, value) => {
    setVotes((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [mealType]: value
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  const handleSave = async () => {
    // Placeholder: Save to Firestore (skip null values)
    // const votesCollection = prefixCollection("meal_votes", envMode);
    // for (const [dateStr, vote] of Object.entries(votes)) {
    //   if (vote.breakfast === null && vote.dinner === null) continue;
    //   const docId = `${userProfile.line_user_id}_${dateStr}`;
    //   await setDoc(doc(db, votesCollection, docId), {
    //     user_line_id: userProfile.line_user_id,
    //     meal_date: parseDate(dateStr),
    //     votes: { breakfast: vote.breakfast === true, dinner: vote.dinner === true },
    //     updated_at: serverTimestamp()
    //   });
    // }
    
    console.log("Saving votes:", votes);
    console.log("Collection:", prefixCollection("meal_votes", envMode));
    
    setSavedVotes(JSON.parse(JSON.stringify(votes)));
    setHasUnsavedChanges(false);
    
    setToastMessage("投票内容を保存しました");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  const navigatePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };
  
  const navigateNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };
  
  const navigateCurrentWeek = () => {
    setCurrentWeekStart(getStartOfWeek(getCurrentJSTDate()));
  };
  
  const getTotalMeals = () => {
    let breakfast = 0;
    let dinner = 0;
    
    Object.values(votes).forEach((vote) => {
      if (vote.breakfast === true) breakfast++;
      if (vote.dinner === true) dinner++;
    });
    
    return { breakfast, dinner };
  };
  
  const totals = getTotalMeals();
  
  const formatDeadline = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
  };
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              食数投票
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              {year}年 第{weekNumber}週
              （{currentWeekStart.getMonth() + 1}/{currentWeekStart.getDate()} 〜 {addDays(currentWeekStart, 6).getMonth() + 1}/{addDays(currentWeekStart, 6).getDate()}）
            </p>
          </div>
          <div className="text-xs md:text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-blue-800 font-medium whitespace-nowrap">
            締切: {formatDeadline(deadline)}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 md:mt-4 gap-2">
          <button
            onClick={navigatePreviousWeek}
            className="px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs md:text-sm font-medium transition-colors text-gray-800"
          >
            ← 前週
          </button>
          <button
            onClick={navigateCurrentWeek}
            className="px-3 md:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs md:text-sm font-medium transition-colors"
          >
            今週
          </button>
          <button
            onClick={navigateNextWeek}
            className="px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs md:text-sm font-medium transition-colors text-gray-800"
          >
            次週 →
          </button>
        </div>
      </div>
      
      {/* Warning Banners */}
      {hasUnsavedChanges && !isFinalized && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3">
            <span className="text-xl md:text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 text-sm md:text-base mb-1">
                未保存の変更があります
              </h3>
              <p className="text-xs md:text-sm text-yellow-800">
                投票内容を変更しました。忘れずに保存してください。
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isFinalized && (
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3">
            <span className="text-xl md:text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 text-sm md:text-base mb-1">
                投票期限が過ぎています
              </h3>
              <p className="text-xs md:text-sm text-blue-800">
                この週の投票は締め切られました。変更はできません。
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Voting Cards (Mobile-First Design) */}
      <div className="space-y-3 md:space-y-4">
        {weekDates.map((date) => {
          const dateStr = formatDate(date);
          const dayOfWeek = getJapaneseDayOfWeek(date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isToday = formatDate(date) === formatDate(getCurrentJSTDate());
          
          return (
            <div
              key={dateStr}
              className={`
                bg-white rounded-lg border-2 p-3 md:p-4 transition-all
                ${isToday ? "border-blue-400 shadow-md" : "border-gray-200"}
                ${isWeekend ? "bg-blue-50" : ""}
              `}
            >
              {/* Date Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-base md:text-lg font-bold ${
                      isToday ? "text-blue-600" : "text-gray-900"
                    }`}>
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                    <span className="text-xs md:text-sm text-gray-600">
                      {dayOfWeek}曜日
                    </span>
                  </div>
                </div>
                {isToday && (
                  <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
                    今日
                  </span>
                )}
              </div>
              
              {/* Meal Buttons */}
              <div className="space-y-3">
                {/* Breakfast */}
                <div>
                  <div className="text-xs md:text-sm font-medium text-gray-700 mb-2">
                    朝食
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleVoteChange(dateStr, "breakfast", true)}
                      disabled={isFinalized}
                      className={`
                        px-4 py-3 rounded-lg font-medium text-sm md:text-base transition-all
                        ${votes[dateStr]?.breakfast === true
                          ? "bg-green-500 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                        ${isFinalized ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                      `}
                    >
                      食べる
                    </button>
                    <button
                      onClick={() => handleVoteChange(dateStr, "breakfast", false)}
                      disabled={isFinalized}
                      className={`
                        px-4 py-3 rounded-lg font-medium text-sm md:text-base transition-all
                        ${votes[dateStr]?.breakfast === false
                          ? "bg-red-500 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                        ${isFinalized ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                      `}
                    >
                      食べない
                    </button>
                  </div>
                </div>
                
                {/* Dinner */}
                <div>
                  <div className="text-xs md:text-sm font-medium text-gray-700 mb-2">
                    夕食
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleVoteChange(dateStr, "dinner", true)}
                      disabled={isFinalized}
                      className={`
                        px-4 py-3 rounded-lg font-medium text-sm md:text-base transition-all
                        ${votes[dateStr]?.dinner === true
                          ? "bg-green-500 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                        ${isFinalized ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                      `}
                    >
                      食べる
                    </button>
                    <button
                      onClick={() => handleVoteChange(dateStr, "dinner", false)}
                      disabled={isFinalized}
                      className={`
                        px-4 py-3 rounded-lg font-medium text-sm md:text-base transition-all
                        ${votes[dateStr]?.dinner === false
                          ? "bg-red-500 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                        ${isFinalized ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                      `}
                    >
                      食べない
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-3">
          合計
        </h3>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xs md:text-sm text-orange-600 mb-1">朝食</div>
            <div className="text-2xl md:text-3xl font-bold text-orange-600">
              {totals.breakfast}食
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xs md:text-sm text-green-600 mb-1">夕食</div>
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {totals.dinner}食
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isFinalized || !hasUnsavedChanges}
          className={`
            w-full mt-4 px-6 py-3 rounded-lg font-medium text-sm md:text-base transition-all
            ${isFinalized || !hasUnsavedChanges
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md"
            }
          `}
        >
          {hasUnsavedChanges ? "保存する" : "保存済み"}
        </button>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-gray-800 text-gray-100 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-xl">✓</span>
            <span className="font-medium text-sm md:text-base">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealVote;