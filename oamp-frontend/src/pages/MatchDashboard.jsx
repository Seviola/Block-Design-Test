import { useParams } from "react-router-dom";
import { useMatchWebSocket } from "@/hooks/useMatchWebSocket";

export function MatchDashboard() {
  const { room_id } = useParams();
  const { players, connectionStatus, lastEvent, matchStatus, winner: wsWinner, p1Score, p2Score } = useMatchWebSocket(room_id);

  const winner =
    wsWinner === "draw"
      ? "DRAW"
      : wsWinner === "1"
        ? "P1"
        : wsWinner === "2"
          ? "P2"
          : p1Score < p2Score
            ? "P1"
            : p2Score < p1Score
              ? "P2"
              : "DRAW";

  const finalP1Score = p1Score ?? players.P1.game_score;
  const finalP2Score = p2Score ?? players.P2.game_score;

  const connDot =
    connectionStatus === "connected"
      ? "bg-emerald-500"
      : connectionStatus === "connecting"
        ? "bg-amber-400"
        : "bg-red-500";

  const connLabel =
    connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "connecting"
        ? "Connecting..."
        : "Disconnected";

  const p1Name = players.P1.player_name || "Player 1";
  const p2Name = players.P2.player_name || "Player 2";

  return (
    <div className="min-h-screen bg-muted text-foreground flex flex-col relative">
      {/* HEADER */}
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-base">
            🏆
          </div>
          <div className="font-bold text-lg tracking-tight text-foreground">
            OAMP <span className="text-muted-foreground font-normal text-sm ml-1">Spectator</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-50 border border-border px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest text-blue-700 shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${matchStatus === "playing" ? "bg-emerald-500 animate-pulse" : "bg-blue-600"}`} />
          {matchStatus === "playing" ? "LIVE" : matchStatus === "finished" ? "SELESAI" : "MENUNGGU"}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[13px] text-muted-foreground tracking-wider">
            Room: {room_id}
          </div>
          <span className={`w-2 h-2 rounded-full ${connDot}`} />
          <span className="text-[11px] font-bold tracking-wider text-foreground">
            {connLabel}
          </span>
        </div>
      </div>

      {/* ARENA */}
      <div className="flex-1 flex min-h-0">
        {/* PLAYER 1 */}
        <div className={`flex-1 flex flex-col items-center justify-center gap-4 p-8 border-r-2 border-border ${winner === "P1" ? "bg-emerald-50/50" : ""}`}>
          <div className="text-sm tracking-widest text-muted-foreground uppercase font-bold">
            P1
          </div>
          <div className="text-lg font-bold text-foreground">
            {p1Name}
          </div>

          <div className={`text-[120px] leading-none tracking-wider font-black ${winner === "P1" ? "text-emerald-600" : "text-foreground"}`}>
            {players.P1.game_score}
          </div>

          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <span>
              Blocks Hit:{" "}
              <span className="text-foreground font-bold">
                {players.P1.blocks_hit}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${players.P1.status === "playing" ? "bg-emerald-500 animate-pulse" : players.P1.status === "waiting" ? "bg-amber-400" : players.P1.status === "finished" ? "bg-blue-500" : "bg-red-500"}`}
              />
              <span
                className={
                  players.P1.status === "playing"
                    ? "text-emerald-600"
                    : players.P1.status === "waiting"
                      ? "text-amber-600"
                      : players.P1.status === "finished"
                        ? "text-blue-600"
                        : "text-red-600"
                }
              >
                {players.P1.status === "finished" ? "SELESAI" : players.P1.status}
              </span>
            </span>
          </div>
        </div>

        {/* PLAYER 2 */}
        <div className={`flex-1 flex flex-col items-center justify-center gap-4 p-8 ${winner === "P2" ? "bg-emerald-50/50" : ""}`}>
          <div className="text-sm tracking-widest text-muted-foreground uppercase font-bold">
            P2
          </div>
          <div className="text-lg font-bold text-foreground">
            {p2Name}
          </div>

          <div className={`text-[120px] leading-none tracking-wider font-black ${winner === "P2" ? "text-emerald-600" : "text-foreground"}`}>
            {players.P2.game_score}
          </div>

          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <span>
              Blocks Hit:{" "}
              <span className="text-foreground font-bold">
                {players.P2.blocks_hit}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${players.P2.status === "playing" ? "bg-emerald-500 animate-pulse" : players.P2.status === "waiting" ? "bg-amber-400" : players.P2.status === "finished" ? "bg-blue-500" : "bg-red-500"}`}
              />
              <span
                className={
                  players.P2.status === "playing"
                    ? "text-emerald-600"
                    : players.P2.status === "waiting"
                      ? "text-amber-600"
                      : players.P2.status === "finished"
                        ? "text-blue-600"
                        : "text-red-600"
                }
              >
                {players.P2.status === "finished" ? "SELESAI" : players.P2.status}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="h-[40px] bg-card border-t border-border flex items-center px-5 gap-2 flex-shrink-0">
        {lastEvent && (
          <span className="text-[10px] text-muted-foreground tracking-wider">
            {lastEvent.type}
          </span>
        )}
      </div>

      {/* GAME OVER OVERLAY */}
      {matchStatus === "finished" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-foreground/80 backdrop-blur-sm">
          <div className="text-7xl mb-4">
            {winner === "DRAW" ? "🤝" : "👑"}
          </div>
          <div className="text-7xl font-black leading-none tracking-wide text-white">
            {winner === "DRAW" ? "SERI!" : `${winner} MENANG!`}
          </div>
          <div className="mt-3 text-sm tracking-widest text-white/70 uppercase">
            Pertandingan Selesai
          </div>
          <div className="mt-6 flex items-center gap-8 text-4xl font-black tracking-wide text-white">
            <span className={`flex flex-col items-center ${winner === "P1" ? "text-emerald-400" : "text-white/50"}`}>
              <span className="text-sm font-normal tracking-wider mb-1">{p1Name}</span>
              {finalP1Score}
            </span>
            <span className="text-white/30 text-2xl">vs</span>
            <span className={`flex flex-col items-center ${winner === "P2" ? "text-emerald-400" : "text-white/50"}`}>
              <span className="text-sm font-normal tracking-wider mb-1">{p2Name}</span>
              {finalP2Score}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}