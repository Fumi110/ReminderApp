// /src/components/admin/AdminHome.jsx
// ReminderApp Ver.3.1 — 管理者ホーム（4カテゴリのハブ）

import { Link } from "react-router-dom";
import useAppStore from "../../store/appStore";

export default function AdminHome() {
  const userProfile = useAppStore((s) => s.userProfile);

  return (
    <div className="space-y-6">
      {/* 概要カード */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Admin Console
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          管理者ホーム
        </h1>
        <p className="text-sm text-slate-600">
          {userProfile?.name || "管理者"} さん、寮の運営設定をここから行えます。
        </p>
      </section>

      {/* カテゴリカード */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 施設 */}
        <Link
          to="/admin/facility"
          className="group bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              <h2 className="text-base font-semibold text-slate-900">
                施設（当番）
              </h2>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-blue-500">
              詳細 &rarr;
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            当番表の生成・除外日設定、交代申請管理、完了報告の修正など。
          </p>
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              当番表生成
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              除外日
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              交代申請
            </span>
          </div>
        </Link>

        {/* 炊事管理 */}
        <Link
          to="/admin/meal"
          className="group bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍽</span>
              <h2 className="text-base font-semibold text-slate-900">
                炊事管理
              </h2>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-blue-500">
              詳細 &rarr;
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            食数の除外日設定・集計・履歴確認など、炊事当番向けの情報を管理。
          </p>
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              食数除外日
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              日別・週別食数
            </span>
          </div>
        </Link>

        {/* 締切管理 */}
        <Link
          to="/admin/deadlines"
          className="group bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              <h2 className="text-base font-semibold text-slate-900">
                締切管理
              </h2>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-blue-500">
              詳細 &rarr;
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            食数投票・当番報告・交代申請などの締切日時を一元管理。
          </p>
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              週次締切
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              説明文
            </span>
          </div>
        </Link>

        {/* ユーザー管理 */}
        <Link
          to="/admin/users"
          className="group bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <h2 className="text-base font-semibold text-slate-900">
                ユーザー管理
              </h2>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-blue-500">
              詳細 &rarr;
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            役割・学年・班・権限・退寮処理など、住人情報を管理。
          </p>
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              ロール
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              在寮ステータス
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
