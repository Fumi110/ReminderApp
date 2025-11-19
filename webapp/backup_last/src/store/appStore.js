// /src/store/appStore.js
// Zustand global state store with persistence and data management
// ReminderApp Ver.2.8.1 - Full Implementation

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectEnv } from "../utils/detectEnv";

/**
 * ReminderApp global state store
 * Manages: environment mode, user authentication, profile, admin status, duty data, holiday data
 */
const useAppStore = create(
  persist(
    (set, get) => ({
      // ==========================================
      // State
      // ==========================================
      
      // Environment mode ("dev" or "prod")
      envMode: detectEnv(),
      
      // User authentication status
      isAuthenticated: false,
      
      // Admin status (role-based)
      isAdmin: false,
      
      // User profile data
      userProfile: null,
      
      // Firebase custom token
      customToken: null,
      
      // LINE access token
      lineAccessToken: null,
      
      // Loading states
      isLoading: false,
      
      // Error state
      error: null,
      
      // Duty data storage (key: "YYYY-MM", value: { dateStr: { trash1, trash2, bath } })
      dutyData: {},
      
      // Holiday data storage (key: "YYYY-MM", value: Set of date strings)
      holidayData: {},
      
      // ==========================================
      // Actions
      // ==========================================
      
      /**
       * Switch environment mode
       * ADMIN ONLY - Guards against unauthorized switching
       * @param {string} newEnvMode - "dev" or "prod"
       */
      switchEnvMode: (newEnvMode) => {
        const { isAdmin, userProfile } = get();
        
        if (!isAdmin || !userProfile || userProfile.role !== "admin") {
          console.warn("Environment switching is restricted to admin users only");
          set({ error: "管理者権限が必要です" });
          return;
        }
        
        if (!["dev", "prod"].includes(newEnvMode)) {
          console.error(`Invalid envMode: ${newEnvMode}`);
          return;
        }
        
        console.log(`Switching environment: ${get().envMode} → ${newEnvMode}`);
        set({ envMode: newEnvMode, error: null });
      },
      
      /**
       * Toggle admin status
       * READ-ONLY GUARD - Should only reflect actual role from Firestore
       * @param {boolean} isAdmin - Admin status
       */
      toggleAdmin: (isAdmin) => {
        const { userProfile } = get();
        
        if (userProfile && userProfile.role === "admin") {
          set({ isAdmin: true });
        } else {
          set({ isAdmin: false });
          if (isAdmin) {
            console.warn("Cannot grant admin privileges without valid role in Firestore");
          }
        }
      },
      
      /**
       * Update user profile
       * @param {object} profile - User profile data
       */
      updateProfile: (profile) => {
        if (!profile) {
          set({ 
            userProfile: null,
            isAdmin: false,
            isAuthenticated: false
          });
          return;
        }
        
        const isAdminRole = profile.role === "admin";
        set({ 
          userProfile: profile,
          isAdmin: isAdminRole,
          isAuthenticated: true,
          error: null
        });
      },
      
      /**
       * Set authentication tokens
       * @param {string} customToken - Firebase custom token
       * @param {string} lineAccessToken - LINE access token
       */
      setTokens: (customToken, lineAccessToken) => {
        set({ customToken, lineAccessToken });
      },
      
      /**
       * Set loading state
       * @param {boolean} isLoading - Loading status
       */
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      /**
       * Set error state
       * @param {string|null} error - Error message
       */
      setError: (error) => {
        set({ error });
      },
      
      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },
      
      /**
       * Login user with profile and tokens
       * @param {object} profile - User profile
       * @param {string} customToken - Firebase custom token
       * @param {string} lineAccessToken - LINE access token
       */
      login: (profile, customToken, lineAccessToken) => {
        const isAdminRole = profile.role === "admin";
        set({
          userProfile: profile,
          customToken,
          lineAccessToken,
          isAuthenticated: true,
          isAdmin: isAdminRole,
          error: null
        });
      },
      
      /**
       * Logout user and clear all state
       */
      logout: () => {
        set({
          userProfile: null,
          customToken: null,
          lineAccessToken: null,
          isAuthenticated: false,
          isAdmin: false,
          error: null
        });
      },
      
      /**
       * Reset store to initial state (except envMode)
       */
      reset: () => {
        const currentEnvMode = get().envMode;
        set({
          envMode: currentEnvMode,
          userProfile: null,
          customToken: null,
          lineAccessToken: null,
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          error: null
        });
      },
      
      /**
       * Sync environment mode with current hostname
       */
      syncEnvMode: () => {
        const detectedEnv = detectEnv();
        const currentEnv = get().envMode;
        
        if (detectedEnv !== currentEnv) {
          console.log(`Environment mismatch detected. Syncing: ${currentEnv} → ${detectedEnv}`);
          set({ envMode: detectedEnv });
        }
      },
      
      // ==========================================
      // Duty Data Management
      // ==========================================
      
      /**
       * Save duties for a specific month
       * @param {number} year - Year
       * @param {number} month - Month (0-11)
       * @param {object} duties - Duty data object
       */
      saveDuties: (year, month, duties) => {
        const key = `${year}-${month}`;
        set((state) => ({
          dutyData: {
            ...state.dutyData,
            [key]: duties
          }
        }));
        console.log(`Duties saved for ${key}:`, duties);
      },
      
      /**
       * Load duties for a specific month
       * @param {number} year - Year
       * @param {number} month - Month (0-11)
       * @returns {object} Duty data or empty object
       */
      loadDuties: (year, month) => {
        const key = `${year}-${month}`;
        return get().dutyData[key] || {};
      },
      
      // ==========================================
      // Holiday Data Management
      // ==========================================
      
      /**
       * Save holidays for a specific month
       * @param {number} year - Year
       * @param {number} month - Month (0-11)
       * @param {Set} holidays - Set of date strings
       */
      saveHolidays: (year, month, holidays) => {
        const key = `${year}-${month}`;
        set((state) => ({
          holidayData: {
            ...state.holidayData,
            [key]: holidays
          }
        }));
        console.log(`Holidays saved for ${key}:`, Array.from(holidays));
      },
      
      /**
       * Load holidays for a specific month
       * @param {number} year - Year
       * @param {number} month - Month (0-11)
       * @returns {Set} Set of date strings or empty Set
       */
      loadHolidays: (year, month) => {
        const key = `${year}-${month}`;
        return get().holidayData[key] || new Set();
      }
    }),
    {
      name: "reminderapp-storage", // localStorage key
      
      // Persist only essential state
      partialize: (state) => ({
        envMode: state.envMode,
        userProfile: state.userProfile,
        customToken: state.customToken,
        lineAccessToken: state.lineAccessToken,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        dutyData: state.dutyData,
        holidayData: state.holidayData
      }),
      
      // Custom serializer for Set objects
      serialize: (state) => {
        const serialized = { ...state.state };
        
        // Convert Sets to Arrays for serialization
        if (serialized.holidayData) {
          const convertedHolidays = {};
          Object.entries(serialized.holidayData).forEach(([key, value]) => {
            convertedHolidays[key] = value instanceof Set ? Array.from(value) : value;
          });
          serialized.holidayData = convertedHolidays;
        }
        
        return JSON.stringify(serialized);
      },
      
      // Custom deserializer for Set objects
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        
        // Convert Arrays back to Sets
        if (parsed.holidayData) {
          const convertedHolidays = {};
          Object.entries(parsed.holidayData).forEach(([key, value]) => {
            convertedHolidays[key] = Array.isArray(value) ? new Set(value) : value;
          });
          parsed.holidayData = convertedHolidays;
        }
        
        return parsed;
      }
    }
  )
);

export default useAppStore;