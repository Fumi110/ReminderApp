// /src/components/admin/FacilityHome.jsx
// ReminderApp Ver.3.1 — 施設（当番）トップページ（仮）

export default function FacilityHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <span>🏢</span>
        <span>施設（当番）管理</span>
      </h1>

      <p className="text-sm text-slate-600">
        当番表の生成・除外日設定・交代申請管理・完了報告の修正をここに集約します。
        既存コードを参照しながら順次ブラッシュアップしていきましょう。
      </p>

      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-xs text-slate-500">
        現時点では UI 骨格のみ実装されています。  
        次のステップで、旧{" "}
        <code className="px-1 py-0.5 bg-white border border-slate-200 rounded">
          DutyPanel / DutyManager / DutyWeekView / SwapRequestsAdmin
        </code>
        などを参照しつつ、  
        「1-1 当番生成」「1-2 当番編集」「1-3 交代申請管理」を具体実装していきます。
      </div>
    </div>
  );
}
