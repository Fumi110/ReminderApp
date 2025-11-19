// /functions/src/scheduledDuties.js
// ReminderApp Ver.3.1 — ESM版（import/export）
// Cloud Scheduler → Pub/Sub で週次当番生成

import { onPublish } from "firebase-functions/v2/pubsub";
import { generateWeeklyDuties } from "./dutyGenerator.js";

export const generateWeeklyDutiesJob = onPublish("generate-duties", async (event) => {
  console.log("🔥 generateWeeklyDutiesJob triggered");

  const data = event.data?.message?.json || {};
  const startDateString = data.startDate;

  if (!startDateString) {
    console.error("❌ startDate が指定されていません");
    return;
  }

  const startDate = new Date(startDateString);
  console.log("📅 Generating duties from:", startDate);

  try {
    const results = await generateWeeklyDuties(startDate);
    console.log("✅ Generated duties:", results.length);
  } catch (err) {
    console.error("❌ Error generating duties:", err);
  }
});
