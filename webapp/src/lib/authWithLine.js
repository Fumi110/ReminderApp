// /src/lib/authWithLine.js
// ReminderApp Ver.3.1 — LINE → Firebase OIDC 認証（最終完全版）

import { auth } from "./firebase";               // ★ getAuth() を使わず統一する
import { signInWithCredential, OAuthProvider } from "firebase/auth";
import { getLiffIdToken } from "./liffClient";

/**
 * LINE の LIFF ID Token を Firebase に渡してサインインする関数
 * - 認証後の状態更新は Firebase Auth Observer が担当（setUser は不要）
 * - この関数は「ログイン動作そのもの」だけを担当する
 */
export async function signInWithLine() {
  try {
    // 1. ID Token を LIFF から取得
    const idToken = await getLiffIdToken();
    if (!idToken) {
      console.warn("[signInWithLine] ID Token が null → LIFF login による reload 待ち");
      return; 
    }

    console.log("🔐 [OIDC] ID Token 取得成功");

    // 2. OIDC Provider 生成（最新設定を Firebase Console から取得）
    const provider = new OAuthProvider("oidc.line");

    // 3. Firebase Credential を生成
    const credential = provider.credential({
      idToken,
    });

    // 4. Firebase へサインイン
    const userCredential = await signInWithCredential(auth, credential);

    console.log("🎉 [OIDC] Firebase ログイン成功:", userCredential.user.uid);

    // ★ 注意 ★
    // Zustand への setUser() はここでは呼ばない。
    // → Firebase Auth Observer が自動的に発火して setUser(), updateProfile() を実行する。
    // そのため、ここでは user を返す必要すらない。

    return userCredential.user;

  } catch (err) {
    console.error("❌ [signInWithLine] OIDC ログイン失敗:", err);
    throw err;
  }
}
