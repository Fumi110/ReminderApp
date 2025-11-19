// /src/components/Home.jsx
// ReminderApp Ver.3.1 — ダッシュボード（React #31 対策済）
// - meal_votes の生オブジェクトを JSX に直接流さない
// - 当番 / 今日の食数投票 / 交代申請の概要を表示
// - 管理者には「管理メニュー」カードを表示

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAppStore from "../store/appStore";

import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import {
  getCurrentJSTDate,
  formatYearMonth,
  getISOWeekNumber,
  getJapaneseDayOfWeek,
  getStartOfAcademicYear,
} from "../utils/datejs";

// 今日のキー (YYYY-MM-DD)
const getTodayKey = () => new Date().toISOString().split("T")[0];

/* ------------------------------------------------------------
 * MealVote を文字列に変換 （JSX にオブジェクトを渡さないため）
 * vote = {morning: true/false, evening: true/false} | null
 ------------------------------------------------------------ */
function normalizeMealVote(vote) {
  if (!vote || typeof vote !== "object") return "未回答";

  const m = vote.morning === true;
  const e = vote.evening === true;

  if (!m && !e) return "食べない";
  if (m && e) return "朝夕とも食べる";
  if (m) return "朝のみ食べる";
  if (e) return "夕のみ食べる";

  return "未回答";
}

function Home() {
  const userProfile = useAppStore((state) => state.userProfile);
  const isAdmin = useAppStore((state) => state.isAdmin);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const [currentDate, setCurrentDate] = useState(getCurrentJSTDate());

  const [todayDuty, setTodayDuty] = useState(null);
  const [todayVoteRaw, setTodayVoteRaw] = useState(null); // ← 生データ
  const [swapRequests, setSwapRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const uid = userProfile?.uid;
  const todayKey = getTodayKey();

  // デバッグ用ログ（admin 判定）
  console.log(
    "[Home] userProfile.role=",
    userProfile?.role,
    " isAdmin=",
    isAdmin
  );

  /* ------------------------------------------------------------
   * Healthcheck
   ------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        console.log("[Firestore] healthcheck start");
        const envMode = useAppStore.getState().envMode || "dev";
        console.log("[Firestore] envMode:", envMode);

        const col = collection(db, `development_healthcheck`);
        console.log("[Firestore] collection path:", col.path);

        const docRef = await addDoc(col, {
          created_at: serverTimestamp(),
          note: "home-mounted",
        });
        console.log("[Firestore] healthcheck ok:", docRef.id);
      } catch (e) {
        console.error("[Firestore] healthcheck error:", e);
      }
    })();
  }, []);

  /* ------------------------------------------------------------
   * 日付更新
   ------------------------------------------------------------ */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(getCurrentJSTDate());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const weekNumber = getISOWeekNumber(currentDate);
  const dayOfWeek = getJapaneseDayOfWeek(currentDate);
  const yearMonth = formatYearMonth(currentDate);
  const academicYearStart = getStartOfAcademicYear(currentDate);

  /* ------------------------------------------------------------
   * 今日の duty / meal vote / swap request
   ------------------------------------------------------------ */
  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      try {
        // duty
        const refDuty = doc(db, "duties", todayKey);
        const snapDuty = await getDoc(refDuty);
        if (snapDuty.exists()) {
          const data = snapDuty.data();
          setTodayDuty(data.assignments?.[uid] ?? null);
        }

        // meal vote
        const refVote = doc(db, "meal_votes", todayKey);
        const snapVote = await getDoc(refVote);
        if (snapVote.exists()) {
          const raw = snapVote.data().votes?.[uid] ?? null;
          setTodayVoteRaw(raw);
        }

        // swap requests
        const swapRef = collection(db, "swap_requests");
        const q = query(swapRef, where("requester", "==", uid));
        const qSnap = await getDocs(q);

        const list = [];
        qSnap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        setSwapRequests(list);
      } catch (err) {
        console.error("[Home] Fetch error:", err);
      }

      setLoading(false);
    };

    fetchData();
  }, [uid, todayKey]);

  /* ------------------------------------------------------------
   * 非ログイン時
   ------------------------------------------------------------ */
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ReminderApp へようこそ
          </h2>
          <p className="text-gray-600 mb-6">
            学寮の当番管理・食数投票・出欠管理システム
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md">
            LINE でログイン
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------
   * ローディング
   ------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">読み込み中です...</div>
    );
  }

  /* ------------------------------------------------------------
   * todayVote の文字列化（React #31 対策）
   ------------------------------------------------------------ */
  const todayVote = normalizeMealVote(todayVoteRaw);

  /* ------------------------------------------------------------
   * 通知生成
   ------------------------------------------------------------ */
  const notifications = [];

  if (todayDuty) {
    notifications.push({
      id: "duty",
      title: "今日の当番",
      message: `${todayDuty} が割り当てられています`,
      priority: "high",
      time: "今日",
    });
  }

  if (todayVote === "未回答") {
    notifications.push({
      id: "vote-missing",
      title: "食数投票（未回答）",
      message: "まだ今日の夕食アンケートに回答していません",
      priority: "high",
      time: "今日",
    });
  }

  if (swapRequests.length > 0) {
    for (const req of swapRequests) {
      notifications.push({
        id: `swap-${req.id}`,
        title: "当番交代申請",
        message: `${req.date} の交代申請は「${req.status}」です`,
        priority: req.status === "approved" ? "medium" : "high",
        time: req.date,
      });
    }
  }

  /* ------------------------------------------------------------
   * UI
   ------------------------------------------------------------ */
  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          おかえりなさい、{userProfile?.name || "未設定さん"}
        </h2>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span>
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
              {currentDate.getDate()}日（{dayOfWeek}）
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span>
              {yearMonth} / 第{weekNumber}週
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <span>年度: {academicYearStart.getFullYear()}年度</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🔔</span>
          <span>お知らせ</span>
        </h3>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-gray-600 text-sm">現在お知らせはありません。</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-lg border-l-4 ${
                  n.priority === "high"
                    ? "bg-red-50 border-red-500"
                    : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {n.title}
                  </h4>
                  <span className="text-xs text-gray-500">{n.time}</span>
                </div>
                <p className="text-sm text-gray-700">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">今日の当番</div>
          <div className="text-2xl font-bold text-gray-900">
            {todayDuty || "なし"}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">夕食アンケート</div>
          <div className="text-2xl font-bold text-gray-900">{todayVote}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">役割</div>
          <div className="text-2xl font-bold text-gray-900">
            {isAdmin ? "管理者" : "一般"}
          </div>
        </div>
      </div>

      {/* Admin Quick Access */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-xl p-5 shadow-md flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold opacity-80">
              管理者メニュー
            </div>
            <div className="text-lg font-bold mt-1">
              当番表・締切・アカウント管理
            </div>
            <p className="text-xs mt-2 opacity-80">
              水戸塾全体の運営設定を行う画面です。
            </p>
          </div>
          <Link
            to="/admin"
            className="ml-4 px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold shadow hover:bg-slate-100 active:scale-95 transition"
          >
            管理画面へ
          </Link>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>今週のヒント</span>
        </h3>

        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0">•</span>
            <span>来週の食数投票期限は今週日曜日21:00までです</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0">•</span>
            <span>当番完了後は忘れずに報告してください</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0">•</span>
            <span>交代が必要な場合は早めに申請しましょう</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
