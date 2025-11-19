// /src/components/AdminPanel.jsx
// ReminderApp Ver.3.2 — 管理者ホーム（4カテゴリ構造 + Link設置 完全版）

import { Link } from "react-router-dom";
import useAppStore from "../store/appStore";

export default function AdminPanel() {
  const isAdmin = useAppStore((s) => s.isAdmin);

  if (!isAdmin) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        管理者のみアクセスできます。
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          管理者パネル
        </h1>

        <Link
          to="/"
          className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800"
        >
          一般画面へ戻る
        </Link>
      </div>

      {/* Grid 全体 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ========================== */}
        {/* 1. 施設系（当番生成・編集） */}
        {/* ========================== */}
        <section className="bg-white rounded-xl shadow p-5 border border-slate-200">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
            ① 施設管理（当番関連）
          </h2>

          <ul className="space-y-3">
            <li>
              <Link
                to="/admin/duty-manager"
                className="block p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="font-medium text-slate-800">
                  当番生成／除外日設定（1-1）
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  当番表の自動生成・除外日の設定を行います。
                </div>
              </Link>
            </li>

            <li>
              <Link
                to="/admin/duty-editor"
                className="block p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="font-medium text-slate-800">
                  当番編集（1-2）
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  生成済み当番の手動修正・ステータス編集を行います。
                </div>
              </Link>
            </li>
          </ul>
        </section>

        {/* ========================== */}
        {/* 2. 炊事管理（食数） */}
        {/* ========================== */}
        <section className="bg-white rounded-xl shadow p-5 border border-slate-200">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
            ② 炊事管理
          </h2>

          <ul className="space-y-3">
            <li>
              <Link
                to="/admin/kitchen/excluded"
                className="block p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="font-medium text-slate-800">
                  食数除外日設定
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  食数投票を行わない日を設定します。
                </div>
              </Link>
            </li>

            <li>
              <Link
                to="/admin/kitchen/meal-manager"
                className="block p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="font-medium text-slate-800">
                  食数管理（投票集計）
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  朝食・夕食の投票を集計し管理します。
                </div>
              </Link>
            </li>
          </ul>
        </section>

        {/* ========================== */}
        {/* 3. 締切管理 */}
        {/* ========================== */}
        <section className="bg-white rounded-xl shadow p-5 border border-slate-200">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
            ③ 締切管理
          </h2>

          <Link
            to="/admin/deadlines"
            className="block p-3 border rounded-lg hover:bg-slate-50"
          >
            <div className="font-medium text-slate-800">
              締切の設定
            </div>
            <div className="text-xs text-slate-500 mt-1">
              当番・食数投票など全機能の締切を一括管理します。
            </div>
          </Link>
        </section>

        {/* ========================== */}
        {/* 4. ユーザー管理 */}
        {/* ========================== */}
        <section className="bg-white rounded-xl shadow p-5 border border-slate-200">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
            ④ ユーザー管理
          </h2>

          <Link
            to="/admin/users"
            className="block p-3 border rounded-lg hover:bg-slate-50"
          >
            <div className="font-medium text-slate-800">
              ユーザー管理
            </div>
            <div className="text-xs text-slate-500 mt-1">
              アカウント情報・学年などを管理します。
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
