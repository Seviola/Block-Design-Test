import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAdminMode } from "@/contexts/AdminModeContext";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Trash2,
  Play,
  Swords,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export function Tournaments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { adminMode } = useAdminMode();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("8");
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => api.get("/tournaments"),
    refetchInterval: 5000,
  });

  const tournaments = data?.data || [];

  async function handleCreate() {
    if (!newName.trim()) { toast.error("Nama cup wajib diisi"); return; }
    setCreating(true);
    try {
      await api.post("/tournaments", {
        name: newName.trim(),
        max_players: parseInt(newMax),
      });
      toast.success("Cup berhasil dibuat!");
      setNewName("");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    } catch {
      toast.error("Gagal membuat cup.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Yakin hapus cup ini?")) return;
    try {
      await api.delete(`/tournaments/${id}`);
      toast.success("Cup dihapus.");
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    } catch {
      toast.error("Gagal menghapus cup.");
    }
  }

  const statusColor = {
    registration: "bg-blue-100 text-blue-700 border border-[var(--color-border)] shadow-sm",
    ready: "bg-amber-100 text-amber-700 border border-[var(--color-border)] shadow-sm",
    in_progress: "bg-green-100 text-green-700 border border-[var(--color-border)] shadow-sm",
    finished: "bg-muted text-muted-foreground border border-[var(--color-border)] shadow-sm",
  };

  const statusLabel = {
    registration: "Pendaftaran",
    ready: "Siap",
    in_progress: "Berlangsung",
    finished: "Selesai",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Turnamen Cup</h1>
          <p className="text-sm text-muted-foreground">Kelola single-elimination cup</p>
        </div>
        {adminMode && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Cup Baru
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p>Belum ada cup.</p>
          <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
            Buat Cup Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-sm transition-all border border-[var(--color-border)] shadow-sm rounded-xl"
              onClick={() => navigate(`/tournament/${t.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-bold text-foreground">{t.name}</CardTitle>
                  <Badge className={statusColor[t.status] || ""}>
                    {statusLabel[t.status] || t.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {t.player_count}/{t.max_players}
                  </span>
                  <span className="flex items-center gap-1">
                    <Swords className="h-3.5 w-3.5" />
                    Ronde {t.current_round || 0}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tournament/${t.id}`);
                    }}
                  >
                    Lihat Bracket <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  {adminMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(t.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md border border-[var(--color-border)] shadow-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Buat Cup Baru
            </DialogTitle>
            <DialogDescription>Single elimination. Peserta main bergantian di 2 PC.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-bold text-foreground">Nama Cup</label>
              <Input
                placeholder="Contoh: Cup Putaran 1"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-foreground">Max Peserta</label>
              <Input
                type="number"
                min={2}
                max={64}
                value={newMax}
                onChange={(e) => setNewMax(e.target.value)}
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">Gunakan kelipatan 2 untuk bracket rapi (2, 4, 8, 16, 32)</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Buat
              </Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
