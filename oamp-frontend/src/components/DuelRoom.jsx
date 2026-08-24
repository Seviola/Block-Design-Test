import { DuelPlayerCard } from "./DuelPlayerCard";

export function DuelRoom({ room, live, rank1, rank2 }) {
  const p1Active = room.status === "playing" && (live?.p1_level > 0);
  const p2Active = room.status === "playing" && (live?.p2_level > 0);

  return (
    <div className="mb-8">
      {/* Room header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl text-[11px] font-black font-mono bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 tracking-wider">
            ROOM: {room.id}
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {room.player1_name && room.player2_name ? "2 pemain" : "1 pemain"}
          </span>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      {/* Player cards */}
      <div className="flex gap-4 relative items-stretch">
        <DuelPlayerCard
          name={room.player1_name}
          live={live}
          playerKey="p1"
          accent="bg-blue-600"
          align="left"
          isActive={p1Active}
          rank={rank1}
        />

        {/* VS badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg border border-white dark:border-slate-900">
          VS
        </div>

        <DuelPlayerCard
          name={room.player2_name}
          live={live}
          playerKey="p2"
          accent="bg-cyan-600"
          align="right"
          isActive={p2Active}
          rank={rank2}
        />
      </div>

      {/* Gap indicator */}
      {room.status === "playing" && live?.p1_completed > 0 && live?.p2_completed > 0 && (
        <div className="flex justify-center mt-3">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {Math.abs((live.p1_completed || 0) - (live.p2_completed || 0)) > 0
              ? `Selisih ${Math.abs((live.p1_completed || 0) - (live.p2_completed || 0))} level`
              : "Berimbang!"}
          </span>
        </div>
      )}
    </div>
  );
}

function RoomStatusBadge({ status }) {
  const config = {
    waiting: { label: "Menunggu", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
    ready: { label: "Siap", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
    playing: { label: "Berlangsung", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 animate-pulse" },
    finished: { label: "Selesai", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  };
  const c = config[status] || config.waiting;
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.cls}`}>{c.label}</span>;
}
