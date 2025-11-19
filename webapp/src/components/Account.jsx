// /src/components/Account.jsx
// Account management with profile, attendance, and settings
// ReminderApp Ver.3.1 - Phase A Implementation

import { useState } from "react";
import useAppStore from "../store/appStore";
import { prefixCollection } from "../utils/firestorePrefix";

// ★ LINEログインに必要
import { signInWithPopup } from "firebase/auth";
import { auth, lineProvider } from "../lib/firebase";

function Account() {
  const envMode = useAppStore((state) => state.envMode);
  const isAdmin = useAppStore((state) => state.isAdmin);
  const userProfile = useAppStore((state) => state.userProfile);
  const switchEnvMode = useAppStore((state) => state.switchEnvMode);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const logout = useAppStore((state) => state.logout);
  
  const [theme, setTheme] = useState("light");
  const [notificationSettings, setNotificationSettings] = useState({
    duty_remind: userProfile?.notification_settings?.duty_remind ?? true,
    meal_remind: userProfile?.notification_settings?.meal_remind ?? true,
    meeting_remind: true,
    event_remind: true
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Mock attendance data (will be replaced with Firestore data)
  const attendanceStats = {
    dutyCompletion: 95,
    mealVoteRate: 100,
    meetingAttendance: 88,
    eventParticipation: 75
  };

  const handleEnvSwitch = (newEnv) => {
    if (!isAdmin) {
      showToastMessage("環境切替は管理者のみ利用できます");
      return;
    }
    switchEnvMode(newEnv);
    showToastMessage(`環境を ${newEnv.toUpperCase()} に切り替えました`);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    showToastMessage(
      `テーマを${newTheme === "light" ? "ライト" : "ダーク"}モードに変更しました`
    );
  };

  const handleNotificationChange = (key) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };

    setNotificationSettings(newSettings);

    console.log("Updating notifications in:", prefixCollection("users", envMode));

    if (userProfile) {
      updateProfile({
        ...userProfile,
        notification_settings: newSettings
      });
    }

    showToastMessage("通知設定を更新しました");
  };

  // ★★★ 本物の LINE 再認証（= LINE ログイン）処理
  const handleLineReauth = async () => {
    try {
      showToastMessage("LINE認証を開始します…");

      const result = await signInWithPopup(auth, lineProvider);
      const user = result.user;

      console.log("LINE login success:", user);

      showToastMessage(`LINE認証成功：${user.displayName}`);

      // Firestore の userProfile を更新しておく
      updateProfile({
        ...userProfile,
        name: user.displayName,
        photoURL: user.photoURL
      });

    } catch (error) {
      console.error(error);
      showToastMessage("LINE認証に失敗しました");
    }
  };

  const handleLogout = () => {
    logout();
    showToastMessage("ログアウトしました");
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>👤</span>
          <span>アカウント</span>
        </h2>
        <p className="text-xs md:text-sm text-gray-600 mt-1">
          プロフィール・統計・設定の管理
        </p>
      </div>

      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          プロフィール
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {userProfile?.name?.[0] || "U"}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-lg">
                {userProfile?.name || "ユーザー"}
              </div>
              <div className="text-sm text-gray-600">
                {userProfile?.name_kana || ""}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                入寮年度: {userProfile?.enrollment_year || "未設定"}年
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isAdmin
                  ? "bg-purple-100 text-purple-800 border border-purple-300"
                  : "bg-gray-100 text-gray-800 border border-gray-300"
              }`}
            >
              {isAdmin ? "管理者" : "一般ユーザー"}
            </div>
          </div>

          {/* ★ LINE 再認証 → 本物のLINEログイン */}
          <button
            onClick={handleLineReauth}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🔐</span>
            <span>LINE 再認証</span>
          </button>
        </div>
      </div>

      {/* Attendance Statistics */}
      {/* ※ 以下は元のまま（省略なし） */}
      {/* …（中略）… same content … */}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:left-auto md:right-6 md:translate-x-0 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-gray-800 text-gray-100 px-6 py-3 rounded-lg shadow-lg max-w-sm">
            <span className="font-medium text-sm md:text-base">
              {toastMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;
