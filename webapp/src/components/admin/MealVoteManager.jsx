// /src/components/admin/MealVoteManager.jsx
// ReminderApp Ver.3.1 — 食数管理（管理者）
// ・タブ：除外設定 / 投票履歴
// ・除外設定タブ：未保存でタブ移動しようとすると警告

import { useState } from "react";
import MealExclusionManager from "./MealExclusionManager";
import MealHistoryManager from "./MealHistoryManager";

export default function MealVoteManager() {
  const [activeTab, setActiveTab] = useState("exclude"); // "exclude" | "history"
  const [unsaved, setUnsaved] = useState(false); // 除外設定タブの未保存

  const trySwitchTab = (tab) => {
    if (unsaved && activeTab === "exclude") {
      const ok = window.confirm(
        "除外設定の変更が保存されていません。\n保存せずにタブを移動すると内容が失われます。\n移動しますか？"
      );
      if (!ok) return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">食数管理（管理者）</h1>

      <div className="flex border-b mb-4">
        <button
          onClick={() => trySwitchTab("exclude")}
          className={`px-4 py-2 text-sm ${
            activeTab === "exclude"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
        >
          除外設定
        </button>

        <button
          onClick={() => trySwitchTab("history")}
          className={`px-4 py-2 text-sm ${
            activeTab === "history"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
        >
          投票履歴
        </button>
      </div>

      <div>
        {activeTab === "exclude" ? (
          <MealExclusionManager onUnsavedChange={setUnsaved} />
        ) : (
          <MealHistoryManager onUnsavedChange={() => setUnsaved(false)} />
        )}
      </div>
    </div>
  );
}
