import { cn } from "@/lib/utils";

const RANK_COLORS = {
  1: "from-amber-400 to-orange-500",
  2: "from-slate-300 to-slate-400",
  3: "from-orange-300 to-orange-400",
};

export function DuelPlayerCard({ name, live, playerKey, accent, align, isActive, rank }) {
  const level = live[`${playerKey}_level`] || 0;
  const time = live[`${playerKey}_time`] || 0;
  const completed = live[`${playerKey}_completed`] || 0;
  const finished = live[`${playerKey}_finished`];
  const times = live[`${playerKey}_times`] || [];
  const gradient = RANK_COLORS[rank] || "from-violet-400 to-purple-500";

  return (
    <div className={cn("flex-1 rounded-2xl p-5 border bg-card transition-all duration-300 hover:scale-[1.01]", align === "left" ? "text-left" : "text-right")}>
      {/* Header: Avatar + Name + Badge */}
      <div className={cn("flex items-start gap-3 mb-3", align === "left" ? "" : "flex-row-reverse")}>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-md shrink-0 bg-gradient-to-br", gradient)}>
          {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">{name || "—"}</h3>
          <StatusBadge level={level} finished={finished} />
        </div>
      </div>

      {/* Live timer */}
      {isActive && level > 0 && (
        <div className="mb-3 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Level {level} · waktu
          </span>
          <span className="text-sm font-black tabular-nums text-blue-600 dark:text-blue-400 ml-auto">
            {time > 0 ? `${time.toFixed(1)}s` : "..."}
          </span>
        </div>
      )}

      {/* LevelBar */}
      <LevelBar completed={completed} total={8} isActive={isActive} accent={accent} />

      {/* Per-level times — when finished */}
      {finished && times.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {times.map((t, i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-center">
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500">L{i + 1}</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{t.toFixed(1)}s</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ level, finished }) {
  if (finished)
    return <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">SELESAI ✓</span>;
  if (level > 0)
    return <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 animate-pulse">▶ LEVEL {level}</span>;
  return <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">MENUNGGU</span>;
}

function LevelBar({ completed, total, isActive, accent }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => {
        const done = i < completed;
        const active = !done && isActive && i === completed;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-all",
              done ? `${accent} text-white` :
              active ? "border border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 animate-pulse" :
              "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
            )}
          >
            {done || active ? i + 1 : ""}
          </div>
        );
      })}
    </div>
  );
}
