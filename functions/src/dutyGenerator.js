// /functions/src/dutyGenerator.js
// ReminderApp Ver.3.1 — Duty Generator JS

import admin from "firebase-admin";

/** Firestore Admin DB */
const db = admin.firestore();

// ---------------------------------------------------------
// generateWeeklyDuties(startDate)
// ---------------------------------------------------------
export async function generateWeeklyDuties(startDate) {
  console.log("▶ generateWeeklyDuties called:", startDate);

  // users (ローテーション順)
  const usersSnap = await db.collection("users").get();
  const userOrder = usersSnap.docs.map((d) => d.id);
  console.log("userOrder:", userOrder);

  // 現在の duty cycle
  const cycleRef = db.collection("config").doc("duty_cycle_current");
  const cycleSnap = await cycleRef.get();
  const cycle = cycleSnap.data() || {};

  // excluded_days_duty
  const exclSnap = await db.collection("excluded_days_duty").get();
  const excludedDaySet = new Set(exclSnap.docs.map((d) => d.data().date));

  // weekly_excluded_days_duty
  const weeklySnap = await db.collection("weekly_excluded_days_duty").get();
  const weeklyRules = weeklySnap.docs
    .filter((d) => d.data().active !== false)
    .map((d) => d.data());

  const dutyTypes = ["garbage", "bath"];
  const currentIndex = {};

  dutyTypes.forEach((type) => {
    let idx = userOrder.indexOf(cycle[type]);
    if (idx < 0) idx = 0;
    currentIndex[type] = idx;
  });

  const results = [];

  // 1週間生成
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = formatDate(d);
    const weekday = d.getDay();

    if (excludedDaySet.has(dateStr)) {
      results.push({ date: dateStr, garbage: null, bath: null });
      continue;
    }

    const row = { date: dateStr };

    for (const type of dutyTypes) {
      let idx = currentIndex[type];
      let assigned = null;

      const weeklyExcludedUsers = weeklyRules
        .filter((r) => r.type === type || r.type === "both")
        .filter((r) => r.weekday === weekday)
        .map((r) => r.user_id);

      for (let tries = 0; tries < userOrder.length; tries++) {
        idx = (idx + 1) % userOrder.length;
        const candidate = userOrder[idx];

        if (!weeklyExcludedUsers.includes(candidate)) {
          assigned = candidate;
          currentIndex[type] = idx;
          break;
        }
      }
      row[type] = assigned;
    }

    results.push(row);
  }

  // duties に書き込み
  for (const row of results) {
    for (const type of dutyTypes) {
      await db
        .collection("duties")
        .doc(`${row.date}_${type}`)
        .set({
          date: row.date,
          type,
          assigned_to: row[type],
          status: "pending",
          created_at: admin.firestore.Timestamp.now(),
        });
    }
  }

  // 現在サイクル更新
  await cycleRef.set({
    garbage: results[6].garbage,
    bath: results[6].bath,
    updated_at: admin.firestore.Timestamp.now(),
  });

  console.log("✔ Duties generated:", results);
  return results;
}

// Utility
function formatDate(d) {
  return d.toISOString().split("T")[0];
}
