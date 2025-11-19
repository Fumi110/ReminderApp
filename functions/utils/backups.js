// functions/utils/backups.js
// ReminderApp Ver.3.1 - Backup Utility (ESM版)
// Exports Firestore and Storage backup utilities for scheduled functions

import admin from "firebase-admin";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";

/**
 * Perform a full Firestore backup and upload to Storage.
 * Each backup is stored in the bucket under {envMode}/backups/YYYYMMDD/
 * @param {string} envMode - "dev" | "prod"
 */
export async function performWeeklyBackup(envMode = "prod") {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();
  const dateStr = dayjs().format("YYYYMMDD");
  const tmpDir = `/tmp/firestore_backup_${dateStr}`;

  console.log(`[Backup] Starting weekly backup for ${envMode} (${dateStr})`);

  // Create tmp directory
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  try {
    // Step 1️⃣: Export all collections
    const collections = await db.listCollections();

    for (const col of collections) {
      const colName = col.id;
      if (!colName.startsWith(envMode)) continue; // only backup environment-specific data

      const snapshot = await col.get();
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filePath = path.join(tmpDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`[Backup] Exported ${colName} (${data.length} docs)`);
    }

    // Step 2️⃣: Upload to Storage
    const destinationPrefix = `${envMode}/backups/${dateStr}/`;
    const files = fs.readdirSync(tmpDir);

    for (const file of files) {
      const localPath = path.join(tmpDir, file);
      const destination = `${destinationPrefix}${file}`;
      await bucket.upload(localPath, {
        destination,
        metadata: { contentType: "application/json" },
      });
      console.log(`[Backup] Uploaded ${destination}`);
    }

    // Step 3️⃣: Write log record
    await db.collection(`${envMode}_backup_logs`).add({
      executed_at: admin.firestore.FieldValue.serverTimestamp(),
      date: dateStr,
      status: "success",
      collection_count: collections.length,
    });

    console.log(`[Backup] Completed weekly backup for ${envMode}`);
  } catch (error) {
    console.error("[Backup] Error during backup:", error.message);

    await db.collection(`${envMode}_backup_logs`).add({
      executed_at: admin.firestore.FieldValue.serverTimestamp(),
      date: dateStr,
      status: "failed",
      error: error.message,
    });
  } finally {
    // Cleanup tmp files
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.log("[Backup] Temporary files cleaned up.");
    }
  }
}
