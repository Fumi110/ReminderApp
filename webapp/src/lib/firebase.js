// /src/lib/firebase.js
// ReminderApp Ver.3.1 — Firebase Core Initialization（OIDC + Persistence + Emulator対応）

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator 
} from "firebase/firestore";

// --- 環境変数 (Vite用: import.meta.env) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- Firebase App 初期化 ---
export const app = initializeApp(firebaseConfig);

// --- Auth ---
export const auth = getAuth(app);

// 【重要】認証永続化（推奨）
// "ログイン保持されない" 問題を根本的に解決
setPersistence(auth, browserLocalPersistence)
  .catch((err) => console.error("Auth persistence error:", err));

// --- Firestore ---
export const db = getFirestore(app);

// --- Emulator（必要時にONにする方式） ---
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === "true") {
  console.log("🔥 Using Firebase Emulators");
  // connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

export default app;
