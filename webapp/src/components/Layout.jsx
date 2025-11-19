// /src/components/Layout.jsx
// Main layout with bottom tab navigation
// ReminderApp Ver.3.1 - Phase A Implementation

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import EnvironmentBadge from "./EnvironmentBadge";
import useAppStore from "../store/appStore";

function Layout({ children }) {
  const location = useLocation();
  const isAdmin = useAppStore((state) => state.isAdmin);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  
  // Bottom tab navigation items
  const bottomNavItems = [
    { path: "/home", label: "ホーム", icon: "🏠" },
    { path: "/votes", label: "投票", icon: "🗳️" },
    { path: "/calendar", label: "当番表", icon: "🧹" },
    { path: "/account", label: "アカウント", icon: "👤" }
  ];
  
  const isActive = (path) => location.pathname === path;
  
  const handleAdminAccess = () => {
    if (!isAdmin) {
      setShowAdminWarning(true);
      setTimeout(() => setShowAdminWarning(false), 3000);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-2xl">🏠</span>
                <h1 className="text-xl font-bold text-gray-900">
                  ReminderApp
                </h1>
              </Link>
              {!isAuthenticated && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Ver.3.1
                </span>
              )}
            </div>
            
            {/* Environment Badge + Admin Link */}
            <div className="flex items-center gap-3">
              <EnvironmentBadge />
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  管理
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Admin Warning Toast */}
      {showAdminWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔒</span>
              <span className="font-medium text-sm md:text-base">管理者権限が必要です</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      
      {/* Bottom Tab Navigation (Fixed) */}
      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="grid grid-cols-4 gap-1">
              {bottomNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center justify-center py-2 px-1 transition-colors
                    ${isActive(item.path)
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className={`text-xs font-medium ${
                    isActive(item.path) ? "font-semibold" : ""
                  }`}>
                    {item.label}
                  </span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full"></div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}
      
      {/* Footer (Hidden on mobile when tabs are visible) */}
      <footer className={`bg-white border-t border-gray-200 mt-auto ${isAuthenticated ? "hidden sm:block" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 ReminderApp Ver.3.1 by Fumihito Koseto
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;