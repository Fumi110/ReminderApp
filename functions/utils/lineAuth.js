// functions/utils/lineAuth.js
// LINE Login Authentication Handler (ESM)
// Validates LINE OAuth tokens and creates/updates user records

import admin from "firebase-admin";
import axios from "axios";

/**
 * 単一キー運用:
 *   LINE_CHANNEL_ID / LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN
 *   +（必要なら）_PROD / _DEV での上書きに対応
 */
function getLineCredentials(envMode) {
  const base = {
    channelId: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
  };
  const override =
    envMode === "prod"
      ? {
          channelId: process.env.LINE_CHANNEL_ID_PROD || base.channelId,
          channelSecret: process.env.LINE_CHANNEL_SECRET_PROD || base.channelSecret,
          channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_PROD || base.channelAccessToken
        }
      : {
          channelId: process.env.LINE_CHANNEL_ID_DEV || base.channelId,
          channelSecret: process.env.LINE_CHANNEL_SECRET_DEV || base.channelSecret,
          channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN_DEV || base.channelAccessToken
        };

  const cfg = { ...base, ...override };

  if (!cfg.channelId || !cfg.channelSecret) {
    throw new Error(`LINE credentials not configured for ${envMode} environment`);
  }
  return cfg;
}

/** Verify LINE access token and get profile */
async function verifyLineToken(accessToken, envMode) {
  const { channelId } = getLineCredentials(envMode);
  const verifyUrl = "https://api.line.me/oauth2/v2.1/verify";
  const verifyRes = await axios.get(verifyUrl, { params: { access_token: accessToken } });
  if (verifyRes.data.client_id !== channelId) {
    throw new Error("Invalid LINE channel ID");
  }

  const profileUrl = "https://api.line.me/v2/profile";
  const profileRes = await axios.get(profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return profileRes.data; // { userId, displayName, pictureUrl, statusMessage }
}

/** Handle LINE login callback */
export async function handleLineLoginCallback(body, envMode) {
  const db = admin.firestore();
  const { channelId, channelSecret } = getLineCredentials(envMode);

  let accessToken;
  if (body.code) {
    const tokenUrl = "https://api.line.me/oauth2/v2.1/token";
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: body.code,
      redirect_uri: body.redirect_uri,
      client_id: channelId,
      client_secret: channelSecret
    });
    const tokenRes = await axios.post(tokenUrl, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    accessToken = tokenRes.data.access_token;
  } else if (body.access_token) {
    accessToken = body.access_token;
  } else {
    throw new Error("Missing code or access_token");
  }

  // Verify & profile
  const profile = await verifyLineToken(accessToken, envMode);
  const lineUserId = profile.userId;

  // Upsert user
  const col = db.collection(`${envMode}_users`);
  const doc = col.doc(lineUserId);
  const snap = await doc.get();

  if (!snap.exists) {
    await doc.set({
      line_user_id: lineUserId,
      name: profile.displayName || "新規ユーザー",
      role: "general",
      notification_settings: { duty_remind: true, meal_remind: true },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_login: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    await doc.update({ last_login: admin.firestore.FieldValue.serverTimestamp() });
  }

  const data = (await doc.get()).data();

  // Firebase custom token
  const customToken = await admin.auth().createCustomToken(lineUserId, {
    envMode,
    role: data?.role || "general"
  });

  return {
    success: true,
    user: {
      line_user_id: lineUserId,
      name: data?.name || profile.displayName || "",
      role: data?.role || "general",
      envMode
    },
    customToken
  };
}
