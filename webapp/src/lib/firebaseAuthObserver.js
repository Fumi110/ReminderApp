// /src/lib/firebaseAuthObserver.js
// ReminderApp Ver.3.1 — Firebase Auth Observer（admin 判定は userProfile.role に一元化）

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import useAppStore from "../store/appStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

import { initUserProfileIfNeeded } from "./userProfile";

export function initAuthObserver() {
  console.log("🔐 [Firebase] Auth Observer 開始");

  onAuthStateChanged(auth, async (firebaseUser) => {
    const setUser = useAppStore.getState().setUser;
    const updateProfile = useAppStore.getState().updateProfile;

    if (!firebaseUser) {
      console.log("🔐 [Firebase] 未ログイン");
      setUser(null);
      return;
    }

    console.log("🔐 [Firebase] ログイン検知:", firebaseUser.uid);
    // Firebase ユーザーだけ先にセット
    setUser(firebaseUser);

    const ref = doc(db, "users", firebaseUser.uid);
    let snap = await getDoc(ref);

    // プロフィールがなければ作成
    if (!snap.exists()) {
      console.warn("⚠️ [Firebase] プロフィール不存在 → 初期作成を実行します");

      const lineProfile = useAppStore.getState().lineProfile;
      await initUserProfileIfNeeded(firebaseUser, lineProfile);

      // 再取得
      snap = await getDoc(ref);
    }

    const profile = snap.data() || {};
    console.log(
      "👤 [Firebase] Firestore profile:",
      profile,
      " role=" + profile.role
    );

    // 👉 admin 判定は appStore.updateProfile に一任
    updateProfile(profile);
  });
}
