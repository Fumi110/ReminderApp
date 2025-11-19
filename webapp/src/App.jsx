// /src/App.jsx
// ReminderApp Ver.3.2 — Routing + HeaderBar + BottomTabBar（管理画面除外）

import { Routes, Route, useLocation } from "react-router-dom";
import useAppStore from "./store/appStore";

// Pages
import Home from "./components/Home";
import MealVote from "./components/MealVote";
import DutyCalendar from "./components/DutyCalendar";

// Admin pages
import AdminPanel from "./components/AdminPanel";
import DutyManager from "./components/admin/DutyManager";
import DutyEditor from "./components/admin/DutyEditor";
import AdminDeadline from "./components/admin/AdminDeadline";

// UI components
import BottomTabBar from "./components/BottomTabBar";
import HeaderBar from "./components/HeaderBar";

export default function App() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const userProfile = useAppStore((s) => s.userProfile);

  const location = useLocation();

  // 管理画面では bottom tab bar を隠す
  const hideTabBar = location.pathname.startsWith("/admin");

  // --- 認証待ち UI ---
  if (!isAuthenticated || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">ReminderApp へようこそ</h1>
          <p className="text-gray-600 mb-4">
            学寮の当番管理・食数投票・出欠管理システム
          </p>
          <div className="mt-4 text-blue-600 font-semibold">
            LINE アカウントで自動ログイン中…
          </div>
          <div className="text-xs text-gray-400 mt-2">
            ※ 初回アクセス時は LINE 認証画面に遷移します
          </div>
        </div>
      </div>
    );
  }

  // --- Main UI ---
  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* 常時上部に表示：管理⇄一般 右上ボタン付き */}
      <HeaderBar />

      <Routes>
        {/* 一般画面 */}
        <Route path="/" element={<Home />} />
        <Route path="/meal" element={<MealVote />} />
        <Route path="/duty" element={<DutyCalendar />} />

        {/* 管理トップ */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* 1-1 当番生成/除外設定 */}
        <Route path="/admin/duty-manager" element={<DutyManager />} />

        {/* 1-2 当番編集（カレンダー + 手動修正） */}
        <Route path="/admin/duty-editor" element={<DutyEditor />} />

        {/* 〆切管理 */}
        <Route path="/admin/deadlines" element={<AdminDeadline />} />

        {/* fallback */}
        <Route path="*" element={<div className="p-6">404 Not Found</div>} />
      </Routes>

      {/* 一般画面のみ bottom tab bar を表示 */}
      {!hideTabBar && <BottomTabBar />}
    </div>
  );
}
