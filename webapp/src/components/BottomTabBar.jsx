// /src/components/BottomTabBar.jsx
// ReminderApp Ver.3.1 — グローバルボトムナビ（ガラス風タブバー + 未保存ガード）
//
// - /admin 配下では非表示
// - MealVote 画面で変更が未保存の場合、他タブに遷移する前に警告
//   → MealVote 側の window.__REMINDERAPP_MEAL_DIRTY__ を参照

import { Link, useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { to: "/", label: "ホーム", icon: "🏠" },
  { to: "/meal", label: "食数投票", icon: "🍽" },
  { to: "/duty", label: "当番", icon: "🧹" },
  { to: "/account", label: "アカウント", icon: "👤" },
];

const MEAL_DIRTY_FLAG = "__REMINDERAPP_MEAL_DIRTY__";

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname || "/";

  // 管理画面ではタブバー非表示
  if (path.startsWith("/admin")) return null;

  const handleTabClick = (to, isActive) => (e) => {
    e.preventDefault();

    if (isActive) return;

    const hasUnsaved = Boolean(window[MEAL_DIRTY_FLAG]);

    if (hasUnsaved) {
      const ok = window.confirm(
        "変更内容が保存されていません。破棄して移動しますか？"
      );
      if (!ok) return;
    }

    navigate(to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30">
      <div className="max-w-3xl mx-auto px-3 pb-3 pt-2">
        <div className="rounded-2xl border border-slate-200 bg-white/85 backdrop-blur shadow-lg">
          <ul className="flex items-stretch justify-around">
            {TABS.map((tab) => {
              const isActive =
                tab.to === "/"
                  ? path === "/"
                  : path.startsWith(tab.to);

              return (
                <li key={tab.to} className="flex-1">
                  <Link
                    to={tab.to}
                    onClick={handleTabClick(tab.to, isActive)}
                    className={
                      "flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors " +
                      (isActive
                        ? "text-blue-600"
                        : "text-slate-500 hover:text-slate-700")
                    }
                  >
                    <span
                      className={
                        "text-xl leading-none " +
                        (isActive ? "" : "opacity-80")
                      }
                    >
                      {tab.icon}
                    </span>
                    <span className="leading-tight">{tab.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
