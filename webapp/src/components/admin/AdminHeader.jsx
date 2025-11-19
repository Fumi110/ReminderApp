// /src/components/admin/AdminHeader.jsx
// ReminderApp Ver.3.1 — 管理画面共通ヘッダー
// - 左上：管理ホームへ戻る
// - 右上：一般画面へ戻る
// - 中央：タイトル＋環境バッジ

import { useNavigate, useLocation } from "react-router-dom";
import useAppStore from "../../store/appStore";

export default function AdminHeader({
  title = "管理者パネル",
  subtitle,
  showBackToAdminHome = true, // Adminホーム自身では false にする
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppStore((s) => s.userProfile);
  const envMode = useAppStore((s) => s.envMode || "dev");

  const isAdminHome = location.pathname === "/admin";

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {showBackToAdminHome && !isAdminHome && (
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← 管理ホーム
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900">
              {title}
            </h1>
            <span
              className={
                "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                (envMode === "dev"
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300")
              }
            >
              {envMode === "dev" ? "DEV環境" : "本番環境"}
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {userProfile && (
            <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
              👤 {userProfile.name || userProfile.display_name || "管理者"}
            </span>
          )}
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            一般画面へ
          </button>
        </div>
      </div>
    </header>
  );
}
