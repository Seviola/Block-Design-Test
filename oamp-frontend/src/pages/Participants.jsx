import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAdminMode } from "@/contexts/AdminModeContext";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  FileText,
  Loader2,
  ArrowUpDown,
  Trophy,
  Gamepad2,
  Eye,
  Filter,
  Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Participants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { adminMode } = useAdminMode();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [downloadingRapor, setDownloadingRapor] = useState({});
  const [deleting, setDeleting] = useState({});
  const [selectedBatch, setSelectedBatch] = useState("all");

  const { data: batchesRes } = useQuery({
    queryKey: ["batches"],
    queryFn: () => api.get("/batches"),
  });

  const allBatches = useMemo(() => batchesRes?.data || [], [batchesRes]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["participants", selectedBatch],
    staleTime: 0,
    queryFn: async () => {
      const params = selectedBatch !== "all" ? { params: { batch_id: selectedBatch } } : {};
      const res = await api.get("/participants/stats", params);
      return res.data;
    },
    select: (raw) => {
      if (!Array.isArray(raw)) return [];
      return raw.map((p) => ({
        id: p.participant_id || p.id,
        uid: p.uid,
        name: p.name,
        grade: p.grade,
        age: p.age,
        gender: p.gender || null,
        created_at: p.created_at || null,
        score: p.score ?? null,
        visuo_spatial_fit: p.visuo_spatial_fit ?? null,
        total_time: p.total_time ?? null,
        level_reached: p.level_reached ?? null,
        dexterity_score: p.dexterity_score ?? null,
      }));
    },
  });

  const participants = useMemo(() => data || [], [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = q
      ? participants.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.uid?.toLowerCase().includes(q) ||
            p.grade?.toLowerCase().includes(q)
        )
      : [...participants];

    const sorted = [...result].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [participants, search, sortField, sortDir]);

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  async function handleDownloadRapor(uid) {
    setDownloadingRapor((prev) => ({ ...prev, [uid]: true }));
    try {
      const res = await api.get(`/export/rapor/${uid}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rapor-${uid}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Rapor berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh rapor.");
    } finally {
      setDownloadingRapor((prev) => ({ ...prev, [uid]: false }));
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Hapus peserta "${name}" beserta semua sesi game-nya?`)) return;
    setDeleting((prev) => ({ ...prev, [id]: true }));
    try {
      await api.delete(`/participants/${id}`);
      toast.success(`Peserta "${name}" berhasil dihapus.`);
      queryClient.invalidateQueries({ queryKey: ["participants"] });
    } catch {
      toast.error("Gagal menghapus peserta.");
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }));
    }
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daftar Peserta</h1>
          <p className="text-sm text-muted-foreground">Peserta terdaftar dan hasil assessment</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1.5 gap-1.5 border border-[var(--color-border)]">
            <Users className="h-3.5 w-3.5" />
            {participants.length} peserta
          </Badge>

        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatMini
          icon={<Users className="h-4 w-4" />}
          label="Total"
          value={participants.length}
          color="blue"
        />
        <StatMini
          icon={<Trophy className="h-4 w-4" />}
          label="Skor Tertinggi"
          value={
            participants.length > 0
              ? Math.max(
                  ...participants.filter((p) => p.score != null).map((p) => Math.round(p.score))
                ) || "N/A"
              : "N/A"
          }
          color="amber"
        />
        <StatMini
          icon={<Gamepad2 className="h-4 w-4" />}
          label="Sudah Bermain"
          value={participants.filter((p) => p.score != null).length}
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, UID, atau kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border border-[var(--color-border)] shadow-sm rounded-xl"
          />
        </div>
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[200px] bg-white border border-[var(--color-border)] shadow-sm rounded-xl">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Semua Sesi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sesi</SelectItem>
            {allBatches.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
                {!b.is_active && " (arsip)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-[var(--color-border)] shadow-sm rounded-xl">
        <CardHeader className="bg-muted border-b border-[var(--color-border)] py-4">
          <CardTitle className="text-foreground text-base font-bold">Direktori Peserta</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-red-500 font-medium">Gagal memuat data peserta.</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p>Belum ada peserta terdaftar.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                Tidak ada peserta yang cocok dengan &quot;{search}&quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortTh field="name">Nama</SortTh>
                    <SortTh field="uid">UID</SortTh>
                    <SortTh field="grade">Kelas</SortTh>
                    <SortTh field="age" className="text-center">Usia</SortTh>
                    <TableHead className="text-center">Gender</TableHead>
                    <SortTh field="score" className="text-center">Skor</SortTh>
                    <SortTh field="level_reached" className="text-center">Level</SortTh>
                    <TableHead className="text-center">Aksi</TableHead>
                    <SortTh field="created_at">Terdaftar</SortTh>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer group transition-all hover:bg-muted"
                      onClick={() => navigate(`/analytics/${p.uid}`)}
                    >
                      <TableCell className="font-bold text-foreground group-hover:text-blue-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {p.name?.charAt(0)?.toUpperCase()}
                          </div>
                          {p.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                          {p.uid}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-xs border border-[var(--color-border)]">
                          {p.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{p.age}</TableCell>
                      <TableCell className="text-center capitalize text-muted-foreground">
                        {p.gender || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.score != null ? (
                          <span className="font-bold text-foreground">{Math.round(p.score)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.level_reached != null ? (
                          <span className="inline-flex items-center justify-center rounded-full w-7 h-7 bg-muted text-sm font-bold text-foreground">
                            {p.level_reached}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/analytics/${p.uid}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            disabled={downloadingRapor[p.uid]}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadRapor(p.uid);
                            }}
                          >
                            {downloadingRapor[p.uid] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                          {adminMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              disabled={deleting[p.id]}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id, p.name);
                              }}
                            >
                              {deleting[p.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  function SortTh({ field, children, className }) {
    return (
      <TableHead
        className={cn("cursor-pointer select-none hover:bg-muted text-muted-foreground text-xs uppercase tracking-wider", className)}
        onClick={() => toggleSort(field)}
      >
        <span className="flex items-center gap-1">
          {children}
          <ArrowUpDown
            className={cn(
              "h-3 w-3 transition-opacity",
              sortField === field ? "opacity-100 text-blue-600" : "opacity-30"
            )}
          />
        </span>
      </TableHead>
    );
  }
}

const statColors = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  green: "border-green-200 bg-green-50 text-green-700",
};

function StatMini({ icon, label, value, color }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-[var(--color-border)] shadow-sm p-4", statColors[color])}>
      <div className="p-2 rounded-lg bg-white shadow-sm">{icon}</div>
      <div>
        <p className="text-xs font-bold opacity-70 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
