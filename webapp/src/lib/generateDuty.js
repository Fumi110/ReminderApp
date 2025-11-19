/**
 * ---------------------------------------------------------
 * generateWeeklyDuties — Ver3.1 完全版
 * 任意期間の当番データを自動生成
 * ---------------------------------------------------------
 * Input JSON:
 * {
 *   "startDate": "2025-04-01",
 *   "endDate":   "2025-04-07",
 *   "envMode": "dev" | "prod" (optional)
 * }
 */
exports.generateWeeklyDuties = functions
  .region("asia-northeast1")
  .https.onRequest(async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { startDate, endDate } = req.body || {};

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "startDate and endDate are required (YYYY-MM-DD)",
        });
      }

      // envMode → body優先 / fallback: NODE_ENV
      const envMode = req.body.envMode || getEnvMode();
      const usersCol = getCollectionName("users");
      const dutiesCol = getCollectionName("duties");
      const configCol = getCollectionName("config");

      console.log("[generateDuties] envMode:", envMode);
      console.log("[generateDuties] usersCol:", usersCol);
      console.log("[generateDuties] dutiesCol:", dutiesCol);

      // -------------------------------
      // STEP1: ユーザー取得
      // -------------------------------
      const usersSnap = await db.collection(usersCol).get();
      const users = usersSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      if (!users.length) {
        return res.status(400).json({ error: "No users found" });
      }

      // -------------------------------
      // STEP2: Config 読み込み
      // -------------------------------
      const configSnap = await db.collection(configCol).doc("config").get();
      if (!configSnap.exists()) {
        return res.status(400).json({ error: "config document missing" });
      }
      const config = configSnap.data();

      let cycleGarbage = config.cycle_garbage ?? 0;
      let cycleBath = config.cycle_bath ?? 0;
      const excluded = config.excluded_dates || [];

      // -------------------------------
      // STEP3: 並び替え（学年→五十音）
      // -------------------------------
      const sortedUsers = [...users].sort((a, b) => {
        if ((a.enrollment_year || 9999) !== (b.enrollment_year || 9999)) {
          return (a.enrollment_year || 9999) - (b.enrollment_year || 9999);
        }
        return (a.name_kana || "").localeCompare(b.name_kana || "");
      });

      // -------------------------------
      // STEP4: 日付ループ
      // -------------------------------
      const dayjs = require("dayjs");
      let cur = dayjs(startDate);
      const end = dayjs(endDate);

      while (cur.isBefore(end) || cur.isSame(end)) {
        const dateStr = cur.format("YYYY-MM-DD");

        // 除外日ならスキップ
        if (excluded.includes(dateStr)) {
          console.log(`[generateDuties] Skip excluded date: ${dateStr}`);
          cur = cur.add(1, "day");
          continue;
        }

        // -------------------------------
        // 当番の割り当て
        // -------------------------------
        const pick = (n) => sortedUsers[n % sortedUsers.length];

        const garbageUsers = [
          pick(cycleGarbage),
          pick(cycleGarbage + 1),
        ];
        const bathUser = pick(cycleBath);

        // Firestore 書き込み
        await db.collection(dutiesCol).doc(dateStr).set({
          date: dateStr,
          garbage: garbageUsers.map((u) => ({
            uid: u.id,
            name: u.display_name,
          })),
          bath: {
            uid: bathUser.id,
            name: bathUser.display_name,
          },
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // サイクル進行
        cycleGarbage += 2;
        cycleBath += 1;

        cur = cur.add(1, "day");
      }

      // -------------------------------
      // STEP5: Config を更新
      // -------------------------------
      await db.collection(configCol).doc("config").update({
        cycle_garbage: cycleGarbage,
        cycle_bath: cycleBath,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        message: "Duties generated successfully.",
      });
    } catch (err) {
      console.error("[generateWeeklyDuties] ERROR:", err);
      return res.status(500).json({ error: err.message || "Internal error" });
    }
  });
