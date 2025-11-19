// /webapp/src/components/EnvironmentBadge.jsx
// Environment mode indicator badge
// ReminderApp Ver.2.8.1

import useAppStore from "../store/appStore";

function EnvironmentBadge() {
  const envMode = useAppStore((state) => state.envMode);
  
  const isDev = envMode === "dev";
  
  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-200
        ${isDev 
          ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-400" 
          : "bg-green-100 text-green-800 border-2 border-green-400"
        }
      `}
      role="status"
      aria-label={`現在の環境: ${envMode === "dev" ? "開発環境" : "本番環境"}`}
    >
      <span className={`
        w-2 h-2 rounded-full animate-pulse
        ${isDev ? "bg-yellow-500" : "bg-green-500"}
      `} />
      <span className="uppercase tracking-wide">
        {envMode}
      </span>
      {isDev && (
        <span className="text-yellow-600">
          開発
        </span>
      )}
    </div>
  );
}

export default EnvironmentBadge;