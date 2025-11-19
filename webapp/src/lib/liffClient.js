// /src/lib/liffClient.js
// ReminderApp Ver.3.1 — LIFF Utility（OIDC版・完全安定版）

import liff from "@line/liff";

let liffReady = false;

/**
 * LIFF の初期化（必要なときだけ実行）
 * - 再初期化エラーを防ぐため、内部フラグで1回のみ実行
 * - withLoginOnExternalBrowser: true を維持（ngrok / web.app 両対応）
 */
export async function initLiff() {
  if (liffReady) return true;

  const liffId = import.meta.env.VITE_LINE_LIFF_ID;
  console.log("🔧 [LIFF] init start:", { liffId });

  try {
    await liff.init({
      liffId,
      withLoginOnExternalBrowser: true,
    });

    liffReady = true;
    console.log("🔧 [LIFF] init 完了, loggedIn =", liff.isLoggedIn());

    return true;
  } catch (err) {
    console.error("❌ [LIFF] init error:", err);
    return false;
  }
}

/**
 * LIFF から ID Token を確実に取得
 * - 未ログインなら login() を発動
 * - ログイン後に getIDToken() を返す
 */
export async function getLiffIdToken() {
  await initLiff();

  try {
    // ログインしていなければ LIFF ログインへ誘導
    if (!liff.isLoggedIn()) {
      console.log("🔧 [LIFF] Not logged in → login()");
      await liff.login();
      return null; 
      // login() 後はページリロードされるため、この関数は一旦終了する
    }

    const token = liff.getIDToken();
    console.log("🔧 [LIFF] getIDToken:", token);

    if (!token) {
      console.warn("⚠️ [LIFF] ID Token が null → 再ログインします");
      await liff.login();
      return null;
    }

    return token;
  } catch (err) {
    console.error("❌ [LIFF] getIDToken error:", err);
    return null;
  }
}

/**
 * LIFF からプロフィールを取得
 * - login() へ自動誘導する
 */
export async function getLiffProfile() {
  await initLiff();

  try {
    if (!liff.isLoggedIn()) {
      console.log("🔧 [LIFF] Not logged in → login()");
      await liff.login();
      return null;
    }

    const prof = await liff.getProfile();
    console.log("🔧 [LIFF] getProfile:", prof);
    return prof;
  } catch (err) {
    console.error("❌ [LIFF] profile error:", err);
    return null;
  }
}
