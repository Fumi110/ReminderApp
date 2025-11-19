// /src/lib/authWithCustomToken.js
// ReminderApp Ver.3.1 — DEV 用 LINE CustomToken 認証

import { auth } from "./firebase";
import { signInWithCustomToken } from "firebase/auth";

const FUNCTIONS_URL =
  import.meta.env.VITE_FUNCTIONS_URL ||
  (import.meta.env.MODE === "production"
    ? "https://asia-northeast1-management-app-746a3.cloudfunctions.net"
    : "http://127.0.0.1:4903");

/**
 * LINE AccessToken を Functions に送り、CustomToken で Firebase Auth にログイン
 * @param {string} lineAccessToken
 */
export async function loginWithCustomToken(lineAccessToken) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/loginLineUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: lineAccessToken }),
    });

    if (!res.ok) {
      console.error("[loginWithCustomToken] Functions error:", res.status);
      throw new Error(`Functions error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.customToken) {
      console.error("[loginWithCustomToken] customToken missing:", data);
      throw new Error("customToken not returned from Functions");
    }

    await signInWithCustomToken(auth, data.customToken);
    console.log("[loginWithCustomToken] Firebase login succeeded");
  } catch (err) {
    console.error("[loginWithCustomToken] ERROR:", err);
    throw err;
  }
}
