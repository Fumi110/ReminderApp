// /src/utils/dutyCycleGenerator.js
// ReminderApp Ver.3.1
// 学年順（下級生 → 上級生）＋ name_kana 五十音順で当番サイクルを生成するユーティリティ

/**
 * ユーザー情報の型イメージ
 *
 * {
 *   uid: string,
 *   display_name: string,
 *   name_kana: string,        // 例: "こせとふみひと"
 *   enrollment_year: number,  // 例: 2022
 *   role: "admin" | "user",
 *   is_active?: boolean       // 任意: 当番対象外なら false
 * }
 */

/**
 * 学年順（下級生 → 上級生）＋五十音順で並び替える。
 *
 * enrollment_year が新しいほど「下級生」とみなし、先に並べる。
 * 例: 2025年度入学(1年) → 2024年度入学(2年) → 2023 → ...
 */
export function sortUsersForDuty(rawUsers) {
  const users = (rawUsers || []).filter((u) => {
    if (!u) return false;
    if (u.is_active === false) return false;
    return Boolean(u.uid);
  });

  return users.sort((a, b) => {
    const ay = Number(a.enrollment_year) || 0;
    const by = Number(b.enrollment_year) || 0;

    // 下級生 → 上級生（＝ enrollment_year の大きい順）
    if (ay !== by) {
      return by - ay; // 2025 → 2024 → 2023 ...
    }

    // 同学年内は name_kana の五十音順
    const ak = (a.name_kana || a.display_name || "").toString();
    const bk = (b.name_kana || b.display_name || "").toString();

    return ak.localeCompare(bk, "ja");
  });
}

/**
 * 指定した期間・枠数で当番サイクルを回し、日付ごとの割り当てを生成する。
 *
 * @param {Object} params
 * @param {Array}  params.users         - sortUsersForDuty 済み or raw users
 * @param {Date}   params.startDate     - 当番開始日
 * @param {number} params.numDays       - 何日分生成するか
 * @param {number} params.slotsPerDay   - 1日の当番枠数（例: 2人当番なら 2）
 * @param {boolean} params.skipWeekends - true の場合、土日をスキップ
 *
 * @returns {{
 *   assignmentsByDate: Record<string, string[]>, // "YYYY-MM-DD" -> [uid1, uid2, ...]
 *   cycleOrder: string[]                         // サイクル順（uid の配列）
 * }}
 */
export function generateDutyCycle({
  users,
  startDate,
  numDays,
  slotsPerDay = 1,
  skipWeekends = true,
}) {
  if (!Array.isArray(users) || users.length === 0) {
    return { assignmentsByDate: {}, cycleOrder: [] };
  }

  const sorted = sortUsersForDuty(users);
  const uids = sorted.map((u) => u.uid);
  const assignmentsByDate = {};

  let idx = 0;
  const d = new Date(startDate);

  for (let day = 0; day < numDays; day++) {
    const current = new Date(d.getTime());
    const dow = current.getDay(); // 0:日, 6:土

    if (skipWeekends && (dow === 0 || dow === 6)) {
      // 土日はスキップするが、サイクルは進めない
      d.setDate(d.getDate() + 1);
      continue;
    }

    const dateKey = current.toISOString().slice(0, 10); // YYYY-MM-DD
    const todays = [];

    for (let s = 0; s < slotsPerDay; s++) {
      const uid = uids[idx % uids.length];
      todays.push(uid);
      idx++;
    }

    assignmentsByDate[dateKey] = todays;
    d.setDate(d.getDate() + 1);
  }

  return {
    assignmentsByDate,
    cycleOrder: uids,
  };
}

/**
 * Firestore に書き込む場合のサンプル（実際の仕様に合わせて調整してください）
 *
 * 例:
 * duties/{YYYY-MM-DD} ドキュメントに
 *   { assignments: { [uid]: true } } のような形で保存する、など。
 *
 * この関数はあくまで「使用例」であり、直接は使わなくても OK です。
 */

// import { db } from "../lib/firebase";
// import { doc, setDoc } from "firebase/firestore";
//
// export async function writeDutyCycleToFirestore(assignmentsByDate) {
//   const batch = writeBatch(db);
//   Object.entries(assignmentsByDate).forEach(([dateKey, uids]) => {
//     const ref = doc(db, "duties", dateKey);
//     const assignments = {};
//     uids.forEach((uid) => {
//       assignments[uid] = true; // or 任意の役割名
//     });
//     batch.set(ref, { assignments }, { merge: true });
//   });
//   await batch.commit();
// }
