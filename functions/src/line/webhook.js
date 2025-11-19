import { onRequest } from "firebase-functions/v2/https";
import { lineClient } from "./client.js";
import crypto from "crypto";

export const lineWebhook = onRequest(async (req, res) => {
  try {
    const signature = req.get("x-line-signature");

    if (!signature) {
      return res.status(400).send("Missing signature");
    }

    // 署名検証（セキュリティ）
    const hash = crypto
      .createHmac("sha256", process.env.LINE_CHANNEL_SECRET)
      .update(JSON.stringify(req.body))
      .digest("base64");

    if (hash !== signature) {
      return res.status(403).send("Invalid signature");
    }

    const events = req.body.events;

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        await lineClient.replyMessage(event.replyToken, {
          type: "text",
          text: `「${event.message.text}」ですね。承知しました。`,
        });
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("[LINE Webhook Error]", error);
    return res.status(500).send(error.message);
  }
});
