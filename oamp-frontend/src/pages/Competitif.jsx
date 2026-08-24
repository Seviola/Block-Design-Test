import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Swords, Trophy, LayoutGrid, Table2, BarChart3, History } from "lucide-react";
import { StatsPanel } from "@/components/StatsPanel";
import { DuelRoom } from "@/components/DuelRoom";

function getScore(row) {
  const s = row.score ?? null;
  return s != null ? Math.round(s) : null;
}

const TABS = [
  { key: "live", icon: LayoutGrid, label: "Live Duel" },
  { key: "history", icon: History, label: "Riwayat" },
  { key: "ranking", icon: Table2, label: "Peringkat" },
  { key: "stats", icon: BarChart3, label: "Statistik" },
];

export function Competitif() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("live");
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [liveRooms, setLiveRooms] = useState({});
  const wsRef = useRef(null);

  // WebSocket for realtime
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
    const wsUrl = apiUrl.replace(/^http/, "ws").replace(/\/api\/v1$/, "");
    let reconnectTimer;
    let mounted = true;

    function connect() {
      if (!mounted || wsRef.current?.readyState === WebSocket.OPEN) return;
      const ws = new WebSocket(`${wsUrl}/ws/event-display`);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const msg = JSON.parse(event.data);
          const { type, data } = msg;
          if (type === "score_update" || type === "level_start") {
            const rid = data?.room_id;
            if (!rid) return;
            setLiveRooms((prev) => {
              const current = prev[rid] || {
                p1_level: 0, p1_time: 0, p1_completed: 0, p1_times: [], p1_finished: false,
                p2_level: 0, p2_time: 0, p2_completed: 0, p2_times: [], p2_finished: false,
              };
              const key = data.player_num === 1 ? "p1" : "p2";
              const updated = { ...current };
              if (type === "level_start") {
                updated[`${key}_level`] = data.level || current[`${key}_level`];
                updated[`${key}_time`] = 0;
                updated[`${key}_completed`] = data.completed_levels ?? current[`${key}_completed`];
              } else {
                updated[`${key}_level`] = data.level || current[`${key}_level`];
                updated[`${key}_time`] = data.time_sec || current[`${key}_time`];
                updated[`${key}_completed`] = data.completed_levels ?? current[`${key}_completed`];
                updated[`${key}_finished`] = data.is_finished || current[`${key}_finished`];
                const prevTimes = current[`${key}_times`] || [];
                if (prevTimes.length < data.level) {
                  updated[`${key}_times`] = [...prevTimes, data.time_sec || 0];
                } else {
                  updated[`${key}_times`] = prevTimes;
                }
              }
              return { ...prev, [rid]: updated };
            });
          } else {
            queryClient.invalidateQueries({ queryKey: ["rooms-duel"] });
            queryClient.invalidateQueries({ queryKey: ["leaderboard-duel", "competition", selectedBatchId] });
          }
        } catch { /* ignore */ }
      };
      ws.onclose = () => { if (mounted) reconnectTimer = setTimeout(connect, 5000); };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => { mounted = false; clearTimeout(reconnectTimer); wsRef.current?.close(); };
  }, [queryClient, selectedBatchId]);

  // Data queries
  const { data: batchesRes } = useQuery({ queryKey: ["batches"], queryFn: () => api.get("/batches") });
  const allBatches = useMemo(() => batchesRes?.data || [], [batchesRes]);

  const batchParams = selectedBatchId !== "all"
    ? { params: { batch_id: selectedBatchId, mode: "competition" } }
    : { params: { batch_id: "all", mode: "competition" } };

  const { data: boardRes, isLoading, isError } = useQuery({
    queryKey: ["leaderboard-duel", "competition", selectedBatchId],
    queryFn: () => api.get("/leaderboard", batchParams),
    refetchInterval: 5000,
  });

  const { data: roomsRes } = useQuery({
    queryKey: ["rooms-duel"],
    queryFn: () => api.get("/rooms"),
    refetchInterval: 3000,
  });

  // History (finished) rooms — fetched once, no need to poll as aggressively
  const { data: historyRes } = useQuery({
    queryKey: ["rooms-history"],
    queryFn: () => api.get("/rooms"),
    refetchInterval: 10000,
  });

  const rooms = useMemo(() => {
    const raw = roomsRes?.data?.data || roomsRes?.data || [];
    return raw.filter((r) => ["waiting", "ready", "playing"].includes(r.status));
  }, [roomsRes]);

  const historyRooms = useMemo(() => {
    const raw = historyRes?.data?.data || historyRes?.data || [];
    return raw
      .filter((r) => r.status === "finished")
      .sort((a, b) => (b.last_activity || "").localeCompare(a.last_activity || ""))
      .slice(0, 30);
  }, [historyRes]);

  const data = useMemo(() => boardRes?.data?.data || boardRes?.data || [], [boardRes]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-4 sm:px-6 py-4 mx-3 sm:mx-5 mt-3 sm:mt-5 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground">Otak Atik Merah Putih</h1>
            <p className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground">Block Design Test · Duel Arena</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Pilih sesi..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Sesi</SelectItem>
              {allBatches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}{!b.is_active ? " (arsip)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* NAV TABS */}
        <div className="flex justify-center mt-6 sm:mt-8 mb-6 px-3 sm:px-5">
          <nav className="flex flex-wrap justify-center gap-1 p-1 rounded-2xl bg-muted border border-border w-full sm:w-auto">
            {TABS.map(({ key, icon: Icon, label }) => ( // eslint-disable-line no-unused-vars
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200",
                  tab === key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* CONTENT */}
        <main className="flex-1 px-3 sm:px-5 pb-6 sm:pb-8 min-w-0">
          {isLoading && tab !== "stats" ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="text-lg font-bold">Memuat data...</p>
            </div>
          ) : isError && tab !== "stats" ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <p className="text-lg font-bold text-red-600">Gagal memuat leaderboard</p>
              <p className="text-sm text-slate-400 mt-2">Server tidak tersedia</p>
            </div>
          ) : (
            <>
              {/* LIVE DUEL TAB */}
              {tab === "live" && (
                rooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
                    <Swords className="h-12 w-12 mb-4 opacity-30" />
                    <p className="text-xl font-bold text-foreground">Belum ada room aktif</p>
                    <p className="text-sm mt-2 text-muted-foreground">Buat room baru untuk mulai duel</p>
                  </div>
                ) : (
                  <div className="w-full max-w-5xl mx-auto">
                    {rooms.map((room) => (
                      <DuelRoom
                        key={room.id}
                        room={room}
                        live={liveRooms[room.id] || {}}
                        rank1={data.findIndex((r) => r.name === room.player1_name) + 1 || undefined}
                        rank2={data.findIndex((r) => r.name === room.player2_name) + 1 || undefined}
                      />
                    ))}
                    {/* Room-less players */}
                    {data.length > 0 && (
                      <div className="mt-12">
                        <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4 pl-1">
                          <Trophy className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                          Peringkat Peserta
                        </h3>
                        <Card className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-border">
                                  <TableHead className="text-slate-400 uppercase text-xs font-bold py-3 px-5">#</TableHead>
                                  <TableHead className="text-slate-400 uppercase text-xs font-bold py-3 px-5">Pemain</TableHead>
                                  <TableHead className="text-slate-400 uppercase text-xs font-bold py-3 px-5">Kelas</TableHead>
                                  <TableHead className="text-slate-400 uppercase text-xs font-bold py-3 px-5 text-right">Skor</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.map((row) => {
                                  const score = getScore(row);
                                  return (
                                    <TableRow
                                      key={row.participant_id || row.uid}
                                      className="cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50"
                                      onClick={() => navigate(`/analytics/${row.uid || row.participant_id}`)}
                                    >
                                      <TableCell className="py-3 px-5">
                                        <RankBadge rank={row.rank} />
                                      </TableCell>
                                      <TableCell className="py-3 px-5">
                                        <div className="flex items-center gap-3">
                                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm bg-gradient-to-br",
                                            row.rank === 1 ? "from-amber-400 to-orange-500" : row.rank === 2 ? "from-slate-300 to-slate-400" : row.rank === 3 ? "from-orange-300 to-orange-400" : "from-violet-400 to-purple-500"
                                          )}>{row.name?.charAt(0)?.toUpperCase()}</div>
                                          <div>
                                            <div className="font-bold text-sm text-foreground">{row.name}</div>
                                            <div className="text-xs text-muted-foreground">{row.age} th</div>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-3 px-5"><Badge variant="outline" className="text-xs font-semibold">{row.grade}</Badge></TableCell>
                                      <TableCell className="py-3 px-5 text-right"><span className="text-lg font-black tabular-nums">{score ?? "—"}</span></TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                   </div>
                 )
               )}

               {/* HISTORY TAB — finished rooms */}
               {tab === "history" && (
                 <div className="max-w-3xl mx-auto">
                   <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                     <History className="h-5 w-5 text-muted-foreground" />
                     Riwayat Duel
                   </h2>
                   {historyRooms.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border border-dashed border-border rounded-2xl">
                       <History className="h-12 w-12 mb-4 opacity-30" />
                       <p className="text-xl font-bold text-foreground">Belum ada riwayat duel</p>
                       <p className="text-sm mt-2 text-muted-foreground">Room yang sudah selesai akan muncul di sini</p>
                     </div>
                   ) : (
                     <Card className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
                       <CardContent className="p-0">
                         <Table>
                           <TableHeader>
                             <TableRow className="hover:bg-transparent border-b border-border">
                               <TableHead className="text-muted-foreground uppercase text-xs font-bold py-3 px-5">Room</TableHead>
                               <TableHead className="text-muted-foreground uppercase text-xs font-bold py-3 px-5">Pemenang</TableHead>
                               <TableHead className="text-muted-foreground uppercase text-xs font-bold py-3 px-5 text-center">P1</TableHead>
                               <TableHead className="text-muted-foreground uppercase text-xs font-bold py-3 px-5 text-center">P2</TableHead>
                               <TableHead className="text-muted-foreground uppercase text-xs font-bold py-3 px-5">Selesai</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {historyRooms.map((r) => {
                               const winnerName = r.winner === "1" ? r.player1_name
                                 : r.winner === "2" ? r.player2_name
                                 : "Seri";
                               const winnerColor = r.winner === "draw" ? "text-muted-foreground"
                                 : "text-emerald-600 dark:text-emerald-400";
                               return (
                                 <TableRow key={r.id} className="border-b border-border/50">
                                   <TableCell className="py-3 px-5">
                                     <Badge variant="outline" className="font-mono font-bold">{r.id}</Badge>
                                   </TableCell>
                                   <TableCell className={cn("py-3 px-5 font-bold", winnerColor)}>
                                     🏆 {winnerName}
                                   </TableCell>
                                   <TableCell className="py-3 px-5 text-center font-mono text-sm">
                                     {r.player1_score ? `${r.player1_score.toFixed(1)}s` : "—"}
                                   </TableCell>
                                   <TableCell className="py-3 px-5 text-center font-mono text-sm">
                                     {r.player2_score ? `${r.player2_score.toFixed(1)}s` : "—"}
                                   </TableCell>
                                   <TableCell className="py-3 px-5 text-xs text-muted-foreground">
                                     {r.last_activity ? new Date(r.last_activity).toLocaleString("id-ID") : "—"}
                                   </TableCell>
                                 </TableRow>
                               );
                             })}
                           </TableBody>
                         </Table>
                       </CardContent>
                     </Card>
                   )}
                 </div>
               )}

               {/* RANKING TAB */}
              {tab === "ranking" && (
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Peringkat
                    </h2>
                    <Button variant="outline" onClick={() => navigate("/export")} className="rounded-xl text-sm font-bold">Export</Button>
                  </div>
                  {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                      <Trophy className="h-12 w-12 mb-4 opacity-30" />
                      <p className="text-xl font-bold">Ayo Mulai!</p>
                      <p className="text-sm mt-2">Belum ada data peserta</p>
                    </div>
                  ) : (
                    <Card className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border">
                              <TableHead className="text-slate-400 uppercase text-xs font-bold py-4 px-5">#</TableHead>
                              <TableHead className="text-slate-400 uppercase text-xs font-bold py-4 px-5">Pemain</TableHead>
                              <TableHead className="text-slate-400 uppercase text-xs font-bold py-4 px-5">Kelas</TableHead>
                              <TableHead className="text-slate-400 uppercase text-xs font-bold py-4 px-5">Usia</TableHead>
                              <TableHead className="text-slate-400 uppercase text-xs font-bold py-4 px-5 text-right">Skor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.map((row) => {
                              const score = getScore(row);
                              const medal = row.rank === 1 ? "👑" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : null;
                              return (
                                <TableRow
                                  key={row.participant_id || row.uid}
                                  className={cn("cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50",
                                    row.rank === 1 && "border-l-4 border-l-amber-400",
                                    row.rank === 2 && "border-l-4 border-l-slate-300",
                                    row.rank === 3 && "border-l-4 border-l-orange-400",
                                  )}
                                  onClick={() => navigate(`/analytics/${row.uid || row.participant_id}`)}
                                >
                                  <TableCell className="py-3 px-5">
                                    <RankBadge rank={row.rank} />
                                  </TableCell>
                                  <TableCell className="py-3 px-5">
                                    <div className="flex items-center gap-3">
                                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm bg-gradient-to-br",
                                        row.rank === 1 ? "from-amber-400 to-orange-500" : row.rank === 2 ? "from-slate-300 to-slate-400" : row.rank === 3 ? "from-orange-300 to-orange-400" : "from-violet-400 to-purple-500"
                                      )}>{row.name?.charAt(0)?.toUpperCase()}</div>
                                      <div>
                                        <div className="font-bold text-sm">{row.name}</div>
                                        <div className="text-xs text-muted-foreground">{row.age} th{medal ? ` ${medal}` : ""}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 px-5"><Badge variant="outline" className="text-xs font-semibold">{row.grade}</Badge></TableCell>
                                  <TableCell className="py-3 px-5 text-slate-500 text-sm">{row.age}</TableCell>
                                  <TableCell className="py-3 px-5 text-right"><span className="text-xl font-black tabular-nums">{score ?? "—"}</span></TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* STATS TAB */}
              {tab === "stats" && (
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Statistik
                  </h2>
                  <StatsPanel />
                </div>
              )}
            </>
            )}
          </main>
      </div>
    );
  }

function RankBadge({ rank }) {
  if (rank === 1) return <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-700 text-xs font-black">1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-200 text-slate-600 text-xs font-black">2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-orange-100 text-orange-700 text-xs font-black">3</span>;
  return <span className="font-bold text-slate-400">#{rank}</span>;
}
