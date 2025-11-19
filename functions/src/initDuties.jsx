// /functions/src/initDuties.js
// ReminderApp Ver.3.1 — Duties 初期化 API
// 住人3名 → ゴミ2名 + 風呂1名 の当番構造で初期生成

import admin from "firebase-admin";
const db = admin.firestore();

/**
 * duties コレクション初期化
 * 
 * input:
 *   {
 *     startDate: "2025-01-01",
 *     days: 14,
 *     env: "dev" | "prod"
 *   }
 */
export async function initDuties(startDate, days, env = "dev") {
  console.log("▶ initDuties called:", { startDate, days, env });

  const dutiesCol = env === "dev" ? "development_duties" : "duties";
  const usersCol = env === "dev" ? "development_users" : "users";

  // --------------------------
  // ① users を取得
  // --------------------------
  const usersSnap = await db.collection(usersCol).get();
  const userIds = usersSnap.docs.map((d) => d.id);

  if (userIds.length < 3) {
    throw new Error("ユーザー数が3名未満のため、当番を初期化できません。");
  }

  console.log("users:", userIds);

  // --------------------------
  // ② duties を削除（クリア）
  // --------------------------
  const oldSnap = await db.collection(dutiesCol).get();
  for (const d of oldSnap.docs) {
    await d.ref.delete();
  }
  console.log("✔ old duties cleared");

  // --------------------------
  // ③ 当番を生成
  // --------------------------
  const start = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const garbage1 = userIds[(i * 2) % userIds.length];
    const garbage2 = userIds[(i * 2 + 1) % userIds.length];
    const bath = userIds[(i * 2 + 2) % userIds.length];

    await db
      .collection(dutiesCol)
      .doc(`${dateStr}`)
      .set({
        date: dateStr,
        garbage: [garbage1, garbage2],
        bath: bath,
        status: "pending",
        updated_at: admin.firestore.Timestamp.now(),
      });

    console.log("added:", {
      date: dateStr,
      garbage: [garbage1, garbage2],
      bath,
    });
  }

  return { ok: true };
}
