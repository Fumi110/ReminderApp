// /src/components/Layout.jsx
// Main layout wrapper with header and navigation
// ReminderApp Ver.2.8.1 - Full Implementation

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import EnvironmentBadge from "./EnvironmentBadge";
import useAppStore from "../store/appStore";

function Layout({ children }) {
  const location = useLocation();
  const isAdmin = useAppStore((state) => state.isAdmin);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  
  const navItems = [
    { path: "/", label: "ホーム", icon: "🏠" },
    { path: "/calendar", label: "当番表", icon: "📅" },
    { path: "/meals", label: "食数投票", icon: "🍽️" },
    { path: "/admin", label: "管理", icon: "⚙️", adminOnly: true },
    { path: "/settings", label: "設定", icon: "🔧" }
  ];
  
  const isActive = (path) => location.pathname === path;
  
  const handleNavClick = (e, item) => {
    if (item.adminOnly && !isAdmin) {
      e.preventDefault();
      setShowAdminWarning(true);
      setTimeout(() => setShowAdminWarning(false), 3000);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-2xl">🏠</span>
                <h1 className="text-xl font-bold text-gray-900">
                  ReminderApp
                </h1>
              </Link>
              {!isAuthenticated && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Ver.2.8.1
                </span>
              )}
            </div>
            
            {/* Environment Badge */}
            <EnvironmentBadge />
          </div>
        </div>
        
        {/* Navigation */}
        {isAuthenticated && (
          <nav className="border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex gap-1 overflow-x-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium
                      border-b-2 transition-colors whitespace-nowrap
                      ${isActive(item.path)
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                      }
                      ${item.adminOnly && !isAdmin ? "opacity-60" : ""}
                    `}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.adminOnly && !isAdmin && (
                      <span className="text-xs">🔒</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        )}
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
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 ReminderApp Ver.2.8.1 by Fumihito Koseto
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;