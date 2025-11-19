// /webapp/src/components/DutyEditModal.jsx
// 当番編集モーダル（担当者・状態編集）
// ReminderApp Ver.3.1

import React, { useState, useEffect } from "react";

/**
 * props:
 * - open: boolean
 * - date: string ("YYYY-MM-DD")
 * - duties: Duty[] （この日の当番リスト）
 *    { id, date, type, assigned_to, status }
 * - users: { id, display_name }[]
 * - onClose: () => void
 * - onSave: (updatedDuties: Duty[]) => Promise<void> | void
 */
function DutyEditModal({ open, date, duties, users, onClose, onSave }) {
  const [localDuties, setLocalDuties] = useState([]);

  useEffect(() => {
    if (open) {
      setLocalDuties(duties || []);
    }
  }, [open, duties]);

  if (!open) return null;

  const userOptions = users || [];

  const handleChangeAssigned = (index, value) => {
    setLocalDuties((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], assigned_to: value || null };
      return next;
    });
  };

  const handleChangeStatus = (index, value) => {
    setLocalDuties((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    try {
      await onSave(localDuties);
      onClose();
    } catch (e) {
      console.error("[DutyEditModal] save error:", e);
      alert("保存に失敗しました。");
    }
  };

  const dutyTypeLabel = (type) => {
    const map = {
      garbage: "ゴミ当番",
      garbage1: "ゴミ当番1",
      garbage2: "ゴミ当番2",
      bath: "風呂当番",
      default: "当番",
    };
    return map[type] || map.default;
  };

  const formatDateJP = (str) => {
    try {
      const d = new Date(str);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
      return str;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDateJP(date)} の当番編集
          </h2>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4 py-4">
          {localDuties.length === 0 && (
            <p className="text-sm text-gray-500">この日の当番は登録されていません。</p>
          )}

          {localDuties.map((duty, index) => (
            <div
              key={duty.id || `${duty.type}_${index}`}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  {dutyTypeLabel(duty.type)}
                </span>
                <span className="text-xs text-gray-500">
                  状態:{" "}
                  {duty.status === "done" ? "完了" : duty.status === "pending" ? "未完了" : "未設定"}
                </span>
              </div>

              {/* 担当者選択 */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  担当者
                </label>
                <select
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={duty.assigned_to || ""}
                  onChange={(e) => handleChangeAssigned(index, e.target.value)}
                >
                  <option value="">（未割当）</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name || u.name || u.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* 状態切替 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  状態
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-md px-3 py-2 text-xs font-medium ${
                      duty.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                    onClick={() => handleChangeStatus(index, "pending")}
                  >
                    未完了
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-md px-3 py-2 text-xs font-medium ${
                      duty.status === "done"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                    onClick={() => handleChangeStatus(index, "done")}
                  >
                    完了
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

export default DutyEditModal;
