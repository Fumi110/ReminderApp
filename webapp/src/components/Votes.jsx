// /src/components/Votes.jsx
// ReminderApp Ver.3.1 — React Error #31 永久対策版（完全サニタイズ）

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import useAppStore from "../store/appStore";
import VoteTab from "./VoteTab";
import HistoryTab from "./HistoryTab";
import MealHistoryModal from "./MealHistoryModal";

import { getUserDisplayName } from "../utils/userName";
import { parseDate, getJapaneseDayOfWeek } from "../utils/datejs";

/* ---------------- 追加：votes サニタイザ -------------------- */
function sanitizeVote(v) {
  if (!v || typeof v !== "object") {
    return { morning: false, evening: false };
  }
  return {
    morning: v.morning === true,
    evening: v.evening === true,
  };
}

/* ---------------- 追加：ID 配列サニタイザ -------------------- */
function sanitizeIdList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === "string");
}

export default function Votes() {
  const userProfile = useAppStore((s) => s.userProfile);
  const uid = userProfile?.uid;
  const isAdmin = userProfile?.role === "admin";

  const [activeTab, setActiveTab] = useState("vote");

  const [userList, setUserList] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUserList(arr);
    };
    loadUsers();
  }, []);

  const findUserById = (id) => userList.find((u) => u.id === id) || null;

  const [hasUnsavedVote, setHasUnsavedVote] = useState(false);

  /* -------------------- モーダル ---------------------- */
  const [modalInfo, setModalInfo] = useState(null);

  const buildSelfLabel = (voteObj) => {
    const resolve = (v) => (v === true ? "食べる" : "食べない");
    const safe = sanitizeVote(voteObj);

    return {
      morning: resolve(safe.morning),
      evening: resolve(safe.evening),
    };
  };

  const formatDateLabel = (date) => {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const w = getJapaneseDayOfWeek(date);
    return `${m}/${d}(${w})`;
  };

  /* -------------------- モーダルデータ読み込み ---------------------- */
  const openModalForDate = async (dateKey) => {
    const ref = doc(db, "meal_votes", dateKey);
    const snap = await getDoc(ref);

    let morningIds = [];
    let eveningIds = [];
    let selfVote = null;

    if (snap.exists()) {
      const rawVotes = snap.data()?.votes || {};

      Object.entries(rawVotes).forEach(([id, v]) => {
        const safe = sanitizeVote(v);

        if (safe.morning) morningIds.push(id);
        if (safe.evening) eveningIds.push(id);

        if (id === uid) {
          selfVote = safe;
        }
      });
    }

    morningIds = sanitizeIdList(morningIds);
    eveningIds = sanitizeIdList(eveningIds);

    const morningNames = morningIds.map((id) =>
      getUserDisplayName(findUserById(id))
    );

    const eveningNames = eveningIds.map((id) =>
      getUserDisplayName(findUserById(id))
    );

    const selfLabels = buildSelfLabel(selfVote);

    const dateObj = parseDate(dateKey);
    const label = formatDateLabel(dateObj);

    setModalInfo({
      dateKey,
      label,
      morningNames,
      eveningNames,
      selfMorningLabel: selfLabels.morning,
      selfEveningLabel: selfLabels.evening,
      isAdmin,
    });
  };

  const closeModal = () => setModalInfo(null);

  /* ---------------- tab 切り替え ---------------- */
  const changeTab = (next) => {
    if (activeTab === "vote" && next === "history" && hasUnsavedVote) {
      const ok = window.confirm(
        "この週の変更が保存されていません。\n保存せずに履歴に移動すると入力内容が失われます。\n移動しますか？"
      );
      if (!ok) return;
    }
    setActiveTab(next);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-2">食数投票</h1>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 text-sm ${
            activeTab === "vote"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => changeTab("vote")}
        >
          投票
        </button>

        <button
          className={`px-4 py-2 text-sm ${
            activeTab === "history"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => changeTab("history")}
        >
          履歴
        </button>
      </div>

      {activeTab === "vote" ? (
        <VoteTab uid={uid} onUnsavedChange={setHasUnsavedVote} />
      ) : (
        <HistoryTab onDateClick={openModalForDate} />
      )}

      {modalInfo && <MealHistoryModal info={modalInfo} onClose={closeModal} />}
    </div>
  );
}
