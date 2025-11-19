// /src/components/admin/UserManager.jsx
// ReminderApp Ver.3.1 — User Manager（仮実装）

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { getUserDisplayName } from "../../utils/userName";

export default function UserManager() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadUsers();
  }, []);

  const toggleRole = async (u) => {
    const ref = doc(db, "users", u.id);
    const newRole = u.role === "admin" ? "user" : "admin";
    await updateDoc(ref, { role: newRole });

    setUsers((prev) =>
      prev.map((x) =>
        x.id === u.id ? { ...x, role: newRole } : x
      )
    );
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">ユーザー管理</h1>

      <div className="bg-white p-4 rounded shadow">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 border">名前</th>
              <th className="px-3 py-2 border">UID</th>
              <th className="px-3 py-2 border">権限</th>
              <th className="px-3 py-2 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="border px-2 py-1">{getUserDisplayName(u)}</td>
                <td className="border px-2 py-1 font-mono">{u.id}</td>
                <td className="border px-2 py-1 text-center">
                  {u.role === "admin" ? "管理者" : "一般"}
                </td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => toggleRole(u)}
                    className="px-3 py-1 border rounded hover:bg-gray-100 text-xs"
                  >
                    {u.role === "admin" ? "一般に戻す" : "管理者にする"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
