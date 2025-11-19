// /src/utils/userName.js
// ユーザーの表示名（漢字フルネーム）取得共通関数
// ReminderApp Ver.3.1 - Unified

/**
 * Firestore users ドキュメントから表示名を取得する
 * - display_name を最優先（漢字フルネーム）
 * - なければ name
 * - それもなければ id
 */
export function getUserDisplayName(user) {
  if (!user) return "不明なユーザー";

  if (user.display_name && user.display_name.trim() !== "") {
    return user.display_name;
  }

  if (user.name && user.name.trim() !== "") {
    return user.name;
  }

  return user.id || "不明なユーザー";
}
