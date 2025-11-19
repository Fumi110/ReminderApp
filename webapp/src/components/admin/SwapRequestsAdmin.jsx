// /src/components/admin/SwapRequestsAdmin.jsx
// ReminderApp Ver.3.1 - Duty Swap Management (Admin Only)

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import useAppStore from "../../store/appStore";

export default function SwapRequestsAdmin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const userProfile = useAppStore((state) => state.userProfile);
  const isAdmin = useAppStore((state) => state.isAdmin);

  // -------------------------------
  // Admin 限定
  // -------------------------------
  if (!isAdmin) {
    return (
      <div className="p-4 text-red-600">
        管理者のみがアクセスできます。
      </div>
    );
  }

  // -------------------------------
  // Firestore リアルタイム購読
  // -------------------------------
  useEffect(() => {
    const q = query(
      collection(db, "duty_swaps"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(list);
      setLoading(false);

      console.log(`[Admin] pending swap requests: ${list.length}`);
    });

    return () => unsubscribe();
  }, []);

  // -----------------------------------------------------
  // 承認（assignments を swap し、status=approved）
  // -----------------------------------------------------
  const approveSwap = async (req) => {
    const { requester, target, duty_date, duty_type } = req;

    const ok = confirm(
      `交代申請を承認しますか？\n\n日付：${duty_date}\n当番：${duty_type}\n申請者：${requester}\n相手：${target}`
    );
    if (!ok) return;

    try {
      const dutyRef = doc(db, "duties", duty_date);
      const dutySnap = await getDoc(dutyRef);

      if (!dutySnap.exists()) {
        alert("対象日の duty データが存在しません。");
        return;
      }

      const data = dutySnap.data();
      const assignments = data.assignments || {};
      const status = data.status || {};

      // (1) duty_type に割り当てられている担当者を swap する
      // 現在の担当が target → 新担当 requester
      // target 担当のものを requester に付け替え
      const newAssignments = { ...assignments };
      const newStatus = { ...status };

      // 元担当が target の duty_type を requester に変更
      for (const uid of Object.keys(newAssignments)) {
        if (newAssignments[uid] === duty_type) {
          newAssignments[uid] = null; // 一旦解除
        }
      }

      newAssignments[requester] = duty_type;

      // status リセット
      newStatus[requester] = "pending";

      // (2) Firestore 更新
      await updateDoc(dutyRef, {
        assignments: newAssignments,
        status: newStatus,
        updated_at: serverTimestamp(),
      });

      // (3) duty_swaps の status を更新
      const swapRef = doc(db, "duty_swaps", req.id);
      await updateDoc(swapRef, {
        status: "approved",
        processed_by: userProfile.uid,
        processed_at: serverTimestamp(),
      });

      alert("交代申請を承認しました。");
    } catch (err) {
      console.error("Swap approve error:", err);
      alert("承認に失敗しました。");
    }
  };

  // -----------------------------------------------------
  // 拒否（status=rejected）
  // -----------------------------------------------------
  const rejectSwap = async (req) => {
    const ok = confirm("この交代申請を拒否しますか？");
    if (!ok) return;

    try {
      const swapRef = doc(db, "duty_swaps", req.id);
      await updateDoc(swapRef, {
        status: "rejected",
        processed_by: userProfile.uid,
        processed_at: serverTimestamp(),
      });

      alert("拒否しました。");
    } catch (err) {
      console.error("Swap reject error:", err);
      alert("拒否に失敗しました。");
    }
  };

  // -------------------------------
  // UI レンダリング
  // -------------------------------
  if (loading) {
    return <div className="p-4 text-gray-600">読み込み中...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">当番交代申請管理</h2>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {requests.length === 0 && (
          <p className="p-4 text-gray-600 text-sm">
            現在、保留中の申請はありません。
          </p>
        )}

        {requests.length > 0 && (
          <div className="divide-y">
            {requests.map((req) => (
              <div key={req.id} className="p-4 flex flex-col gap-3">
                <div className="text-gray-900 font-semibold">
                  {req.duty_date}（{req.duty_type}）
                </div>

                <div className="text-sm text-gray-700">
                  <strong>申請者：</strong> {req.requester}
                  <br />
                  <strong>元担当：</strong> {req.target}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => approveSwap(req)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    承認
                  </button>

                  <button
                    onClick={() => rejectSwap(req)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    拒否
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
