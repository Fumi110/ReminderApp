// /src/store/appStore.js
// ReminderApp Ver.3.1 — Zustand（推奨 storage API 完全対応版）
// - Firebase Auth / LIFF 認証対応
// - deprecated serialize/deserialize/getStorage を完全除去
// - Set ⇄ Array の相互変換を storage に統合

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectEnv } from "../utils/detectEnv";

const useAppStore = create(
  persist(
    (set, get) => ({
      // -------------------------------------------------------
      // Global State
      // -------------------------------------------------------
      envMode: detectEnv(),

      isAuthenticated: false,
      isAdmin: false,

      userProfile: null,       // Firestore ユーザープロフィール
      firebaseUser: null,      // Firebase Auth の生ユーザー
      lineProfile: null,       // 🔥 LIFF Profile（追加）

      customToken: null,
      lineAccessToken: null,

      isLoading: false,
      error: null,

      dutyData: {},           // 年月 → duties[]
      holidayData: {},        // 年月 → Set([...holidays])

      // -------------------------------------------------------
      // Actions
      // -------------------------------------------------------

      setLoading: (flag) => set({ isLoading: flag }),

      setError: (msg) => set({ error: msg }),
      clearError: () => set({ error: null }),

      /** Firebase Auth の state → store に反映 */
      setUser: (firebaseUser) => {
        if (!firebaseUser) {
          set({
            firebaseUser: null,
            userProfile: null,
            lineProfile: null,
            isAuthenticated: false,
            isAdmin: false,
          });
          return;
        }
        set({
          firebaseUser,
          isAuthenticated: true,
        });
      },

      /** Firestore ユーザープロフィール */
      updateProfile: (profile) => {
        if (!profile) {
          set({
            userProfile: null,
            isAuthenticated: false,
            isAdmin: false,
          });
          return;
        }

        const isAdminRole = profile.role === "admin";

        set({
          userProfile: profile,
          isAuthenticated: true,
          isAdmin: isAdminRole,
        });
      },

      /** 🔥 LIFFプロフィールを保存（追加） */
      setLineProfile: (lineProfile) => {
        set({ lineProfile });
      },

      /** Login 完了時まとめてセット */
      login: (profile, customToken, lineAccessToken) => {
        const isAdminRole = profile.role === "admin";
        set({
          userProfile: profile,
          customToken,
          lineAccessToken,
          isAuthenticated: true,
          isAdmin: isAdminRole,
        });
      },

      logout: () => {
        set({
          userProfile: null,
          firebaseUser: null,
          lineProfile: null,     // 🔥 追加
          customToken: null,
          lineAccessToken: null,
          isAuthenticated: false,
          isAdmin: false,
          error: null,
        });
      },

      /** envMode を同期 */
      syncEnvMode: () => {
        const detected = detectEnv();
        const current = get().envMode;
        if (detected !== current) {
          console.log(`env sync: ${current} → ${detected}`);
          set({ envMode: detected });
        }
      },

      // -------------------------------------------------------
      // Duty / Holiday data
      // -------------------------------------------------------
      saveDuties: (year, month, duties) => {
        const key = `${year}-${month}`;
        set((s) => ({
          dutyData: {
            ...s.dutyData,
            [key]: duties,
          },
        }));
      },

      loadDuties: (year, month) => {
        const key = `${year}-${month}`;
        return get().dutyData[key] || {};
      },

      /** holidayData[year-month] = Set([...]) */
      saveHolidays: (year, month, holidays) => {
        const key = `${year}-${month}`;
        set((s) => ({
          holidayData: {
            ...s.holidayData,
            [key]: holidays,
          },
        }));
      },

      loadHolidays: (year, month) => {
        const key = `${year}-${month}`;
        return get().holidayData[key] || new Set();
      },
    }),

    // ---------------------------------------------------------
    // persist 設定（⚠ deprecated オプションを全廃）
    // ---------------------------------------------------------
    {
      name: "reminderapp-storage",

      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;

          const parsed = JSON.parse(raw);

          // Array → Set 復元
          if (parsed.holidayData) {
            const conv = {};
            Object.entries(parsed.holidayData).forEach(([key, value]) => {
              conv[key] = Array.isArray(value) ? new Set(value) : value;
            });
            parsed.holidayData = conv;
          }

          return parsed;
        },

        setItem: (name, value) => {
          const data = { ...value };

          if (data.holidayData) {
            const conv = {};
            Object.entries(data.holidayData).forEach(([key, value]) => {
              conv[key] = value instanceof Set ? [...value] : value;
            });
            data.holidayData = conv;
          }

          localStorage.setItem(name, JSON.stringify(data));
        },

        removeItem: (name) => localStorage.removeItem(name),
      },

      partialize: (state) => ({
        envMode: state.envMode,
        userProfile: state.userProfile,
        lineProfile: state.lineProfile,      // 🔥 保存対象として追加
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        lineAccessToken: state.lineAccessToken,
        customToken: state.customToken,
        dutyData: state.dutyData,
        holidayData: state.holidayData,
      }),
    }
  )
);

export default useAppStore;
