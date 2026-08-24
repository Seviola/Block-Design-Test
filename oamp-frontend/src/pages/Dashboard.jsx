import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAdminMode } from "@/contexts/AdminModeContext";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Gamepad2,
  UserPlus,
  Download,
  Trophy,
  Settings,
  Layers,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const PLAYER_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#8b5cf6",
  "#14b8a6",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const uniquePayload = payload.filter(
      (v, i, a) => a.findIndex((t) => t.dataKey === v.dataKey) === i
    );

    const sortedPayload = [...uniquePayload].sort((a, b) => b.value - a.value);

    return (
      <div className="bg-card border border-[var(--color-border)] p-3 rounded-xl shadow-sm z-50">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          {label}
        </p>
        <div className="flex flex-col gap-1.5">
          {sortedPayload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  {entry.name}
                </span>
              </div>
              <span className="text-slate-900 dark:text-white text-sm font-bold tabular-nums">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const queryClient = useQueryClient();
  const { adminMode } = useAdminMode();
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionPrefix, setNewSessionPrefix] = useState("");
  const [startingSession, setStartingSession] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editBatchName, setEditBatchName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [leaderboardMode, setLeaderboardMode] = useState("training");

  const { data: batchesRes } = useQuery({
    queryKey: ["batches"],
    queryFn: () => api.get("/batches"),
  });

  const allBatches = useMemo(
    () => batchesRes?.data?.data || batchesRes?.data || [],
    [batchesRes]
  );

  const activeSession = useMemo(
    () => allBatches.find((b) => b.is_active) || null,
    [allBatches]
  );

  // Set default selected batch to active session once batches load
  useEffect(() => {
    if (allBatches.length > 0 && selectedBatchId === "all") {
      const active = allBatches.find((b) => b.is_active);
      if (active) setSelectedBatchId(String(active.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBatches]);

  const selectedBatch = useMemo(
    () => allBatches.find((b) => String(b.id) === selectedBatchId) || null,
    [allBatches, selectedBatchId]
  );

  const isReadOnly = !!(selectedBatch && !selectedBatch.is_active);

  const batchParams =
    selectedBatchId !== "all"
      ? { params: { batch_id: selectedBatchId, mode: leaderboardMode } }
      : { params: { batch_id: "all", mode: leaderboardMode } };

  const { data: boardRes, isLoading, isError, refetch: refetchBoard } = useQuery({
    queryKey: ["leaderboard", leaderboardMode, selectedBatchId],
    queryFn: () => api.get("/leaderboard", batchParams),
    refetchInterval: isReadOnly ? false : 5000,
  });

  const { data: timeRes, refetch: refetchTimeline } = useQuery({
    queryKey: ["timeline", leaderboardMode, selectedBatchId],
    queryFn: () => api.get("/leaderboard/timeline", batchParams),
    refetchInterval: isReadOnly ? false : 5000,
  });

  async function handleStartNewSession() {
    if (!newSessionName.trim()) {
      toast.error("Nama sesi tidak boleh kosong.");
      return;
    }
    setStartingSession(true);
    try {
      await api.post("/batches", {
        name: newSessionName.trim(),
        uid_prefix: newSessionPrefix.trim() || undefined,
      });
      toast.success(`Sesi "${newSessionName.trim()}" berhasil dimulai!`);
      setNewSessionName("");
      setNewSessionPrefix("");
      setSessionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      await Promise.all([refetchBoard(), refetchTimeline()]);
    } catch {
      toast.error("Gagal memulai sesi baru. Server tidak tersedia.");
    } finally {
      setStartingSession(false);
    }
  }

  async function handleRenameBatch(id, name) {
    try {
      await api.put(`/batches/${id}`, { name });
      toast.success("Sesi berhasil diubah namanya.");
      setEditingBatchId(null);
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    } catch {
      toast.error("Gagal mengubah nama sesi.");
    }
  }

  async function handleDeleteBatch(id) {
    try {
      await api.delete(`/batches/${id}`);
      toast.success("Sesi berhasil dihapus.");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    } catch {
      toast.error("Gagal menghapus sesi.");
    }
  }

  async function handleActivateBatch(id) {
    try {
      await api.post(`/batches/${id}/activate`);
      toast.success("Sesi diaktifkan.");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      await Promise.all([refetchBoard(), refetchTimeline()]);
    } catch {
      toast.error("Gagal mengaktifkan sesi.");
    }
  }

  const leaderboard = useMemo(() => boardRes?.data?.data || boardRes?.data || [], [boardRes]);
  const rawTimeline = useMemo(() => timeRes?.data?.data || timeRes?.data || [], [timeRes]);

  const totalParticipants = leaderboard.length;
  const best = leaderboard[0]?.score;
  const bestScore = best != null ? Math.round(best) : null;
  const avg = leaderboard.length > 0
    ? leaderboard.reduce((a, b) => a + (b.score || 0), 0) / Math.max(leaderboard.length, 1)
    : 0;
  const avgScore = leaderboard.length > 0 && !Number.isNaN(avg) ? Math.round(avg) : null;

  const topPlayers = useMemo(
    () => leaderboard.slice(0, 8).map((p) => p.name),
    [leaderboard]
  );

  const { processedTimeline, playerLatestScores } = useMemo(() => {
    const timeline = [];
    const scores = {};

    topPlayers.forEach((p) => {
      scores[p] = 0;
    });

    if (rawTimeline.length > 0) {
      const firstDate = new Date(rawTimeline[0].created_at);
      firstDate.setMinutes(firstDate.getMinutes() - 1);
      timeline.push({
        time: firstDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...scores,
      });
    }

    rawTimeline.forEach((entry) => {
      if (!topPlayers.includes(entry.name)) return;

      const timeStr = new Date(entry.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!scores[entry.name] || entry.score > scores[entry.name]) {
        scores[entry.name] = entry.score;
      }

      timeline.push({ time: timeStr, ...scores });
    });

    return { processedTimeline: timeline, playerLatestScores: scores };
  }, [rawTimeline, topPlayers]);

  const legendOrder = useMemo(() => {
    return [...topPlayers].sort((a, b) => (playerLatestScores[b] || 0) - (playerLatestScores[a] || 0));
  }, [topPlayers, playerLatestScores]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">OAMP Leaderboard</h1>
          {activeSession && (
            <Badge
              variant="outline"
              className="bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300 gap-1.5 text-xs px-2.5 py-1"
            >
              <Layers className="h-3 w-3" />
              {activeSession.name}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Mode toggle: Latihan / Kompetisi */}
          <div className="flex items-center bg-muted border border-border rounded-xl p-1">
            <button
              onClick={() => setLeaderboardMode("training")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                leaderboardMode === "training"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Latihan
            </button>
            <button
              onClick={() => setLeaderboardMode("competition")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                leaderboardMode === "competition"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Kompetisi
            </button>
          </div>
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Pilih sesi..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Sesi</SelectItem>
              {allBatches.map((batch) => (
                <SelectItem key={batch.id} value={String(batch.id)}>
                  <span className="flex items-center gap-2">
                    {batch.is_active ? (
                      <Layers className="h-3 w-3 text-orange-500" />
                    ) : (
                      <Eye className="h-3 w-3 text-slate-400" />
                    )}
                    {batch.name}
                    {!batch.is_active && (
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0.5">
                        Archived
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSessionDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manajemen Sesi
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/register">
              <UserPlus className="h-4 w-4 mr-2" />
              Register New
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/export">
              <Download className="h-4 w-4 mr-2" />
              Report
            </Link>
          </Button>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-[#fef3c7] border border-[var(--color-border)] text-foreground px-4 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            Anda sedang melihat data sesi lama —{" "}
            <strong>{selectedBatch?.name}</strong>. Leaderboard tidak akan auto-refresh.
          </span>
        </div>
      )}

      {isError && (
        <div className="bg-[#fee2e2] border border-[var(--color-border)] text-foreground px-4 py-3 rounded-xl text-sm font-bold shadow-sm">
          Gagal memuat leaderboard. Server offline.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Players" value={totalParticipants} icon={<Users className="h-5 w-5" />} color="blue" />
        <StatCard title="Highest Score" value={bestScore} icon={<Trophy className="h-5 w-5" />} color="amber" />
        <StatCard title="Average Score" value={avgScore} icon={<Gamepad2 className="h-5 w-5" />} color="green" />
      </div>

      {processedTimeline.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-card shadow-sm">
          <div className="bg-muted px-6 pt-5 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 dark:bg-green-400" />
                  <div className="absolute inset-0 rounded-full bg-green-500 dark:bg-green-400 animate-ping opacity-75" />
                </div>
                <h3 className="text-slate-800 dark:text-white font-bold text-sm tracking-widest uppercase">
                  Score Timeline
                </h3>
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                top {legendOrder.length} players
              </span>
            </div>
          </div>

          <div className="h-[300px] md:h-[420px] px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedTimeline}>
                <defs>
                  {topPlayers.map((player, index) => (
                    <linearGradient
                      key={`grad-${player}`}
                      id={`grad-${player}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid
                  strokeDasharray="1 0"
                  stroke="var(--color-border, #e2e8f0)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  tickMargin={10}
                  minTickGap={30}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 20", "dataMax + 50"]}
                  tick={{ fontSize: 11 }}
                  width={50}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "var(--color-border, #e2e8f0)", strokeWidth: 1, strokeDasharray: "3 3" }}
                />

                {topPlayers.map((player) => (
                  <Line
                    key={`area-${player}`}
                    type="monotone"
                    dataKey={player}
                    stroke="transparent"
                    fill={`url(#grad-${player})`}
                    dot={false}
                    activeDot={false}
                    strokeWidth={0}
                  />
                ))}

                {topPlayers.map((player, index) => {
                  const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
                  return (
                    <Line
                      key={`glow-${player}`}
                      type="monotone"
                      dataKey={player}
                      stroke={color}
                      strokeWidth={index === 0 ? 10 : 5}
                      dot={false}
                      activeDot={false}
                      opacity={0.2}
                    />
                  );
                })}

                {topPlayers.map((player, index) => {
                  const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
                  return (
                    <Line
                      key={player}
                      type="monotone"
                      dataKey={player}
                      stroke={color}
                      strokeWidth={index === 0 ? 3.5 : 2}
                      dot={false}
                      activeDot={{
                        r: 5,
                        strokeWidth: 2,
                        stroke: "#fff",
                        fill: color,
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#f9fafb] px-6 py-5 border-t-2 border-[var(--color-border)]">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {legendOrder.map((player, index) => {
                const colorIndex = topPlayers.indexOf(player);
                const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
                const score = Math.round(playerLatestScores[player] || 0);
                const rank = index + 1;

                return (
                  <div
                    key={player}
                    className="flex items-center gap-2.5 group cursor-default"
                  >
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-mono w-4 text-right">
                      {rank}.
                    </span>
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 transition-all group-hover:scale-125"
                      style={{
                        backgroundColor: color,
                      }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                      {player}
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color }}
                    >
                      {score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted py-4 border-b-2 border-[var(--color-border)]">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5" />
            Global Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LeaderboardTable data={leaderboard} loading={isLoading} />
        </CardContent>
      </Card>

      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manajemen Sesi
            </DialogTitle>
            <DialogDescription>
              Kelola semua sesi event: ganti nama, hapus, atau aktifkan sesi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[340px] overflow-y-auto">
            {/* Batch list */}
            {allBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada sesi.
              </p>
            ) : (
              <div className="space-y-1">
                {allBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-card px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {editingBatchId === batch.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            className="h-7 text-sm"
                            value={editBatchName}
                            onChange={(e) => setEditBatchName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameBatch(batch.id, editBatchName);
                              if (e.key === "Escape") setEditingBatchId(null);
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => handleRenameBatch(batch.id, editBatchName)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium truncate">
                          {batch.name}
                        </span>
                      )}
                      {batch.is_active && (
                        <Badge className="bg-[#10b981] text-white text-[10px] px-1.5 py-0 shrink-0 border-[var(--color-border)]">
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!batch.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => handleActivateBatch(batch.id)}
                        >
                          Aktifkan
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-1.5"
                        onClick={() => {
                          setEditingBatchId(batch.id);
                          setEditBatchName(batch.name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {adminMode && (
                        deleteConfirmId === batch.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs px-2"
                              onClick={() => handleDeleteBatch(batch.id)}
                            >
                              Yakin?
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Batal
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-1.5 text-red-500 hover:text-red-600"
                            onClick={() => setDeleteConfirmId(batch.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create new */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Buat Sesi Baru</p>
            <Input
              placeholder="Contoh: Sesi 1 - Putaran Pertama"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleStartNewSession();
              }}
            />
            <Input
              placeholder="Prefiks ID (opsional): BDT"
              value={newSessionPrefix}
              onChange={(e) => setNewSessionPrefix(e.target.value)}
              maxLength={10}
              className="border border-[var(--color-border)] shadow-sm rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              ID peserta akan dibuat otomatis: {newSessionPrefix || "BDT"}001, {newSessionPrefix || "BDT"}002, dst.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleStartNewSession}
                disabled={startingSession}
                className="flex-1"
              >
                {startingSession ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memulai...
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 mr-2" />
                    Mulai Sesi Baru
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSessionDialogOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const colorMap = {
  blue: "bg-[#4f46e5] text-white border border-[var(--color-border)] shadow-sm",
  amber: "bg-[#fbbf24] text-foreground border border-[var(--color-border)] shadow-sm",
  green: "bg-[#10b981] text-white border border-[var(--color-border)] shadow-sm",
};

function StatCard({ title, value, icon, color }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`p-3 rounded-lg ${colorMap[color] || "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}