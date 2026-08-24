import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Swords,
  Trophy,
  Gamepad2,
  Loader2,
  Radio,
  ChevronRight,
  Eye,
} from "lucide-react";

export function Admin() {
  const { data: participantsRes, isLoading: pLoading } = useQuery({
    queryKey: ["participants-admin"],
    queryFn: () => api.get("/participants"),
    refetchInterval: 5000,
  });

  const { data: roomsRes, isLoading: rLoading } = useQuery({
    queryKey: ["rooms-admin"],
    queryFn: () => api.get("/rooms"),
    refetchInterval: 3000,
  });

  const { data: tournamentsRes, isLoading: tLoading } = useQuery({
    queryKey: ["tournaments-admin"],
    queryFn: () => api.get("/tournaments"),
    refetchInterval: 5000,
  });

  const participants = participantsRes?.data || [];
  const rooms = roomsRes?.data?.data || roomsRes?.data || [];
  const tournaments = tournamentsRes?.data || [];

  const totalPlayers = participants.length;
  const premiumCount = participants.filter((p) => p.is_premium).length;
  const activeRooms = rooms.filter((r) => ["waiting", "ready", "playing"].includes(r.status));
  const activeTournaments = tournaments.filter((t) => t.status === "in_progress");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Event Control Center</h1>
        <p className="text-sm text-muted-foreground">Monitoring real-time — read only, tidak ada tombol hapus di sini.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Peserta" value={totalPlayers} color="blue" />
        <StatCard icon={<Trophy className="h-5 w-5" />} label="Premium" value={premiumCount} color="amber" />
        <StatCard icon={<Swords className="h-5 w-5" />} label="Room Aktif" value={activeRooms.length} color="rose" />
        <StatCard icon={<Gamepad2 className="h-5 w-5" />} label="Cup Berlangsung" value={activeTournaments.length} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rooms */}
        <Card className="border border-[var(--color-border)] shadow-sm rounded-xl">
          <CardHeader className="bg-muted border-b border-[var(--color-border)] py-4">
            <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
              <Radio className="h-4 w-4 text-rose-500" />
              Room Aktif ({activeRooms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Tidak ada room aktif.</div>
            ) : (
              <div className="divide-y">
                {activeRooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs border border-[var(--color-border)]">
                        {room.id}
                      </Badge>
                      <div className="text-sm">
                        <span className="font-bold text-foreground">{room.player1_name}</span>
                        <span className="text-muted-foreground mx-1.5">vs</span>
                        <span className="font-bold text-foreground">{room.player2_name || "…"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusBg(room.status)}>{room.status}</Badge>
                      <Link to={`/match/${room.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tournaments */}
        <Card className="border border-[var(--color-border)] shadow-sm rounded-xl">
          <CardHeader className="bg-muted border-b border-[var(--color-border)] py-4">
            <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Turnamen ({tournaments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Belum ada turnamen.</div>
            ) : (
              <div className="divide-y">
                {tournaments.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tournament/${t.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.player_count}/{t.max_players} peserta — Ronde {t.current_round || 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={tournamentStatusBg(t.status)}>{t.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent registrations */}
        <Card className="border border-[var(--color-border)] shadow-sm rounded-xl">
        <CardHeader className="bg-muted border-b border-[var(--color-border)] py-4">
          <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Peserta Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Belum ada peserta.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-4 py-2 text-left">Nama</th>
                    <th className="px-4 py-2 text-left">UID</th>
                    <th className="px-4 py-2 text-left">Kelas</th>
                    <th className="px-4 py-2 text-center">Premium</th>
                    <th className="px-4 py-2 text-right">Terdaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...participants]
                    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                    .slice(0, 8)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-muted transition-colors">
                        <td className="px-4 py-2.5 font-bold text-foreground">{p.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.uid}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{p.grade}</td>
                        <td className="px-4 py-2.5 text-center">
                          {p.is_premium ? (
                            <Badge className="bg-amber-100 text-amber-700 border border-[var(--color-border)] text-[10px]">Premium</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                          {p.created_at
                            ? new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-[var(--color-border)] shadow-sm p-4", colorMap[color])}>
      <div className="p-2 rounded-lg bg-white shadow-sm">{icon}</div>
      <div>
        <p className="text-xs font-bold opacity-70 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function statusBg(status) {
  switch (status) {
    case "waiting": return "bg-muted text-muted-foreground border border-[var(--color-border)]";
    case "ready": return "bg-blue-100 text-blue-700 border border-[var(--color-border)]";
    case "playing": return "bg-amber-100 text-amber-700 border border-[var(--color-border)]";
    default: return "bg-muted text-muted-foreground border border-[var(--color-border)]";
  }
}

function tournamentStatusBg(status) {
  switch (status) {
    case "registration": return "bg-muted text-muted-foreground border border-[var(--color-border)]";
    case "ready": return "bg-blue-100 text-blue-700 border border-[var(--color-border)]";
    case "in_progress": return "bg-amber-100 text-amber-700 border border-[var(--color-border)]";
    case "finished": return "bg-green-100 text-green-700 border border-[var(--color-border)]";
    default: return "bg-muted text-muted-foreground border border-[var(--color-border)]";
  }
}

// cn utility re-declare (since this file imports from lib/utils but let's inline to be safe)
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
