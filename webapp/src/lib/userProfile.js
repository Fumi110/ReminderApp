// /src/lib/userProfile.js
// ReminderApp Ver.3.1 — Firestore User 初回登録ロジック

import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Firebase Auth user が存在するが、
 * Firestore に users/{uid} がまだない場合、初期プロフィールを作成。
 */
export async function initUserProfileIfNeeded(firebaseUser, lineProfile = null) {
  if (!firebaseUser) return;

  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  // すでに存在 → 何もしない
  if (snap.exists()) return snap.data();

  // 初回登録
  const profile = {
    uid: firebaseUser.uid,
    name: lineProfile?.displayName ?? "未設定",
    picture: lineProfile?.pictureUrl ?? null,
    role: "user",               // デフォルト権限
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, profile);
  console.log("🆕 [Firestore] 初期プロフィール作成:", profile);

  return profile;
}
