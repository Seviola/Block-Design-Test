import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "@/lib/axios";
import { ParticipantCard } from "@/components/ParticipantCard";
import { SessionBarChart } from "@/components/SessionBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  FileText,
  Trophy,
  Sparkles,
  WifiOff,
  Lock,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Analytics() {
  const { uid } = useParams();
  const [downloadingRapor, setDownloadingRapor] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [aiPaymentRequired, setAiPaymentRequired] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src*="snap.js"]')) return;
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (!clientKey) return;
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.body.appendChild(script);
  }, []);

  async function handleDownloadRapor() {
    setDownloadingRapor(true);
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
      toast.error("Gagal mengunduh rapor. Server tidak tersedia.");
    } finally {
      setDownloadingRapor(false);
    }
  }

  async function handleGenerateAI() {
    setAiLoading(true);
    setAiError(false);
    setAiAnalysis(null);
    setAiPaymentRequired(false);

    try {
      const res = await api.get(`/participants/analysis/${uid}`, { timeout: 60000 });

      if (res.status === "success") {
        setAiAnalysis(res.data?.analysis || "");
        setAiPaymentRequired(false);
        toast.success("Analisis AI berhasil dibuat!");
      } else if (res.status === "fallback") {
        setAiAnalysis(res.data?.analysis || "");
        setAiPaymentRequired(false);
        toast.warning("AI sedang sibuk. Menampilkan pesan fallback.");
      } else if (res.status === "payment_required") {
        setAiPaymentRequired(true);
        toast.info("Hasil analisis terkunci. Selesaikan pembayaran untuk membuka.");
      } else {
        throw new Error("Invalid response status");
      }
    } catch {
      setAiError(true);
      toast.error("Gagal terhubung ke server.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePaymentSuccess() {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    setProcessingPayment(true);
    setPaymentModalOpen(false);

    try {
      const checkoutRes = await api.post(`/payment/checkout/${uid}`);
      if (checkoutRes.status !== "success") {
        throw new Error("Checkout failed");
      }
      const snapToken = checkoutRes.data?.token;
      if (!snapToken) {
        throw new Error("No token returned");
      }

      if (clientKey && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess(_result) {
            toast.success("Pembayaran berhasil! Mengambil hasil analisis...");
            setAiPaymentRequired(false);
            setAiLoading(true);
            setAiError(false);
            api.get(`/participants/analysis/${uid}`, { timeout: 60000 })
              .then((res) => {
                if (res.status === "success") {
                  setAiAnalysis(res.data?.analysis || "");
                  toast.success("Analisis AI berhasil dibuka!");
                } else if (res.status === "fallback") {
                  setAiAnalysis(res.data?.analysis || "");
                } else {
                  throw new Error("Invalid response status");
                }
              })
              .catch(() => {
                setAiError(true);
                toast.error("Gagal mengambil hasil analisis.");
              })
              .finally(() => setAiLoading(false));
          },
          onPending(_result) {
            toast.info("Pembayaran pending. Selesaikan pembayaran untuk membuka hasil.");
          },
          onError(_result) {
            toast.error("Pembayaran gagal. Silakan coba lagi.");
          },
        });
      } else {
        const transactionId = checkoutRes.data?.transaction_id;
        await api.post(`/payment/simulate-success/${uid}`, { transaction_id: transactionId });
        toast.success("Pembayaran berhasil! Mengambil hasil analisis...");
        setAiPaymentRequired(false);
        setAiLoading(true);
        setAiError(false);
        const res = await api.get(`/participants/analysis/${uid}`, { timeout: 60000 });
        if (res.status === "success") {
          setAiAnalysis(res.data?.analysis || "");
          toast.success("Analisis AI berhasil dibuka!");
        } else if (res.status === "fallback") {
          setAiAnalysis(res.data?.analysis || "");
        } else {
          throw new Error("Invalid response status");
        }
      }
    } catch {
      toast.error("Pembayaran gagal. Coba lagi.");
    } finally {
      setProcessingPayment(false);
    }
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", uid],
    queryFn: async () => {
      const [participantRes, sessionsRes, resultsRes] = await Promise.all([
        api.get(`/participants/uid/${uid}`),
        api.get(`/participants/uid/${uid}/sessions`),
        api.get(`/participants/uid/${uid}/results`).catch(() => ({ data: null })),
      ]);
      return { participant: participantRes.data, sessions: sessionsRes.data || [], gameResult: resultsRes.data || null };
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading participant data...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Peserta tidak ditemukan</h2>
        <p className="text-muted-foreground">UID &quot;{uid}&quot; tidak terdaftar di sistem.</p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const { participant, sessions, gameResult } = data;
  const totalSessions = sessions?.length || 0;
  const tasks = gameResult ? [
    gameResult.task01, gameResult.task02, gameResult.task03, gameResult.task04,
    gameResult.task05, gameResult.task06, gameResult.task07, gameResult.task08,
  ] : [];
  const hasTasks = tasks.some(t => t > 0);
  const cognitiveAge = gameResult?.cognitive_age;
  const variants = gameResult?.variant_list || [];

  function getSessionScore(s) {
    if (s.score != null) return s.score;
    // Fallback: level_reached × 1000 - total_time × 10
    if (s.level_reached != null) {
      return Math.max(0, Math.round(s.level_reached * 1000 - (s.total_time || 0) * 10));
    }
    return null;
  }

  const bestScore =
    totalSessions > 0
      ? Math.max(...sessions.map(getSessionScore).filter((v) => v != null))
      : null;
  const avgTime =
    totalSessions > 0
      ? (sessions.reduce((a, s) => a + (s.total_time || 0), 0) / totalSessions).toFixed(1)
      : null;
  const maxLevel =
    totalSessions > 0
      ? Math.max(...sessions.map((s) => s.level_reached ?? 0))
      : null;
  const totalScore =
    totalSessions > 0
      ? sessions.reduce((a, s) => a + (getSessionScore(s) || 0), 0)
      : null;

  const isPremium = participant?.is_premium || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Detail Peserta</h1>
            <p className="text-sm text-muted-foreground">Data performa dan hasil assessment</p>
          </div>
        </div>
        <Button
          onClick={handleDownloadRapor}
          disabled={downloadingRapor}
          variant="outline"
        >
          {downloadingRapor ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Download Rapor
            </>
          )}
        </Button>
      </div>

      {/* Premium gate banner */}
      {!isPremium && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><Lock className="h-4 w-4" />Data peserta terkunci. Bayar untuk membuka akses penuh.</span>
          <Button size="sm" asChild>
            <Link to={`/paywall/${uid}`}><CreditCard className="h-3.5 w-3.5 mr-1" />Bayar Rp 10.000</Link>
          </Button>
        </div>
      )}

      {/* Profile card */}
      <ParticipantCard participant={participant} sessions={sessions} />

      {/* Session summary cards */}
      {totalSessions > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <PremiumLock locked={!isPremium}>
            <MiniStat
              icon={<Trophy className="h-5 w-5" />}
              label="Best Score"
              value={bestScore != null ? Math.round(bestScore) : "N/A"}
              accent="amber"
            />
          </PremiumLock>
          <PremiumLock locked={!isPremium}>
            <MiniStat
              icon={<Trophy className="h-5 w-5" />}
              label="Total Points"
              value={totalScore != null ? Math.round(totalScore) : "N/A"}
              accent="yellow"
            />
          </PremiumLock>
          <PremiumLock locked={!isPremium}>
            <MiniStat
              icon={<TrendingUp className="h-5 w-5" />}
              label="Max Level"
              value={maxLevel ?? "N/A"}
              accent="green"
            />
          </PremiumLock>
          <PremiumLock locked={!isPremium}>
            <MiniStat
              icon={<Clock className="h-5 w-5" />}
              label="Avg Time"
              value={avgTime ? `${avgTime}s` : "N/A"}
              accent="blue"
            />
          </PremiumLock>
          <MiniStat
            icon={<Zap className="h-5 w-5" />}
            label="Sessions"
            value={totalSessions}
            accent="purple"
          />
        </div>
      )}

      {/* Per-level times + Cognitive Age + Variant — from game_results */}
      {gameResult && hasTasks && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="bg-muted border-b border-border py-4">
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <Zap className="h-5 w-5 text-blue-600" />
              Detail Performa
            </CardTitle>
          </CardHeader>
          <CardContent className="py-5 space-y-5">
            {/* Cognitive Age card */}
            {cognitiveAge > 0 && (
              <div className="rounded-xl bg-gradient-to-r from-red-50 to-white dark:from-red-950/30 dark:to-card border border-border p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usia Kognitif</p>
                    <p className="text-2xl font-black text-foreground">{cognitiveAge} th</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    (Aktual: {participant.age} th
                    <span className={cn("ml-1 font-bold", cognitiveAge > participant.age ? "text-amber-600" : "text-green-600")}>
                      {cognitiveAge > participant.age ? `+${cognitiveAge - participant.age}` : cognitiveAge < participant.age ? `-${participant.age - cognitiveAge}` : ""}
                    </span>
                    )
                  </div>
                </div>
              </div>
            )}

            {/* Per-level breakdown */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Waktu per Level</p>
              <div className="grid grid-cols-4 gap-2">
                {tasks.map((t, i) => (
                  <div key={i} className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">L{i + 1}</div>
                    <div className="text-sm font-black tabular-nums text-foreground">{t.toFixed(2)}s</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Variant list */}
            {variants.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Varian Level</p>
                <div className="flex gap-1.5 flex-wrap">
                  {variants.map((v, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs">
                      {i + 1}: {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Health Consultant Card */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted border-b border-border py-4">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Health Consultant
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          {!aiAnalysis && !aiLoading && !aiError && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="rounded-full bg-blue-50 p-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Dapatkan analisis kesehatan bertenaga AI</p>
                <p className="text-sm text-muted-foreground mt-1">AI akan menganalisis data performa peserta untuk memberikan rekomendasi kesehatan kognitif.</p>
              </div>
              <Button onClick={handleGenerateAI}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Health Analysis
              </Button>
            </div>
          )}

          {aiLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">AI sedang menganalisis data peserta...</p>
              <div className="w-full max-w-md space-y-2">
                <div className="h-3 w-full bg-muted/60 rounded-full animate-pulse" />
                <div className="h-3 w-5/6 bg-muted/60 rounded-full animate-pulse" />
                <div className="h-3 w-4/6 bg-muted/60 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {aiPaymentRequired && !aiLoading && (
            <div className="relative flex flex-col items-center justify-center py-10 gap-4">
              <div className="absolute inset-0 flex flex-col gap-3 px-6 opacity-30 pointer-events-none select-none blur-[2px]">
                <div className="h-4 w-full bg-slate-300 rounded" />
                <div className="h-4 w-5/6 bg-slate-300 rounded" />
                <div className="h-4 w-4/6 bg-slate-300 rounded" />
                <div className="h-4 w-full bg-slate-300 rounded" />
                <div className="h-4 w-3/4 bg-slate-300 rounded" />
              </div>
              <div className="relative flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-amber-100 p-5">
                  <Lock className="h-10 w-10 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">Analisis Premium</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">Hasil lengkap AI Health Consultant hanya tersedia untuk pengguna premium.</p>
                </div>
                <Button onClick={() => setPaymentModalOpen(true)} className="font-semibold px-6">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buka Rapor AI Premium — Rp 50.000
                </Button>
                <p className="text-xs text-muted-foreground">Pembayaran aman via QRIS — Proses instant</p>
              </div>
            </div>
          )}

          {aiError && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="rounded-full bg-muted p-4">
                <WifiOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">AI Consultant sedang offline</p>
                <p className="text-sm text-muted-foreground mt-1">Koneksi ke server AI terputus, namun data profil dan skor tetap aman.</p>
              </div>
              <Button variant="outline" onClick={handleGenerateAI} className="mt-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          )}

          {aiAnalysis && !aiLoading && !aiError && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-6 prose prose-sm prose-slate max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children, ...props }) => {
                      const safe = href && !href.startsWith("javascript:");
                      return safe
                        ? <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
                        : <span className="text-red-400">{children}</span>;
                    },
                  }}
                >
                  {aiAnalysis}
                </ReactMarkdown>
              </div>
              <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
                Hasil ini di-generate oleh AI untuk tujuan edukasi dan skrining awal, bukan sebagai diagnosis medis pengganti dokter.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session table */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted border-b border-border py-4">
          <CardTitle className="flex items-center justify-between text-foreground text-base">
            <span>Riwayat Sesi</span>
            <Badge variant="secondary">{totalSessions} sesi</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {totalSessions === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-foreground">Belum ada sesi dimainkan.</p>
              <p className="text-sm">Data sesi akan muncul setelah peserta bermain.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-xs uppercase text-muted-foreground">#</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Mode</TableHead>
                    <TableHead className="text-center text-xs uppercase text-muted-foreground">Level</TableHead>
                    <TableHead className="text-center text-xs uppercase text-muted-foreground">Skor</TableHead>
                    <TableHead className="text-center text-xs uppercase text-muted-foreground">Waktu</TableHead>
                    <TableHead className="text-center text-xs uppercase text-muted-foreground">Ketangkasan</TableHead>
                    <TableHead className="text-center text-xs uppercase text-muted-foreground">Umur Kognitif</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s, i) => {
                    const score = getSessionScore(s);
                    const isBest = bestScore != null && score === bestScore;
                    const isMaxLevel = maxLevel != null && s.level_reached === maxLevel;

                    return (
                      <TableRow key={s.id} className="group">
                        <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <Badge
                            variant={s.mode === "normal" ? "secondary" : "outline"}
                            className="capitalize text-xs"
                          >
                            {s.mode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full w-8 h-8 text-sm font-bold",
                              isMaxLevel
                                ? "bg-green-100 text-green-700"
                                : "bg-muted text-foreground"
                            )}
                          >
                            {s.level_reached}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("font-bold text-base tabular-nums", isBest ? "text-amber-600" : "text-foreground")}>
                            {score != null ? Math.round(score) : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {s.total_time?.toFixed(1)}s
                        </TableCell>
                        <TableCell className="text-center font-mono text-foreground">
                          {s.dexterity_score?.toFixed(1) ?? "—"}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {s.cognitive_age ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(s.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score chart */}
      {totalSessions > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="bg-muted border-b border-border py-4">
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <TrendingUp className="h-5 w-5" />
              Score Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SessionBarChart sessions={sessions} />
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-600" />
              Pembayaran OAMP Premium
            </DialogTitle>
            <DialogDescription>
              Scan QRIS berikut untuk menyelesaikan pembayaran sebesar{" "}
              <strong>Rp 50.000</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-48 h-48 border border-dashed border-border rounded-xl flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-xs text-muted-foreground font-medium">QRIS DUMMY</p>
                <p className="text-[10px] text-muted-foreground mt-1">Gopay • OVO • Dana • Shopeepay</p>
              </div>
            </div>

            <div className="w-full text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">Total: Rp 50.000</p>
              <p className="text-xs text-muted-foreground">Pembayaran aman &amp; instant via QRIS</p>
            </div>

            <div className="w-full border-t border-border pt-4 space-y-2">
              <Button
                onClick={handlePaymentSuccess}
                disabled={processingPayment}
                className="w-full font-semibold"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Konfirmasi Pembayaran
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPaymentModalOpen(false)}
                disabled={processingPayment}
                className="w-full"
              >
                Batal
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handlePaymentSuccess}
              disabled={processingPayment}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              [TEST] Simulasikan Bayar Sukses
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const accentStyles = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
};

function MiniStat({ icon, label, value, accent }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-4", accentStyles[accent])}>
      <div className="rounded-md bg-white p-2">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function PremiumLock({ children, locked }) {
  if (!locked) return children;
  return (
    <div className="relative">
      <div className="opacity-20 pointer-events-none select-none blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-muted p-3 shadow-sm">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
