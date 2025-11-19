// /webapp/src/components/Settings.jsx
// User settings and preferences
// ReminderApp Ver.2.8.1

import { useState } from "react";
import useAppStore from "../store/appStore";
import { prefixCollection } from "../utils/firestorePrefix";

function Settings() {
  const envMode = useAppStore((state) => state.envMode);
  const isAdmin = useAppStore((state) => state.isAdmin);
  const userProfile = useAppStore((state) => state.userProfile);
  const switchEnvMode = useAppStore((state) => state.switchEnvMode);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const logout = useAppStore((state) => state.logout);
  
  const [theme, setTheme] = useState("light");
  const [notificationSettings, setNotificationSettings] = useState({
    duty_remind: userProfile?.notification_settings?.duty_remind ?? true,
    meal_remind: userProfile?.notification_settings?.meal_remind ?? true
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
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
    showToastMessage(`テーマを${newTheme === "light" ? "ライト" : "ダーク"}モードに変更しました`);
    
    // Placeholder: Apply theme to document
    // document.documentElement.classList.toggle("dark", newTheme === "dark");
  };
  
  const handleNotificationChange = (key) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    
    setNotificationSettings(newSettings);
    
    // Placeholder: Update Firestore
    // const usersCollection = prefixCollection("users", envMode);
    // await updateDoc(doc(db, usersCollection, userProfile.line_user_id), {
    //   notification_settings: newSettings
    // });
    
    console.log("Updating notifications in:", prefixCollection("users", envMode));
    
    // Update local store
    if (userProfile) {
      updateProfile({
        ...userProfile,
        notification_settings: newSettings
      });
    }
    
    showToastMessage("通知設定を更新しました");
  };
  
  const handleLineReauth = () => {
    // Placeholder: Redirect to LINE OAuth flow
    // window.location.href = `https://access.line.me/oauth2/v2.1/authorize?...`;
    
    showToastMessage("LINE再認証を開始します...");
    console.log("Initiating LINE OAuth flow");
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🔧</span>
          <span>設定</span>
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          アプリケーションの設定を管理
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
            <div className={`
              px-3 py-1 rounded-full text-xs font-semibold
              ${isAdmin 
                ? "bg-purple-100 text-purple-800 border border-purple-300" 
                : "bg-gray-100 text-gray-800 border border-gray-300"
              }
            `}>
              {isAdmin ? "管理者" : "一般ユーザー"}
            </div>
          </div>
          
          <button
            onClick={handleLineReauth}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🔐</span>
            <span>LINE 再認証</span>
          </button>
        </div>
      </div>
      
      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          通知設定
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">当番リマインダー</div>
              <div className="text-sm text-gray-600">
                当日の朝に当番をお知らせ
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange("duty_remind")}
              className={`
                relative w-14 h-8 rounded-full transition-colors
                ${notificationSettings.duty_remind ? "bg-blue-600" : "bg-gray-300"}
              `}
            >
              <div className={`
                absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform
                ${notificationSettings.duty_remind ? "translate-x-7" : "translate-x-1"}
              `} />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">食数投票リマインダー</div>
              <div className="text-sm text-gray-600">
                週初めに投票をお知らせ
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange("meal_remind")}
              className={`
                relative w-14 h-8 rounded-full transition-colors
                ${notificationSettings.meal_remind ? "bg-blue-600" : "bg-gray-300"}
              `}
            >
              <div className={`
                absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform
                ${notificationSettings.meal_remind ? "translate-x-7" : "translate-x-1"}
              `} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Appearance Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          外観
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">テーマ</div>
              <div className="text-sm text-gray-600">
                {theme === "light" ? "ライトモード" : "ダークモード"}（開発中）
              </div>
            </div>
            <button
              onClick={handleThemeToggle}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              {theme === "light" ? "🌙 ダーク" : "☀️ ライト"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Environment Settings (Admin Only) */}
      {isAdmin && (
        <div className="bg-purple-50 rounded-lg border-2 border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚙️</span>
            <h3 className="text-lg font-semibold text-purple-900">
              管理者設定
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="font-medium text-gray-900 mb-2">環境切替</div>
              <div className="text-sm text-gray-600 mb-3">
                現在の環境: <span className="font-semibold text-purple-700">{envMode.toUpperCase()}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEnvSwitch("dev")}
                  className={`
                    flex-1 px-4 py-2 rounded-lg font-medium transition-all
                    ${envMode === "dev"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  DEV（開発）
                </button>
                <button
                  onClick={() => handleEnvSwitch("prod")}
                  className={`
                    flex-1 px-4 py-2 rounded-lg font-medium transition-all
                    ${envMode === "prod"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  PROD（本番）
                </button>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
              ⚠️ 環境を切り替えると、異なるデータベースに接続されます
            </div>
          </div>
        </div>
      )}
      
      {/* Danger Zone */}
      <div className="bg-red-50 rounded-lg border-2 border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">
          危険な操作
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            ログアウト
          </button>
          <p className="text-sm text-red-700">
            ログアウトすると、再度LINE認証が必要になります
          </p>
        </div>
      </div>
      
      {/* App Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          アプリ情報
        </h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>バージョン</span>
            <span className="font-mono">2.8.1</span>
          </div>
          <div className="flex justify-between">
            <span>環境</span>
            <span className="font-mono">{envMode}</span>
          </div>
          <div className="flex justify-between">
            <span>フレームワーク</span>
            <span className="font-mono">React 18 + Vite 7</span>
          </div>
          <div className="flex justify-between">
            <span>データベース</span>
            <span className="font-mono">Firebase Firestore</span>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg max-w-sm">
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;