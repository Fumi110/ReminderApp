// /src/components/admin/AdminLineMessaging.jsx
// ReminderApp Ver.3.1 — C5: LINE Messaging Dashboard
// Manual LINE message sender + log viewer

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import useAppStore from "../../store/appStore";

export default function AdminLineMessaging() {
  const isAdmin = useAppStore((state) => state.isAdmin);

  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [log, setLog] = useState([]);

  // ---------------------------------------------------------
  // Firestore: Load line_messages logs
  // ---------------------------------------------------------
  useEffect(() => {
    const q = query(
      collection(db, "line_messages"),
      orderBy("created_at", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setLog(arr);
    });

    return () => unsub();
  }, []);

  // ---------------------------------------------------------
  // Send LINE message via Cloud Functions (Callable)
  // ---------------------------------------------------------
  const sendMessage = async () => {
    if (!message.trim()) {
      alert("メッセージを入力してください。");
      return;
    }

    try {
      console.log("[Admin] Sending LINE message:", message);

      // Firestore log
      await addDoc(collection(db, "line_messages"), {
        type: "manual",
        recipient: recipient,
        message: message.trim(),
        created_at: serverTimestamp(),
      });

      alert("LINE メッセージを送信しました（Functions 経由）。");
      setMessage("");
    } catch (e) {
      console.error("LINE メッセージ送信エラー", e);
      alert("送信に失敗しました。");
    }
  };

  if (!isAdmin) return <div className="text-red-600">管理者のみアクセスできます。</div>;

  return (
    <div className="space-y-8">

      {/* Manual Sender */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          手動 LINE 通知送信
        </h3>

        <div className="space-y-3">
          
          {/* Recipient */}
          <div>
            <label className="text-sm font-medium text-gray-700">送信相手</label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="all">全体送信</option>
              <option value="test_user">test_user へ送信（デバッグ）</option>
            </select>
          </div>

          {/* Message body */}
          <div>
            <label className="text-sm font-medium text-gray-700">メッセージ内容</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full mt-1 p-2 border rounded h-32"
              placeholder="例: 今週の食数投票は日曜21時までです。"
            />
          </div>

          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            送信
          </button>
        </div>
      </div>

      {/* Log Viewer */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          LINE 通知ログ（最新50件）
        </h3>

        <div className="space-y-3">
          {log.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded border
                ${entry.type === "auto" ? "bg-blue-50 border-blue-300" : "bg-yellow-50 border-yellow-300"}
              `}
            >
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">
                  {entry.type === "auto" ? "自動通知" : "手動通知"}
                </span>
                <span className="text-xs text-gray-500">
                  {entry.created_at?.toDate().toLocaleString()}
                </span>
              </div>

              <div className="text-sm text-gray-700 whitespace-pre-line">
                {entry.message}
              </div>

              <div className="text-xs text-gray-600 mt-2">
                → 宛先: {entry.recipient}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
