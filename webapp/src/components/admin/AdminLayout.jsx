// /src/components/admin/AdminLayout.jsx
// ReminderApp Ver.3.1 — 管理者共通レイアウト（ヘッダー + Outlet + AdminTabBar）

import { Outlet, useNavigate, Link } from "react-router-dom";
import useAppStore from "../../store/appStore";
import AdminTabBar from "./AdminTabBar";

export default function AdminLayout() {
  const isAdmin = useAppStore((s) => s.isAdmin);
  const userProfile = useAppStore((s) => s.userProfile);
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-md px-6 py-8 text-center space-y-4">
          <h1 className="text-lg font-semibold text-slate-900">
            管理者権限が必要です
          </h1>
          <p className="text-sm text-slate-600">
            このページは管理者のみアクセスできます。
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            住人用ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ヘッダー：左 = 管理者ホーム, 右 = 一般画面へ */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-blue-600 transition"
          >
            <span className="text-lg">🛠</span>
            <span>管理者パネル</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500">
              {userProfile?.name || "管理者"} さん
            </span>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
            >
              一般画面へ
            </button>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="max-w-4xl mx-auto px-4 pt-4 pb-24">
        <Outlet />
      </main>

      {/* 管理者用タブバー */}
      <AdminTabBar />
    </div>
  );
}
