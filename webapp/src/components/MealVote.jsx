// /src/components/MealVote.jsx
// ReminderApp Ver.3.1 — 完全版（2025-11 最新）
// - 朝食/夕食のまとめて選択（上部に完全整列）
// - 朝夕ボタン反応修正（pointer-events）
// - Firestore deadline（ISO文字列）対応
// - 締切後は編集不可
// - 未保存で遷移時に警告（BeforeUnload + Router Prompt）
// - 保存ボタンはタブバーに重ならない位置に固定
// - スマホ最適化

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useBeforeUnload, useNavigate } from "react-router-dom";
import useAppStore from "../store/appStore";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// YYYY-MM-DD
function formatDateKey(d) {
  return d.toISOString().split("T")[0];
}

// 11/28 0:00
function formatDeadline(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

// 11/18（火）
function formatJPDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）`;
}

// 締切判定
function isPastDeadline(dayDate, deadlineIso) {
  if (!deadlineIso) return false;
  const day = new Date(dayDate);
  day.setHours(0, 0, 0, 0);
  const dl = new Date(deadlineIso);
  return day.getTime() >= dl.getTime();
}

export default function MealVote() {
  const uid = useAppStore((s) => s.userProfile?.uid);
  const navigate = useNavigate();

  // -------------------------
  // 週開始（日曜日）
  // -------------------------
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    base.setDate(base.getDate() - base.getDay());
    return base;
  });

  const [weekData, setWeekData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [deadlineIso, setDeadlineIso] = useState("");
  const [loading, setLoading] = useState(true);

  const hasChanges =
    JSON.stringify(weekData) !== JSON.stringify(originalData);

  // -------------------------
  // 未保存でページ離脱時：警告
  // -------------------------
  useBeforeUnload(
    hasChanges ? (e) => (e.returnValue = "未保存の変更があります。") : null
  );

  useEffect(() => {
    const unlisten = navigate((location, action) => {
      if (action === "PUSH" || action === "POP") {
        if (hasChanges) {
          const ok = window.confirm(
            "変更が保存されていません。このまま移動しますか？"
          );
          if (!ok) return false;
        }
      }
      return true;
    });
    return unlisten;
  }, [hasChanges, navigate]);

  // -------------------------
  // Firestore: 締切読み込み
  // -------------------------
  useEffect(() => {
    const loadDeadline = async () => {
      const ref = doc(db, "deadlines", "meal_vote");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDeadlineIso(snap.data().deadline || "");
      }
    };
    loadDeadline();
  }, []);

  // -------------------------
  // Firestore: 週データ読み込み
  // -------------------------
  useEffect(() => {
    if (!uid) return;

    const loadWeek = async () => {
      setLoading(true);

      const tmp = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        tmp.push({
          jsDate: d,
          date: formatDateKey(d),
          morning: false,
          evening: false,
        });
      }

      // Firestore から既存データ
      for (let i = 0; i < tmp.length; i++) {
        const ref = doc(db, "meal_votes", tmp[i].date);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const v = snap.data().votes?.[uid];
          if (v) {
            tmp[i].morning = !!v.morning;
            tmp[i].evening = !!v.evening;
          }
        }
      }

      setWeekData(tmp);
      setOriginalData(tmp.map((x) => ({ ...x, jsDate: new Date(x.jsDate) })));
      setLoading(false);
    };

    loadWeek();
  }, [uid, weekStart]);

  // -------------------------
  // ボタン toggle
  // -------------------------
  const toggle = (i, field, disabled) => {
    if (disabled) return;
    setWeekData((prev) => {
      const next = [...prev];
      next[i][field] = !next[i][field];
      return next;
    });
  };

  // -------------------------
  // まとめて選択（朝/夕）
  // -------------------------
  const applyBulk = (field) => {
    setWeekData((prev) => {
      return prev.map((e) => {
        const disabled = isPastDeadline(e.jsDate, deadlineIso);
        if (disabled) return e;
        return { ...e, [field]: true };
      });
    });
  };

  // -------------------------
  // 保存
  // -------------------------
  const handleSave = async () => {
    if (!uid || !hasChanges) return;

    for (const e of weekData) {
      const ref = doc(db, "meal_votes", e.date);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          created_at: serverTimestamp(),
          votes: {},
        });
      }

      await updateDoc(ref, {
        [`votes.${uid}.morning`]: e.morning,
        [`votes.${uid}.evening`]: e.evening,
      });
    }

    alert("保存しました。");
    setOriginalData(
      weekData.map((x) => ({ ...x, jsDate: new Date(x.jsDate) }))
    );
  };

  // -------------------------
  // 前後の週
  // -------------------------
  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        読み込み中…
      </div>
    );
  }

  const startLabel = formatJPDate(weekData[0].jsDate);
  const endLabel = formatJPDate(weekData[6].jsDate);
  const deadlineLabel = formatDeadline(deadlineIso);

  return (
    <div className="min-h-screen bg-slate-50 relative pb-32">

      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="text-xs font-semibold text-slate-500">水戸塾アプリ</div>
          <h1 className="text-lg font-semibold text-slate-900">食数投票</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 pb-6 space-y-6">

        {/* 週情報 */}
        <section>
          <div className="text-sm font-medium text-slate-800">
            {startLabel} 〜 {endLabel}
          </div>
          {deadlineLabel && (
            <div className="text-sm font-semibold text-red-600">
              投票締切：{deadlineLabel}
            </div>
          )}
        </section>

        {/* 週移動 */}
        <section className="flex items-center justify-between bg-white border rounded-xl px-3 py-2 shadow-sm">
          <button
            onClick={prevWeek}
            className="px-3 py-1 rounded-lg text-sm hover:bg-slate-100"
          >
            ◀ 前の週
          </button>

          <span className="text-xs text-slate-500">週を切り替えできます</span>

          <button
            onClick={nextWeek}
            className="px-3 py-1 rounded-lg text-sm hover:bg-slate-100"
          >
            次の週 ▶
          </button>
        </section>

        {/* まとめて選択 */}
        <section className="bg-white border rounded-xl shadow-sm p-4">
          <div className="flex justify-end gap-8 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">朝食</span>
              <input
                type="checkbox"
                onChange={() => applyBulk("morning")}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">夕食</span>
              <input
                type="checkbox"
                onChange={() => applyBulk("evening")}
                className="w-4 h-4"
              />
            </div>
          </div>
        </section>

        {/* 本体一覧 */}
        <section className="bg-white border rounded-xl shadow-sm divide-y">
          {weekData.map((e, i) => {
            const disabled = isPastDeadline(e.jsDate, deadlineIso);
            const original = originalData[i];
            const changed =
              e.morning !== original.morning ||
              e.evening !== original.evening;

            return (
              <div
                key={e.date}
                className={
                  "px-3 py-3 flex items-center justify-between " +
                  (disabled ? "opacity-60 bg-slate-50" : "bg-white") +
                  (changed ? " border-l-4 border-blue-500" : "")
                }
              >
                <div className="font-medium text-slate-800 w-24">
                  {formatJPDate(e.jsDate)}
                </div>

                <div className="flex gap-3">
                  {/* 朝食 */}
                  <button
                    disabled={disabled}
                    onClick={() => toggle(i, "morning", disabled)}
                    className={
                      "px-4 py-2 rounded-lg border text-sm font-medium transition " +
                      (disabled
                        ? "bg-slate-100 border-slate-200 text-slate-400"
                        : e.morning
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50")
                    }
                  >
                    朝食
                  </button>

                  {/* 夕食 */}
                  <button
                    disabled={disabled}
                    onClick={() => toggle(i, "evening", disabled)}
                    className={
                      "px-4 py-2 rounded-lg border text-sm font-medium transition " +
                      (disabled
                        ? "bg-slate-100 border-slate-200 text-slate-400"
                        : e.evening
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50")
                    }
                  >
                    夕食
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* 保存ボタン（タブバーと絶対非干渉） */}
      <div className="fixed bottom-20 left-0 right-0 z-30">
        <div className="max-w-3xl mx-auto px-4">
          <button
            disabled={!hasChanges}
            onClick={handleSave}
            className={
              "w-full py-3 rounded-xl text-sm font-semibold transition shadow-md " +
              (hasChanges
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-300 text-slate-500")
            }
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
