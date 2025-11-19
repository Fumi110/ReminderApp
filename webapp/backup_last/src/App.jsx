// /webapp/src/App.jsx
// Main application router and layout wrapper
// ReminderApp Ver.2.8.1

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import useAppStore from "./store/appStore";

// Layout
import Layout from "./components/Layout";

// Pages
import Home from "./components/Home";
import DutyCalendar from "./components/DutyCalendar";
import MealVote from "./components/MealVote";
import AdminPanel from "./components/AdminPanel";
import Settings from "./components/Settings";

/**
 * Protected route wrapper for admin-only pages
 * Redirects to home if user is not admin
 */
function AdminRoute({ children }) {
  const isAdmin = useAppStore((state) => state.isAdmin);
  
  if (!isAdmin) {
    console.warn("Access denied: Admin privileges required");
    return <Navigate to="/" replace />;
  }
  
  return children;
}

/**
 * Main App component
 * Sets up routing and initializes app state
 */
function App() {
  const syncEnvMode = useAppStore((state) => state.syncEnvMode);
  const envMode = useAppStore((state) => state.envMode);
  const isAdmin = useAppStore((state) => state.isAdmin);
  
  // Sync environment mode on mount and when hostname changes
  useEffect(() => {
    syncEnvMode();
    
    // Log app initialization
    console.log("ReminderApp Ver.2.8.1 initialized");
    console.log(`Environment: ${envMode}`);
    console.log(`Admin mode: ${isAdmin}`);
  }, [syncEnvMode, envMode, isAdmin]);
  
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Home Dashboard */}
          <Route path="/" element={<Home />} />
          
          {/* Duty Calendar */}
          <Route path="/calendar" element={<DutyCalendar />} />
          
          {/* Meal Voting */}
          <Route path="/meals" element={<MealVote />} />
          
          {/* Admin Panel (Protected) */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } 
          />
          
          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
          
          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;