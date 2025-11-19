// /src/components/admin/AdminUserManagement.jsx
// ReminderApp Ver.3.1 — C6: User Management UI
// Manage users: name, grade, role, etc.

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import useAppStore from "../../store/appStore";

export default function AdminUserManagement() {
  const isAdmin = useAppStore((state) => state.isAdmin);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 新規登録用
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("B1");
  const [newUid, setNewUid] = useState("");

  // ---------------------------------------------------------
  // Load all users
  // ---------------------------------------------------------
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const arr = [];
      snap.forEach((d) => arr.push({ uid: d.id, ...d.data() }));
      setUsers(arr);
      setLoading(false);
    };
    loadUsers();
  }, []);

  // ---------------------------------------------------------
  // Update user
  // ---------------------------------------------------------
  const updateUser = async (uid, updated) => {
    await updateDoc(doc(db, "users", uid), {
      ...updated,
      updated_at: serverTimestamp(),
    });
    alert("更新しました。");
  };

  // ---------------------------------------------------------
  // Create new user
  // ---------------------------------------------------------
  const createUser = async () => {
    if (!newUid || !newName) {
      alert("UIDと名前は必須です。");
      return;
    }

    await setDoc(doc(db, "users", newUid), {
      name: newName,
      grade: newGrade,
      role: "user",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    alert("ユーザーを追加しました。");
    setNewUid("");
    setNewName("");
  };

  if (!isAdmin)
    return (
      <div className="text-red-600 p-4">管理者のみアクセスできます。</div>
    );

  if (loading)
    return <div className="p-4 text-gray-600">読み込み中...</div>;

  return (
    <div className="space-y-8">

      {/* User List */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ユーザー一覧
        </h3>

        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 border">UID</th>
              <th className="px-4 py-2 border">名前</th>
              <th className="px-4 py-2 border">学年</th>
              <th className="px-4 py-2 border">権限</th>
              <th className="px-4 py-2 border w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="text-center">
                <td className="border px-2 py-2 text-xs">{u.uid}</td>

                {/* name */}
                <td className="border px-2 py-2">
                  <input
                    className="border rounded p-1 w-full"
                    defaultValue={u.name}
                    onChange={(e) =>
                      (u._name = e.target.value)
                    }
                  />
                </td>

                {/* grade */}
                <td className="border px-2 py-2">
                  <select
                    defaultValue={u.grade}
                    className="border rounded p-1"
                    onChange={(e) =>
                      (u._grade = e.target.value)
                    }
                  >
                    {["B1","B2","B3","B4","M1","M2","D1","D2","D3"].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </td>

                {/* role */}
                <td className="border px-2 py-2">
                  <select
                    defaultValue={u.role}
                    className="border rounded p-1"
                    onChange={(e) =>
                      (u._role = e.target.value)
                    }
                  >
                    <option value="user">一般</option>
                    <option value="admin">管理者</option>
                  </select>
                </td>

                {/* Save */}
                <td className="border px-2 py-2">
                  <button
                    onClick={() =>
                      updateUser(u.uid, {
                        name: u._name ?? u.name,
                        grade: u._grade ?? u.grade,
                        role: u._role ?? u.role,
                      })
                    }
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    保存
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New User */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          新規ユーザー追加
        </h3>

        <div className="space-y-3 max-w-md">

          <div>
            <label className="text-sm text-gray-700">UID</label>
            <input
              value={newUid}
              onChange={(e) => setNewUid(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="LINE UID / Firebase UID"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">名前</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">学年</label>
            <select
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {["B1","B2","B3","B4","M1","M2","D1","D2","D3"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <button
            onClick={createUser}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            作成
          </button>

        </div>
      </div>
    </div>
  );
}
