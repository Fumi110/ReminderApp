// /src/components/admin/AdminTabBar.jsx
// ReminderApp Ver.3.1 — Admin グローバルボトムナビ（施設 / 炊事 / 締切 / ユーザー）

import { Link, useLocation } from "react-router-dom";

const TABS = [
  {
    to: "/admin/facility",
    label: "施設",
    sub: "当番・交代",
    icon: "🏢",
  },
  {
    to: "/admin/meal",
    label: "炊事管理",
    sub: "食数・除外日",
    icon: "🍽",
  },
  {
    to: "/admin/deadlines",
    label: "締切",
    sub: "リマインド",
    icon: "⏰",
  },
  {
    to: "/admin/users",
    label: "ユーザー",
    sub: "権限・情報",
    icon: "👥",
  },
];

export default function AdminTabBar() {
  const location = useLocation();
  const path = location.pathname || "/admin";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-4xl mx-auto px-3 pb-3 pt-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur shadow-lg">
          <ul className="flex items-stretch justify-around">
            {TABS.map((tab) => {
              const isActive =
                path === tab.to || path.startsWith(tab.to + "/");

              return (
                <li key={tab.to} className="flex-1">
                  <Link
                    to={tab.to}
                    className={
                      "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors " +
                      (isActive
                        ? "text-blue-600"
                        : "text-slate-500 hover:text-slate-700")
                    }
                  >
                    <span
                      className={
                        "text-xl leading-none mb-0.5 " +
                        (isActive ? "" : "opacity-80")
                      }
                    >
                      {tab.icon}
                    </span>
                    <span className="leading-tight font-medium">
                      {tab.label}
                    </span>
                    <span className="leading-tight text-[10px] text-slate-400">
                      {tab.sub}
                    </span>
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
