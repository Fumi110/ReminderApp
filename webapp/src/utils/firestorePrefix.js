// src/utils/firestorePrefix.js
// ReminderApp Ver.3.1 — Firestore コレクション prefix Utility

import { detectEnv } from "./detectEnv";

/**
 * 現在の環境に応じた prefix を返す
 * dev  → "development_"
 * prod → ""
 */
export const getPrefix = () => {
  const mode = detectEnv(); // "dev" or "prod"

  return mode === "dev" ? "development_" : "";
};

/**
 * コレクション名に prefix を付与して返す
 * 例:
 *   prefixCollection("users") → "development_users"（dev）
 *   prefixCollection("users") → "users"（prod）
 */
export const prefixCollection = (baseName) => {
  return `${getPrefix()}${baseName}`;
};
