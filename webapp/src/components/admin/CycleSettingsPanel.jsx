// /src/components/admin/CycleSettingsPanel.jsx
// ReminderApp Ver.3.1 — サイクル設定（風呂 / ゴミ）＋ 曜日除外と連携

import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { detectEnv } from "../../utils/detectEnv";

export default function CycleSettingsPanel() {
  const env = detectEnv();
  const configCol = env === "dev" ? "development_config" : "config";

  const [cycleBath, setCycleBath] = useState(0);
  const [cycleGarbage, setCycleGarbage] = useState(0);
  const [excludedWeekdays, setExcludedWeekdays] = useState([]);

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  const loadConfig = async () => {
    const ref = doc(db, configCol, "duty_cycle_settings");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const d = snap.data();
      setCycleBath(d.cycle_bath ?? 0);
      setCycleGarbage(d.cycle_garbage ?? 0);
      setExcludedWeekdays(d.excluded_weekdays || []);
    }
  };

  const saveConfig = async () => {
    const ref = doc(db, configCol, "duty_cycle_settings");

    await updateDoc(ref, {
      cycle_bath: Number(cycleBath),
      cycle_garbage: Number(cycleGarbage),
      excluded_weekdays: excludedWeekdays,
      updated_at: new Date(),
    });

    alert("サイクル設定を保存しました");
  };

  const toggleWeekday = (w) => {
    if (excludedWeekdays.includes(w)) {
      setExcludedWeekdays(excludedWeekdays.filter((x) => x !== w));
    } else {
      setExcludedWeekdays([...excludedWeekdays, w]);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">🔄 サイクル設定</h2>

      {/* 風呂サイクル */}
      <div>
        <label className="block mb-1">風呂当番の次の開始位置（cycle_bath）</label>
        <input
          type="number"
          value={cycleBath}
          onChange={(e) => setCycleBath(e.target.value)}
          className="border p-2 rounded w-32"
        />
      </div>

      {/* ゴミサイクル */}
      <div>
        <label className="block mb-1">ゴミ当番の次の開始位置（cycle_garbage）</label>
        <input
          type="number"
          value={cycleGarbage}
          onChange={(e) => setCycleGarbage(e.target.value)}
          className="border p-2 rounded w-32"
        />
      </div>

      {/* 曜日固定除外（ExcludedDatesPanel と共通） */}
      <div>
        <h3 className="font-medium mb-2">毎週固定で除外する曜日</h3>
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((w, i) => (
            <button
              key={i}
              onClick={() => toggleWeekday(i)}
              className={`px-2 py-1 rounded-md border ${
                excludedWeekdays.includes(i)
                  ? "bg-gray-700 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={saveConfig}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        保存
      </button>
    </div>
  );
}
