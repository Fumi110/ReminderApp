// functions/utils/pdfGenerator.js
import admin from "firebase-admin";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export async function generateMealsPdf(year, week, envMode) {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // 簡易テンプレ（週次食数の概念的PDF）
  const tmpPath = `/tmp/meals_${year}_w${week}.pdf`;
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const stream = fs.createWriteStream(tmpPath);
  doc.pipe(stream);

  doc.fontSize(18).text(`食数投票 週報: ${year} / Week ${week}`, { align: "center" });
  doc.moveDown();

  // ここで必要に応じて Firestore 集計を差し込む
  doc.fontSize(12).text(`環境: ${envMode}`);
  doc.text(`生成日時: ${new Date().toLocaleString("ja-JP")}`);
  doc.end();

  await new Promise((res) => stream.on("finish", res));

  const dest = `${envMode}/pdf/meals_${year}_w${week}.pdf`;
  await bucket.upload(tmpPath, { destination: dest, metadata: { contentType: "application/pdf" } });
  fs.unlinkSync(tmpPath);

  // 署名URL（任意）
  const [file] = await bucket.file(dest).getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 // 1h
  });

  // ログ
  await db.collection(`${envMode}_pdf_logs`).add({
    type: "meals",
    year,
    week,
    path: dest,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, url: file };
}
