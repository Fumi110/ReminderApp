// /webapp/src/components/Home.jsx
// Home dashboard with quick links and current date info
// ReminderApp Ver.2.8.1

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import useAppStore from "../store/appStore";
import { 
  getCurrentJSTDate, 
  formatYearMonth, 
  getISOWeekNumber,
  getJapaneseDayOfWeek,
  getStartOfAcademicYear
} from "../utils/datejs";

function Home() {
  const userProfile = useAppStore((state) => state.userProfile);
  const isAdmin = useAppStore((state) => state.isAdmin);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  const [currentDate, setCurrentDate] = useState(getCurrentJSTDate());
  
  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(getCurrentJSTDate());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const weekNumber = getISOWeekNumber(currentDate);
  const dayOfWeek = getJapaneseDayOfWeek(currentDate);
  const yearMonth = formatYearMonth(currentDate);
  const academicYearStart = getStartOfAcademicYear(currentDate);
  
  const quickLinks = [
    {
      to: "/calendar",
      title: "当番カレンダー",
      description: "今週の当番を確認",
      icon: "📅",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
    },
    {
      to: "/meals",
      title: "食数投票",
      description: "来週の食事予定を登録",
      icon: "🍽️",
      color: "bg-green-50 hover:bg-green-100 border-green-200"
    },
    ...(isAdmin ? [{
      to: "/admin",
      title: "管理パネル",
      description: "不要日設定・統計確認",
      icon: "⚙️",
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200"
    }] : []),
    {
      to: "/settings",
      title: "設定",
      description: "通知設定・プロフィール編集",
      icon: "🔧",
      color: "bg-gray-50 hover:bg-gray-100 border-gray-200"
    }
  ];
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ReminderApp へようこそ
          </h2>
          <p className="text-gray-600 mb-6">
            学寮の当番管理・食数投票システム
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            LINE でログイン
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          おかえりなさい、{userProfile?.name || "ユーザー"}さん
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span>
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月{currentDate.getDate()}日
              （{dayOfWeek}）
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span>第{weekNumber}週</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <span>
              年度: {academicYearStart.getFullYear()}年度
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`
              block p-6 rounded-lg border-2 transition-all
              ${link.color}
              hover:shadow-md hover:scale-105
            `}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {link.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {link.description}
                </p>
              </div>
              <div className="text-gray-400">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">今月の当番</div>
          <div className="text-2xl font-bold text-gray-900">
            {yearMonth}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">今週</div>
          <div className="text-2xl font-bold text-gray-900">
            第{weekNumber}週
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">役割</div>
          <div className="text-2xl font-bold text-gray-900">
            {isAdmin ? "管理者" : "一般"}
          </div>
        </div>
      </div>
      
      {/* Reminders Section */}
      <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>今週のリマインダー</span>
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0">•</span>
            <span>来週の食数投票期限は今週日曜日までです</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0">•</span>
            <span>当番完了後は忘れずに報告してください</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0">•</span>
            <span>交代が必要な場合は早めに申請しましょう</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Home;