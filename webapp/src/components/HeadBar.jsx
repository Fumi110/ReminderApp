// /src/components/HeaderBar.jsx
// ReminderApp Ver.3.1 — 共通ヘッダー（管理者⇄一般の切替）

import { useNavigate, useLocation } from "react-router-dom";
import useAppStore from "../store/appStore";

export default function HeaderBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const userProfile = useAppStore((s) => s.userProfile);
  const isAdmin = userProfile?.role === "admin";

  const onClickSwitch = () => {
    if (location.pathname.startsWith("/admin")) {
      navigate("/");
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="w-full bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      <h1 className="text-lg font-bold text-gray-900">ReminderApp</h1>

      {isAdmin && (
        <button
          onClick={onClickSwitch}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          {location.pathname.startsWith("/admin") ? "一般へ" : "管理者へ"}
        </button>
      )}
    </div>
  );
}
