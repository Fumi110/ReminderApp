// /src/components/admin/AdminDeadline.jsx
// ReminderApp Ver.3.1 — C4: Deadline Management UI（週次締切パターン対応）
// - deadlines/meal_vote：
//     deadline        : "YYYY-MM-DDTHH:MM" （local）
//     description     : string
//     weekly_enabled  : boolean
//     weekly_weekday  : 0〜6（日〜土）
//     weekly_time     : "HH:MM"
// - duty_report / swap_request は従来どおり deadline + description のみ

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import useAppStore from "../../store/appStore";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// Firestore の deadline フィールドを <input type="datetime-local"> 用に整形
function normalizeDeadlineForInput(raw) {
  if (!raw) return "";

  // すでに文字列ならそのまま（"YYYY-MM-DDTHH:MM" を想定）
  if (typeof raw === "string") {
    return raw;
  }

  // Firestore Timestamp 型に対応
  if (raw.toDate) {
    const d = raw.toDate();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  return "";
}

// 毎週 ○曜日 HH:MM から「次回の締切（今日以降）」を計算して
// "YYYY-MM-DDTHH:MM" 形式の文字列として返す
function computeNextWeeklyDeadline(weekday, timeHHMM) {
  if (weekday == null || timeHHMM == null || timeHHMM === "") return "";

  const [hStr, mStr] = timeHHMM.split(":");
  const hh = parseInt(hStr ?? "0", 10) || 0;
  const mi = parseInt(mStr ?? "0", 10) || 0;

  const now = new Date();
  const base = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hh,
    mi,
    0,
    0
  );

  const currentDow = base.getDay();
  let diff = (weekday - currentDow + 7) % 7;
  if (diff === 0 && base <= now) {
    diff = 7; // 今日かつ既に過ぎていれば翌週
  }
  base.setDate(base.getDate() + diff);

  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  const h2 = String(base.getHours()).padStart(2, "0");
  const m2 = String(base.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${h2}:${m2}`;
}

export default function AdminDeadline() {
  const isAdmin = useAppStore((state) => state.isAdmin);

  const [data, setData] = useState({
    meal_vote: {
      deadline: "",
      description: "",
      weeklyEnabled: false,
      weeklyWeekday: 5, // 金曜日
      weeklyTime: "00:00",
    },
    duty_report: { deadline: "", description: "" },
    swap_request: { deadline: "", description: "" },
  });

  const [loading, setLoading] = useState(true);

  // UIラベル
  const labelMap = {
    meal_vote: "食数投票",
    duty_report: "当番完了報告",
    swap_request: "交代申請",
  };

  // ---------------------------------------------------------
  // Firestore: load deadlines
  // ---------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      const keys = ["meal_vote", "duty_report", "swap_request"];
      const newState = {};

      for (const key of keys) {
        const ref = doc(db, "deadlines", key);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const d = snap.data();

          if (key === "meal_vote") {
            newState[key] = {
              deadline: normalizeDeadlineForInput(d.deadline),
              description: d.description || "",
              weeklyEnabled: !!d.weekly_enabled,
              weeklyWeekday:
                typeof d.weekly_weekday === "number"
                  ? d.weekly_weekday
                  : 5, // default 金曜
              weeklyTime: d.weekly_time || "00:00",
            };
          } else {
            newState[key] = {
              deadline: normalizeDeadlineForInput(d.deadline),
              description: d.description || "",
            };
          }
        } else {
          // デフォルト値
          if (key === "meal_vote") {
            newState[key] = {
              deadline: "",
              description: "",
              weeklyEnabled: false,
              weeklyWeekday: 5,
              weeklyTime: "00:00",
            };
          } else {
            newState[key] = { deadline: "", description: "" };
          }
        }
      }

      setData(newState);
      setLoading(false);
    };

    load();
  }, []);

  // ---------------------------------------------------------
  // Firestore: save
  // ---------------------------------------------------------
  const saveDeadline = async (key) => {
    const ref = doc(db, "deadlines", key);

    if (key === "meal_vote") {
      const entry = data.meal_vote;

      // weeklyEnabled が ON で deadline が空なら「次回締切」を自動計算
      let deadlineToSave = entry.deadline;
      if (!deadlineToSave && entry.weeklyEnabled) {
        deadlineToSave = computeNextWeeklyDeadline(
          entry.weeklyWeekday,
          entry.weeklyTime
        );
      }

      await setDoc(
        ref,
        {
          deadline: deadlineToSave || null,
          description: entry.description || "",
          weekly_enabled: entry.weeklyEnabled,
          weekly_weekday: entry.weeklyWeekday,
          weekly_time: entry.weeklyTime,
        },
        { merge: true }
      );
    } else {
      const entry = data[key];
      await setDoc(
        ref,
        {
          deadline: entry.deadline || null,
          description: entry.description || "",
        },
        { merge: true }
      );
    }

    alert(`「${labelMap[key]}」の締切を更新しました。`);
  };

  if (!isAdmin) {
    return <div className="text-red-600">管理者のみアクセスできます。</div>;
  }

  if (loading) {
    return <div className="p-4 text-gray-600">読み込み中です...</div>;
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* 食数投票：週次パターン付き */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          食数投票の締切
        </h3>

        <div className="space-y-4">
          {/* 現在の締切 */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              現在の締切（datetime-local 形式）
            </label>
            <input
              type="datetime-local"
              value={data.meal_vote.deadline}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  meal_vote: {
                    ...prev.meal_vote,
                    deadline: e.target.value,
                  },
                }))
              }
              className="w-full mt-1 p-2 border rounded"
            />
            <p className="mt-1 text-xs text-gray-500">
              空欄のままでも構いません（下の「毎週締切設定」から自動計算可）。
            </p>
          </div>

          {/* 毎週締切設定 */}
          <div className="border-t pt-4 mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                毎週締切設定
              </span>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={data.meal_vote.weeklyEnabled}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      meal_vote: {
                        ...prev.meal_vote,
                        weeklyEnabled: e.target.checked,
                      },
                    }))
                  }
                />
                <span>毎週この曜日・時刻で締切を自動管理する</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {/* 曜日 */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  曜日
                </label>
                <select
                  value={data.meal_vote.weeklyWeekday}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      meal_vote: {
                        ...prev.meal_vote,
                        weeklyWeekday: Number(e.target.value),
                      },
                    }))
                  }
                  className="mt-1 p-2 border rounded"
                >
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <option key={idx} value={idx}>
                      {label}曜日
                    </option>
                  ))}
                </select>
              </div>

              {/* 時刻 */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  時刻
                </label>
                <input
                  type="time"
                  value={data.meal_vote.weeklyTime}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      meal_vote: {
                        ...prev.meal_vote,
                        weeklyTime: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 p-2 border rounded"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              例）「金曜日」「00:00」とすると、常に
              「次に来る金曜0:00」が締切として計算されます。
            </p>
          </div>

          {/* 説明 */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              説明（例：前週金曜0:00）
            </label>
            <input
              type="text"
              value={data.meal_vote.description}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  meal_vote: {
                    ...prev.meal_vote,
                    description: e.target.value,
                  },
                }))
              }
              className="w-full mt-1 p-2 border rounded"
              placeholder="例：前週金曜0:00"
            />
          </div>

          <button
            onClick={() => saveDeadline("meal_vote")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            食数投票の締切を保存
          </button>
        </div>
      </div>

      {/* 当番完了報告・交代申請：従来どおり */}
      {["duty_report", "swap_request"].map((key) => (
        <div key={key} className="bg-white border rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {labelMap[key]}の締切
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                締切日時（datetime-local）
              </label>
              <input
                type="datetime-local"
                value={data[key].deadline}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    [key]: {
                      ...prev[key],
                      deadline: e.target.value,
                    },
                  }))
                }
                className="w-full mt-1 p-2 border rounded"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                説明
              </label>
              <input
                type="text"
                value={data[key].description}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    [key]: {
                      ...prev[key],
                      description: e.target.value,
                    },
                  }))
                }
                className="w-full mt-1 p-2 border rounded"
              />
            </div>

            <button
              onClick={() => saveDeadline(key)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {labelMap[key]}の締切を保存
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
