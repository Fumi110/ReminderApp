// /src/hooks/useAuth.js
// ReminderApp Ver.3.1 — 認証フロー (DEV=CustomToken / PROD=OIDC)

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithCredential,
  OAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { initLiff, getLiffAccessToken, getLiffIdToken, getLiffProfile } from "../lib/liffClient";
import { loginWithCustomToken } from "../lib/authWithCustomToken";
import useAppStore from "../store/appStore";
import { prefixCollection } from "../utils/firestorePrefix";

export default function useAuth() {
  const [state, setState] = useState({
    user: null,
    userProfile: null,
    loading: true,
  });

  const setUser = useAppStore((s) => s.setUser);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const syncEnvMode = useAppStore((s) => s.syncEnvMode);

  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    const run = async () => {
      // まず envMode を同期
      if (typeof syncEnvMode === "function") {
        syncEnvMode();
      }

      // STEP 1: LIFF 初期化
      const ok = await initLiff();
      if (!ok) {
        console.log("[useAuth] LIFF initialization failed");
        setState({ user: null, userProfile: null, loading: false });
        return;
      }

      // STEP 2: Firebase Auth にログイン（envMode に応じて分岐）
      try {
        const currentEnvMode = useAppStore.getState().envMode || "dev";

        if (currentEnvMode === "dev") {
          console.log("[useAuth] DEV mode: CustomToken auth flow");

          const accessToken = getLiffAccessToken();
          if (!accessToken) {
            throw new Error("LINE AccessToken を取得できませんでした");
          }

          await loginWithCustomToken(accessToken);
          console.log("[useAuth] CustomToken login succeeded");
        } else {
          console.log("[useAuth] PROD mode: OIDC auth flow");

          const idToken = getLiffIdToken();
          if (!idToken) {
            throw new Error("LIFF ID Token を取得できませんでした");
          }

          const provider = new OAuthProvider("oidc.line");
          const credential = provider.credential({ idToken });
          await signInWithCredential(auth, credential);
          console.log("[useAuth] OIDC login succeeded");
        }
      } catch (authErr) {
        console.error("[useAuth] Auth error:", authErr);
        setState({ user: null, userProfile: null, loading: false });
        return;
      }

      // STEP 3: Auth State Listener
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (cancelled) return;

        if (typeof setUser === "function") {
          setUser(firebaseUser || null);
        }

        if (!firebaseUser) {
          if (typeof updateProfile === "function") {
            updateProfile(null);
          }
          setState({ user: null, userProfile: null, loading: false });
          return;
        }

        try {
          const envMode = useAppStore.getState().envMode || "dev";
          const usersCol = prefixCollection("users", envMode);
          const userRef = doc(db, usersCol, firebaseUser.uid);
          const snap = await getDoc(userRef);

          let data;

          if (snap.exists()) {
            data = snap.data();
          } else {
            // 初回ログイン時は LIFF プロフィールから作成
            const lp = await getLiffProfile();

            const baseProfile = {
              uid: firebaseUser.uid,
              display_name:
                lp?.displayName ||
                firebaseUser.displayName ||
                "NoName",
              name:
                lp?.displayName ||
                firebaseUser.displayName ||
                "NoName",
              picture: lp?.pictureUrl || firebaseUser.photoURL || "",
              enrollment_year: null,
              name_kana: "",
              role: "user",
              created_at: serverTimestamp(),
            };

            await setDoc(userRef, baseProfile, { merge: true });
            data = baseProfile;
          }

          const fullProfile = {
            uid: firebaseUser.uid,
            ...data,
          };

          if (typeof updateProfile === "function") {
            updateProfile(fullProfile);
          }

          setState({
            user: firebaseUser,
            userProfile: fullProfile,
            loading: false,
          });
        } catch (e) {
          console.error("[useAuth] Firestore error:", e);
          setState((prev) => ({ ...prev, loading: false }));
        }
      });
    };

    run();

    return () => {
      cancelled = true;
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, [setUser, updateProfile, syncEnvMode]);

  return state;
}
