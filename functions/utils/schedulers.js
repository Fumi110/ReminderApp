// functions/utils/schedulers.js
import admin from "firebase-admin";
import { sendLineNotification } from "./firestoreUtils.js";

/** 当番リマインド（サンプル：当日未完了者に送信） */
export async function scheduleDutyReminders(envMode = "prod") {
  const db = admin.firestore();
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const key = `${y}-${m}-${d}`;

  // 例: `${envMode}_duties` に { date: "YYYY-MM-DD", roles: { garbage: [...], bath: [...] }, completed: {...} }
  const snap = await db.collection(`${envMode}_duties`).doc(key).get();
  if (!snap.exists) return;

  const data = snap.data() || {};
  const pendingLineUserIds = [];

  // あなたのスキーマに合わせて “未完了者抽出” を実装してください（以下は概念例）
  for (const role of ["garbage", "bath"]) {
    const assigned = data.roles?.[role] || [];
    const completed = data.completed?.[role] || [];
    for (const uid of assigned) {
      if (!completed.includes(uid)) pendingLineUserIds.push(uid);
    }
  }

  // 送信
  await Promise.all(
    pendingLineUserIds.map((lineId) =>
      sendLineNotification(lineId, `本日の当番（${key}）の実施報告をお願いします。`, envMode)
    )
  );
}

/** 食数投票リマインド（サンプル：締切前の全員に送る） */
export async function scheduleMealReminders(envMode = "prod") {
  const db = admin.firestore();
  const qs = await db.collection(`${envMode}_meal_votes`).where("is_open", "==", true).get();
  if (qs.empty) return;

  const userIds = await collectActiveUserIds(envMode);
  await Promise.all(
    userIds.map((lineId) =>
      sendLineNotification(lineId, "今週の食数投票の入力をお願いします。", envMode)
    )
  );
}

async function collectActiveUserIds(envMode) {
  const db = admin.firestore();
  const qs = await db.collection(`${envMode}_users`).where("role", "in", ["general", "admin"]).get();
  return qs.docs.map((d) => d.id); // line_user_id をドキュメントIDにしている前提
}
