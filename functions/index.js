// -------------------------------------------------------------
// index.js — ReminderApp Ver.3.1 Cloud Functions（完全安定版）
// Firebase Admin SDK v12 / CommonJS
// -------------------------------------------------------------

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// v12: FieldValue は firebase-admin/firestore から取得
const { FieldValue } = require("firebase-admin/firestore");

// .env 読み込み
require("dotenv").config();

// -------------------------------------------------------------
//  環境モード Utility
// -------------------------------------------------------------
const NODE_ENV = process.env.NODE_ENV || "development";

const getEnvMode = () => (NODE_ENV === "production" ? "prod" : "dev");

const getCollectionName = (base) =>
  getEnvMode() === "dev" ? `development_${base}` : base;

// -------------------------------------------------------------
//  Utilities（共通）
// -------------------------------------------------------------
const parseDate = (s) => new Date(`${s}T00:00:00+09:00`);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const formatDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

// -------------------------------------------------------------
//  除外ロジック（曜日＋個別日付）
// -------------------------------------------------------------
const isExcludedDate = (date, excludedDates, excludedWeekdays) => {
  const dateStr = formatDate(date);
  const weekday = date.getDay();

  const weekdayExcluded = excludedWeekdays.includes(weekday);
  const toggled = excludedDates.includes(dateStr);

  if (weekdayExcluded) {
    return !toggled; // デフォルト除外 → 反転で復活
  }
  return toggled; // デフォルト含む → toggled なら除外
};

// -------------------------------------------------------------
// generateWeeklyDuties（本番運用）
// -------------------------------------------------------------
exports.generateWeeklyDuties = functions
  .region("asia-northeast1")
  .https.onRequest(async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { startDate, endDate, envMode } = req.body || {};
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required" });
      }

      const mode = envMode || getEnvMode();
      const usersCol = mode === "dev" ? "development_users" : "users";
      const dutiesCol = mode === "dev" ? "development_duties" : "duties";
      const configCol = mode === "dev" ? "development_config" : "config";

      // --------------------------
      // ① ユーザー読み込み
      // --------------------------
      const usersSnap = await db.collection(usersCol).get();
      if (usersSnap.empty) {
        return res.status(400).json({ error: "No users found" });
      }

      let users = usersSnap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      }));

      users = users.sort((a, b) => {
        if ((a.enrollment_year || 0) !== (b.enrollment_year || 0)) {
          return (b.enrollment_year || 0) - (a.enrollment_year || 0);
        }
        return (a.name_kana || "").localeCompare(b.name_kana || "");
      });

      // --------------------------
      // ② cycle 読み込み
      // --------------------------
      const cycleRef = db.collection(configCol).doc("duty_cycle_settings");
      const cycleSnap = await cycleRef.get();

      if (!cycleSnap.exists) {
        return res.status(400).json({ error: "Missing duty_cycle_settings" });
      }

      const cycle = cycleSnap.data();
      let bathIndex = cycle.cycle_bath || 0;
      let garbageIndex = cycle.cycle_garbage || 0;
      const excludedDates = cycle.excluded_dates || [];
      const excludedWeekdays = cycle.excluded_weekdays || [];

      // --------------------------
      // ③ 生成ループ
      // --------------------------
      const sDate = parseDate(startDate);
      const eDate = parseDate(endDate);
      let cur = sDate;

      const batch = db.batch();

      while (cur <= eDate) {
        if (isExcludedDate(cur, excludedDates, excludedWeekdays)) {
          cur = addDays(cur, 1);
          continue;
        }

        const dateStr = formatDate(cur);

        // ゴミ：2名
        const g1 = users[garbageIndex % users.length].uid;
        const g2 = users[(garbageIndex + 1) % users.length].uid;
        garbageIndex += 2;

        // 風呂：1名
        const b1 = users[bathIndex % users.length].uid;
        bathIndex += 1;

        batch.set(db.collection(dutiesCol).doc(`${dateStr}_garbage`), {
          date: dateStr,
          type: "garbage",
          assigned: [g1, g2],
          status: "pending",
          created_at: FieldValue.serverTimestamp(),
        });

        batch.set(db.collection(dutiesCol).doc(`${dateStr}_bath`), {
          date: dateStr,
          type: "bath",
          assigned: [b1],
          status: "pending",
          created_at: FieldValue.serverTimestamp(),
        });

        cur = addDays(cur, 1);
      }

      await batch.commit();

      await cycleRef.set(
        {
          cycle_bath: bathIndex % users.length,
          cycle_garbage: garbageIndex % users.length,
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[generateWeeklyDuties] ERROR:", err);
      return res.status(500).json({ error: err.message });
    }
  });

// -------------------------------------------------------------
// initDutiesFunc（初期データ作成 API）
// -------------------------------------------------------------
exports.initDutiesFunc = functions
  .region("asia-northeast1")
  .https.onRequest(async (req, res) => {
    try {
      const { startDate, days, env = "dev" } = req.body || {};

      if (!startDate || !days) {
        return res.status(400).json({ error: "startDate or days missing" });
      }

      const dutiesCol =
        env === "dev" ? "development_duties" : "duties";

      const sDate = parseDate(startDate);

      const batch = db.batch();

      for (let i = 0; i < days; i++) {
        const d = addDays(sDate, i);
        const dateStr = formatDate(d);

        batch.set(db.collection(dutiesCol).doc(`${dateStr}_garbage`), {
          date: dateStr,
          type: "garbage",
          assigned: [],
          status: "pending",
          created_at: FieldValue.serverTimestamp(),
        });

        batch.set(db.collection(dutiesCol).doc(`${dateStr}_bath`), {
          date: dateStr,
          type: "bath",
          assigned: [],
          status: "pending",
          created_at: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      return res.json({ ok: true, created: days });
    } catch (e) {
      console.error("[initDutiesFunc] ERROR:", e);
      return res.status(500).json({ error: e.message });
    }
  });

// -------------------------------------------------------------
// loginLineUser（既存）
// -------------------------------------------------------------
exports.loginLineUser = functions
  .region("asia-northeast1")
  .https.onRequest(async (req, res) => {
    try {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      const { accessToken } = req.body || {};
      if (!accessToken) {
        return res.status(400).json({ error: "accessToken required" });
      }

      const fetch = (await import("node-fetch")).default;

      const r = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!r.ok) {
        return res.status(401).json({ error: "Invalid LINE token" });
      }

      const p = await r.json();
      const uid = p.userId;

      const usersCol = getCollectionName("users");
      const ref = db.collection(usersCol).doc(uid);
      const s = await ref.get();

      if (!s.exists) {
        await ref.set({
          uid,
          display_name: p.displayName || "",
          name_kana: "",
          picture: p.pictureUrl || "",
          role: "user",
          enrollment_year: null,
          created_at: FieldValue.serverTimestamp(),
        });
      }

      const token = await admin.auth().createCustomToken(uid);
      return res.status(200).json({ customToken: token });
    } catch (err) {
      console.error("[loginLineUser] ERROR:", err);
      return res.status(500).json({ error: err.message });
    }
  });
