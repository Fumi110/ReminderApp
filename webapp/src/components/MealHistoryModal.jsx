// /src/components/MealHistoryModal.jsx
// ReminderApp Ver.3.1 — 一般ユーザー向け 食数履歴モーダル
// ・朝食 / 夕食 を左右 2 カラム表示
// ・自分の投票状況も下部に表示

export default function MealHistoryModal({ info, onClose }) {
  if (!info) return null;

  const {
    label,
    morningNames = [],
    eveningNames = [],
    selfMorningLabel,
    selfEveningLabel,
  } = info;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg space-y-4">
        <h2 className="text-lg font-bold mb-2">{label} の投票状況</h2>

        {/* 朝食 / 夕食 2カラム */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 朝食 */}
          <section>
            <h3 className="font-semibold text-sm mb-1">朝食</h3>
            {morningNames.length === 0 ? (
              <p className="text-sm text-gray-500">投票者なし</p>
            ) : (
              <ul className="list-disc ml-5 text-sm max-h-48 overflow-auto">
                {morningNames.map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            )}
          </section>

          {/* 夕食 */}
          <section>
            <h3 className="font-semibold text-sm mb-1">夕食</h3>
            {eveningNames.length === 0 ? (
              <p className="text-sm text-gray-500">投票者なし</p>
            ) : (
              <ul className="list-disc ml-5 text-sm max-h-48 overflow-auto">
                {eveningNames.map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 自分の投票状況 */}
        <div className="border-t pt-3 text-sm">
          <div className="font-semibold mb-1">あなたの投票</div>
          <div className="flex flex-col sm:flex-row gap-2 text-sm">
            <div>
              朝食: <span className="font-semibold">{selfMorningLabel}</span>
            </div>
            <div>
              夕食: <span className="font-semibold">{selfEveningLabel}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
