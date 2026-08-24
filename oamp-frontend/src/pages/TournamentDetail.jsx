import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useAdminMode } from "@/contexts/AdminModeContext";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trophy,
  Users,
  Loader2,
  Play,
  ArrowLeft,
  Swords,
  UserPlus,
  ChevronRight,
  CheckCircle,
  Search,
  X,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminMode } = useAdminMode();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUids, setSelectedUids] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [starting, setStarting] = useState(false);

  const [resultOpen, setResultOpen] = useState(false);
  const [resultMatch, setResultMatch] = useState(null);
  const [p1Score, setP1Score] = useState("");
  const [p2Score, setP2Score] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [submittingResult, setSubmittingResult] = useState(false);

  const [creatingRoom, setCreatingRoom] = useState({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => api.get(`/tournaments/${id}`),
    refetchInterval: 3000,
  });

  const tournament = data?.data?.tournament || {};
  const matches = data?.data?.matches || [];
  const players = useMemo(() => data?.data?.players || [], [data]);

  const alreadyUids = useMemo(
    () => new Set(players.map((p) => p.uid).filter(Boolean)),
    [players]
  );

  const {
    data: allParticipantsRes,
    isLoading: loadingParticipants,
  } = useQuery({
    queryKey: ["participants-all"],
    queryFn: () => api.get("/participants"),
    enabled: registerOpen,
  });

  const allParticipants = useMemo(() => {
    const raw = allParticipantsRes?.data;
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [allParticipantsRes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allParticipants.filter((p) => {
      if (alreadyUids.has(p.uid)) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.uid?.toLowerCase().includes(q)
      );
    });
  }, [allParticipants, alreadyUids, search]);

  function toggleUid(uid) {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    );
  }

  function removeUid(uid) {
    setSelectedUids((prev) => prev.filter((u) => u !== uid));
  }

  async function handleRegister() {
    if (selectedUids.length === 0) {
      toast.error("Pilih minimal 1 peserta");
      return;
    }
    if (selectedUids.length < 2) {
      toast.error("Minimal 2 peserta");
      return;
    }
    setRegistering(true);
    try {
      const res = await api.post(`/tournaments/${id}/register`, { uids: selectedUids });
      const added = res.data?.added || 0;
      const errors = res.data?.errors || [];
      toast.success(`${added} peserta berhasil didaftarkan!`);
      if (errors.length > 0) {
        errors.forEach((e) => toast.warning(e));
      }
      setSelectedUids([]);
      setSearch("");
      setRegisterOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal mendaftarkan peserta.");
    } finally {
      setRegistering(false);
    }
  }

  async function handleStart() {
    setStarting(true);
    try {
      await api.post(`/tournaments/${id}/start`);
      toast.success("Cup dimulai! Bracket digenerate.");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memulai cup.");
    } finally {
      setStarting(false);
    }
  }

  function openResultDialog(match) {
    setResultMatch(match);
    setP1Score(match.player1_score || "");
    setP2Score(match.player2_score || "");
    setWinnerId("");
    setResultOpen(true);
  }

  async function handleSubmitResult() {
    if (!resultMatch) return;
    const s1 = parseFloat(p1Score);
    const s2 = parseFloat(p2Score);
    if (Number.isNaN(s1) || Number.isNaN(s2)) {
      toast.error("Skor harus berupa angka");
      return;
    }
    if (!winnerId) {
      toast.error("Pilih pemenang");
      return;
    }
    setSubmittingResult(true);
    try {
      await api.post(`/tournaments/${id}/matches/${resultMatch.id}/result`, {
        player1_score: s1,
        player2_score: s2,
        winner_id: parseInt(winnerId),
      });
      toast.success("Hasil pertandingan disimpan!");
      setResultOpen(false);
      setResultMatch(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan hasil.");
    } finally {
      setSubmittingResult(false);
    }
  }

  async function handleCreateRoom(matchId) {
    setCreatingRoom((prev) => ({ ...prev, [matchId]: true }));
    try {
      await api.post(`/tournaments/${id}/matches/${matchId}/create-room`);
      toast.success("Room dibuat!");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal membuat room.");
    } finally {
      setCreatingRoom((prev) => ({ ...prev, [matchId]: false }));
    }
  }

  // Group matches by round
  const rounds = {};
  matches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });
  const roundKeys = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

  const roundNames = {
    1: "Round 1",
    2: "Quarterfinal",
    3: "Semifinal",
    4: "Final",
  };

  const statusBadge = {
    scheduled: "bg-muted text-foreground border border-[var(--color-border)] shadow-sm",
    ready: "bg-blue-100 text-blue-700 border border-[var(--color-border)] shadow-sm",
    playing: "bg-amber-100 text-amber-700 border border-[var(--color-border)] shadow-sm",
    finished: "bg-green-100 text-green-700 border border-[var(--color-border)] shadow-sm",
    bye: "bg-muted text-muted-foreground border border-[var(--color-border)] shadow-sm",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tournaments")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{tournament.name || "Cup"}</h1>
            <p className="text-sm text-muted-foreground">
              {tournament.player_count || 0}/{tournament.max_players || 0} peserta — Ronde {tournament.current_round || 0}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {adminMode && tournament.status === "registration" && (
            <>
              <Button variant="outline" onClick={() => setRegisterOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Daftarkan Peserta
              </Button>
              <Button onClick={handleStart} disabled={starting || players.length < 2}>
                {starting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Mulai Cup
              </Button>
            </>
          )}
          {tournament.status === "in_progress" && (
            <Badge className="bg-green-100 text-green-700 border border-[var(--color-border)] shadow-sm">
              <Swords className="h-3 w-3 mr-1" /> Berlangsung
            </Badge>
          )}
          {tournament.status === "finished" && (
            <Badge className="bg-muted text-muted-foreground border border-[var(--color-border)] shadow-sm">
              <CheckCircle className="h-3 w-3 mr-1" /> Selesai
            </Badge>
          )}
        </div>
      </div>

      {/* Players */}
      <Card className="border border-[var(--color-border)] shadow-sm rounded-xl">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Peserta ({players.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <Badge key={p.id} variant="outline" className="text-xs px-2 py-1 border border-[var(--color-border)] shadow-sm">
                #{p.seed} {p.name}
              </Badge>
            ))}
            {players.length === 0 && (
              <span className="text-sm text-muted-foreground">Belum ada peserta. Klik &quot;Daftarkan Peserta&quot; untuk memilih.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bracket */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p>Belum ada bracket.</p>
          <p className="text-sm">Mulai cup untuk generate bracket.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-8 min-w-max px-4">
            {roundKeys.map((round) => (
              <div key={round} className="flex flex-col gap-4 justify-center">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
                  {roundNames[parseInt(round)] || `Ronde ${round}`}
                </div>
                {rounds[round].map((match) => {
                  const isBye = match.status === "bye";
                  const isFinished = match.status === "finished";
                  const isReady = match.status === "ready";
                  const p1Winner = isFinished && match.winner_id === match.player1_id;
                  const p2Winner = isFinished && match.winner_id === match.player2_id;

                  return (
                    <div key={match.id} className="relative">
                      <Card
                        className={cn(
                          "w-56 transition-all hover:shadow-sm border border-[var(--color-border)] rounded-xl shadow-sm",
                          isReady && "bg-blue-50"
                        )}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Player 1 */}
                          <div className={cn(
                            "flex items-center justify-between text-sm",
                            p1Winner ? "font-bold text-foreground" : "text-muted-foreground",
                            isBye && !match.player1_id && "text-muted-foreground"
                          )}>
                            <span className="truncate">{match.player1_name || "TBD"}</span>
                          </div>
                          {/* Score */}
                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{match.player1_score || 0}</span>
                            <span>—</span>
                            <span className="font-mono">{match.player2_score || 0}</span>
                          </div>
                          {/* Player 2 */}
                          <div className={cn(
                            "flex items-center justify-between text-sm",
                            p2Winner ? "font-bold text-foreground" : "text-muted-foreground",
                            isBye && !match.player2_id && "text-muted-foreground"
                          )}>
                            <span className="truncate">{match.player2_name || "TBD"}</span>
                          </div>
                          {/* Room code + spectator */}
                          {match.room_id ? (
                            <div className="flex justify-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono border border-[var(--color-border)] shadow-sm">
                                Room: {match.room_id}
                              </Badge>
                              <Link
                                to={`/match/${match.room_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Spectator →
                              </Link>
                            </div>
                          ) : (
                            adminMode && match.status !== "bye" && (
                              <div className="flex justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] text-amber-600 hover:text-amber-700 px-2"
                                  disabled={creatingRoom[match.id]}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateRoom(match.id);
                                  }}
                                >
                                  {creatingRoom[match.id] ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Swords className="h-3 w-3 mr-1" />
                                  )}
                                  Buat Room
                                </Button>
                              </div>
                            )
                          )}
                          {/* Status */}
                          <div className="flex justify-center">
                            <Badge className={cn("text-[10px] px-1.5 py-0", statusBadge[match.status] || "")}>
                              {match.status === "bye" ? "BYE" : match.status}
                            </Badge>
                          </div>
                          {/* Admin result input */}
                          {adminMode && (match.status === "ready" || match.status === "playing") && match.player1_id && match.player2_id && (
                            <div className="flex justify-center pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-blue-600 hover:text-blue-700 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openResultDialog(match);
                                }}
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Input Hasil
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      {/* Connector lines to next round */}
                      {parseInt(round) < Math.max(...roundKeys.map(Number)) && (
                        <div className="absolute top-1/2 -right-8 w-8 h-px bg-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register Dialog */}
      <Dialog open={registerOpen} onOpenChange={(open) => {
        setRegisterOpen(open);
        if (!open) {
          setSearch("");
          setSelectedUids([]);
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col border border-[var(--color-border)] shadow-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Daftarkan Peserta ke Cup</DialogTitle>
            <DialogDescription>Pilih peserta dari daftar yang terdaftar.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 flex-1 min-h-0 flex flex-col">
            {/* Search */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau UID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border border-[var(--color-border)] shadow-sm rounded-xl"
              />
            </div>

            {/* Selected chips */}
            {selectedUids.length > 0 && (
              <div className="shrink-0 flex flex-wrap gap-1.5">
                {selectedUids.map((uid) => {
                  const p = allParticipants.find((x) => x.uid === uid);
                  return (
                    <Badge
                      key={uid}
                      variant="secondary"
                      className="cursor-pointer gap-1 pr-1.5 border border-[var(--color-border)] shadow-sm"
                      onClick={() => removeUid(uid)}
                    >
                      {p?.name || uid}
                      <X className="h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Participant list */}
            <div className="flex-1 min-h-0 overflow-y-auto border border-[var(--color-border)] rounded-xl bg-white shadow-sm">
              {loadingParticipants ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {allParticipants.length === 0
                    ? "Belum ada peserta terdaftar."
                    : "Tidak ada peserta yang cocok."}
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {filtered.map((p) => {
                    const checked = selectedUids.includes(p.uid);
                    return (
                      <label
                        key={p.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors",
                          checked && "bg-blue-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border border-[var(--color-border)] text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={() => toggleUid(p.uid)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.uid}</p>
                        </div>
                        {checked && <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex gap-2 pt-1">
              <Button
                onClick={handleRegister}
                disabled={registering || selectedUids.length === 0}
                className="flex-1"
              >
                {registering ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Daftarkan{selectedUids.length > 0 ? ` (${selectedUids.length})` : ""}
              </Button>
              <Button variant="outline" onClick={() => setRegisterOpen(false)}>Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultOpen} onOpenChange={(open) => {
        setResultOpen(open);
        if (!open) setResultMatch(null);
      }}>
        <DialogContent className="sm:max-w-sm border border-[var(--color-border)] shadow-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Input Hasil Pertandingan</DialogTitle>
            <DialogDescription>
              {resultMatch?.player1_name} vs {resultMatch?.player2_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Skor {resultMatch?.player1_name}</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={p1Score}
                  onChange={(e) => setP1Score(e.target.value)}
                  placeholder="0"
                  className="border border-[var(--color-border)] shadow-sm rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Skor {resultMatch?.player2_name}</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={p2Score}
                  onChange={(e) => setP2Score(e.target.value)}
                  placeholder="0"
                  className="border border-[var(--color-border)] shadow-sm rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Pemenang</label>
              <div className="mt-1.5 space-y-2">
                {resultMatch?.player1_id && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="winner"
                      value={String(resultMatch.player1_id)}
                      checked={winnerId === String(resultMatch.player1_id)}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-foreground">{resultMatch.player1_name}</span>
                  </label>
                )}
                {resultMatch?.player2_id && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="winner"
                      value={String(resultMatch.player2_id)}
                      checked={winnerId === String(resultMatch.player2_id)}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-foreground">{resultMatch.player2_name}</span>
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSubmitResult}
                disabled={submittingResult}
                className="flex-1"
              >
                {submittingResult ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Edit3 className="h-4 w-4 mr-2" />
                )}
                Simpan Hasil
              </Button>
              <Button variant="outline" onClick={() => setResultOpen(false)}>Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
