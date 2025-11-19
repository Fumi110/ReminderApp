// /src/components/admin/ExcludedDatesPanel.jsx
// ReminderApp Ver.3.1 — 当番生成用「除外日・除外曜日」設定画面

import React, { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// Date → "YYYY-MM-DD"
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// XOR ロジック（Functions 側と厳密に同じ）
const isExcludedDate = (date, excludedDates, excludedWeekdays) => {
  const dateStr = formatDate(date);
  const weekday = date.getDay();
  const weekdayExcluded = excludedWeekdays.includes(weekday);
  const toggled = excludedDates.includes(dateStr);

  if (weekdayExcluded) {
    return !toggled; // デフォルト除外 → トグルで「含める」
  }
  return toggled; // デフォルト含める → トグルで「除外」
};

export default function ExcludedDatesPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [excludedWeekdays, setExcludedWeekdays] = useState([]); // number[]
  const [excludedDates, setExcludedDates] = useState([]); // "YYYY-MM-DD"[]

  // dev / prod 切り替え（Vite 標準）
  const isDev = import.meta.env.MODE !== "production";
  const configCollection = isDev ? "development_config" : "config";
  const docId = "duty_cycle_settings";

  // 画面初期読込
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const ref = doc(db, configCollection, docId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          // 初期値ドキュメントを作成
          await setDoc(ref, {
            cycle_bath: 0,
            cycle_garbage: 0,
            excluded_weekdays: [],
            excluded_dates: [],
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });

          setExcludedWeekdays([]);
          setExcludedDates([]);
        } else {
          const data = snap.data() || {};
          setExcludedWeekdays(data.excluded_weekdays || []);
          setExcludedDates(data.excluded_dates || []);
        }
      } catch (e) {
        console.error("[ExcludedDatesPanel] load error:", e);
        setError("設定の読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [configCollection]);

  // 曜日チェックボックスのトグル
  const handleWeekdayToggle = (weekdayIndex) => {
    setExcludedWeekdays((prev) => {
      if (prev.includes(weekdayIndex)) {
        return prev.filter((w) => w !== weekdayIndex);
      }
      return [...prev, weekdayIndex].sort((a, b) => a - b);
    });
  };

  // 日付クリックのトグル（Functions 側と整合する XOR 用の「トグル」配列扱い）
  const handleDayClick = (day) => {
    if (!day) return;

    const key = formatDate(day);
    setExcludedDates((prev) => {
      const exists = prev.includes(key);
      if (exists) {
        // 既にトグル済 → 解除
        return prev.filter((d) => d !== key);
      }
      // まだトグルされていない → 追加
      return [...prev, key].sort();
    });
  };

  // DayPicker に渡す「除外状態」判定
  const modifiers = useMemo(
    () => ({
      excluded: (day) => isExcludedDate(day, excludedDates, excludedWeekdays),
    }),
    [excludedDates, excludedWeekdays]
  );

  const modifiersClassNames = {
    excluded: "bg-gray-300 text-gray-700 line-through",
  };

  // 保存処理
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const ref = doc(db, configCollection, docId);
      await setDoc(
        ref,
        {
          excluded_weekdays: excludedWeekdays,
          excluded_dates: excludedDates,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("除外日設定を保存しました。");
    } catch (e) {
      console.error("[ExcludedDatesPanel] save error:", e);
      setError("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  // リセット（すべて除外解除）
  const handleReset = async () => {
    setExcludedWeekdays([]);
    setExcludedDates([]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-2">⛔ 当番の除外日設定</h2>
      <p className="text-sm text-gray-600 mb-4">
        ここで設定した「除外曜日」と「除外日」は、当番自動生成
       （ごみ2人＋風呂1人）から除外されます。
        <br />
        ・曜日を選ぶと、その曜日は原則すべて除外
        <br />
        ・そのうえで、カレンダー上の特定日をクリックすると、
        その日だけ「除外 ⇔ 当番あり」が切り替わります。
      </p>

      {loading && (
        <div className="text-gray-500">読み込み中です…</div>
      )}

      {!loading && (
        <>
          {/* 曜日選択 */}
          <div>
            <h3 className="font-semibold mb-2">除外する曜日</h3>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, idx) => {
                const active = excludedWeekdays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleWeekdayToggle(idx)}
                    className={
                      "px-3 py-1 rounded-full border text-sm transition " +
                      (active
                        ? "bg-gray-800 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100")
                    }
                  >
                    {label}曜
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              例）「土曜・日曜」を選択すると、原則として全ての土日が除外されます。
              個別に当番を入れたい日は、下のカレンダーで日付をクリックしてください。
            </p>
          </div>

          {/* カレンダー */}
          <div>
            <h3 className="font-semibold mb-2">カレンダーで個別調整</h3>
            <DayPicker
              mode="single"
              onDayClick={handleDayClick}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              captionLayout="dropdown"
              fromYear={2024}
              toYear={2030}
            />
            <p className="text-xs text-gray-500 mt-1">
              グレーの斜線つきの日が「除外」扱いです。
              曜日設定で除外されている日も含めて、再クリックで状態を反転できます。
            </p>
          </div>

          {/* 現在の設定の簡易表示 */}
          <div className="text-sm bg-gray-50 rounded-md p-3 space-y-1">
            <div>
              <span className="font-semibold">除外曜日:</span>{" "}
              {excludedWeekdays.length === 0
                ? "なし"
                : excludedWeekdays
                    .map((w) => `${WEEKDAY_LABELS[w]}曜`)
                    .join(" / ")}
            </div>
            <div>
              <span className="font-semibold">除外トグル日数:</span>{" "}
              {excludedDates.length} 日
            </div>
          </div>

          {/* ボタン・メッセージ */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "保存中…" : "この設定を保存"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-100"
            >
              全てリセット（除外なしに戻す）
            </button>

            {message && (
              <span className="text-sm text-green-600">{message}</span>
            )}
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
