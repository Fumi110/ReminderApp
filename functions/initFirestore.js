/**
 * initFirestore.js - ReminderApp Ver3 初期データ自動投入スクリプト
 * --------------------------------------------------------------
 * 実行方法：
 *   cd C:/ReminderApp/functions
 *   node initFirestore.js
 *
 * Firestore Emulator 専用（serviceAccountKey は不要）
 */

const admin = require("firebase-admin");

// Firestore Emulator を使用する設定
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:4904";

// Emulator の Application Default Credentials を使うので credential 設定不要
admin.initializeApp();

const db = admin.firestore();

(async () => {
  console.log("🚀 Firestore 初期データ投入開始 (Ver3)…");

  // ====== 1. テストユーザー作成 ======
  const testUserId = "test_dev_user_01";

  await db.collection("development_users").doc(testUserId).set({
    uid: testUserId,
    display_name: "テスト太郎",
    name: "テスト太郎",
    name_kana: "てすとたろう",
    picture: "",
    role: "admin",
    enrollment_year: 2022,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    notification_settings: {
      duty: true,
      vote: true,
    },
  });

  console.log("✔ development_users 作成完了:", testUserId);

  // ====== 2. development_cycle_state ======
  await db.collection("development_cycle_state").doc("default").set({
    cycle_garbage: 0,
    cycle_bath: 0,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("✔ development_cycle_state 作成完了 (default)");

  // ====== 3. development_excluded_dates ======
  await db.collection("development_excluded_dates").doc("default").set({
    dates: [],
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("✔ development_excluded_dates 作成完了");

  // ====== 4. duties などは空のまま
  console.log("✔ development_duties コレクション準備完了");
  console.log("✔ development_meal_votes コレクション準備完了");
  console.log("✔ development_swap_requests コレクション準備完了");

  console.log("🎉 Firestore 初期化が完了しました！");
  process.exit(0);
})();
