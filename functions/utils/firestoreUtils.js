// functions/utils/firestoreUtils.js
// LINE push & Firestore helpers (ESM)

import admin from "firebase-admin";
import { messagingApi } from "@line/bot-sdk";

function getMessagingClient(envMode) {
  // 単一キー＋環境別上書き対応
  const base = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const token =
    envMode === "prod"
      ? process.env.LINE_CHANNEL_ACCESS_TOKEN_PROD || base
      : process.env.LINE_CHANNEL_ACCESS_TOKEN_DEV || base;

  if (!token) throw new Error(`LINE access token not configured (${envMode})`);
  return new messagingApi.MessagingApiClient({ channelAccessToken: token });
}

// Push 1:1
export async function sendLineNotification(lineUserId, message, envMode) {
  const client = getMessagingClient(envMode);
  await client.pushMessage({
    to: lineUserId,
    messages: [{ type: "text", text: message }]
  });
  return { success: true };
}

// 送信ログ保存（任意）
export async function logSend(envMode, payload) {
  const db = admin.firestore();
  await db.collection(`${envMode}_send_logs`).add({
    ...payload,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });
}
