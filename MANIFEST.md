# ReminderApp Ver.3.1 - Phase A 完了記録

---

## 🧭 プロジェクト概要
ReminderApp は学寮における「当番管理」「食数投票」「イベント出欠」「備品報告」などを統合的に管理するアプリケーションです。  
Ver.3.1 では Firestore をバックエンドに採用し、クラウド同期・管理者機能・リマインド機能の拡張に対応しました。

---

## ✅ Phase A（Firestore統合フェーズ）完了内容

| モジュール | Firestore同期 | リアルタイム更新 | 書き込み/更新 | ステータス |
|-------------|----------------|------------------|----------------|-------------|
| Home | ✅ healthcheck 実装 | — | ✅ addDoc | 完了 |
| DutyCalendar | ✅ 当番データ同期 | ✅ onSnapshot | ✅ updateDoc | 完了 |
| MealVote | ✅ 投票データ同期 | ✅ onSnapshot | ✅ addDoc | 完了 |
| Firestore構成 | ✅ prefix対応済 | ✅ emulator確認 | — | 完了 |

---

## ⚙️ 環境構成情報

| 項目 | 内容 |
|------|------|
| フレームワーク | React 18 + Vite + Tailwind CSS |
| 状態管理 | Zustand |
| Firebase SDK | v11.0.0 |
| Firestore 接続 | prefixCollection構造 (`development_*` / `production_*`) |
| Hosting | Firebase Hosting（`dist` 配下） |
| Emulator | Firestore(8085), Functions(5001), UI(4005), Hub(4405) |
| バンドルツール | Vite v7.2.2 |
| 開発環境ファイル | `.env.local` にVITE_FIREBASE_* 変数設定済み |

---

## 🧩 Firestore スキーマ概要

