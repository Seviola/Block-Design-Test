import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  Lock,
  CreditCard,
  ArrowLeft,
  Sparkles,
  Bot,
} from "lucide-react";

export function Paywall() {
  const { uid } = useParams();
  const [paid, setPaid] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Inject Midtrans Snap (once globally)
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

  const { data: participant, isLoading, isError } = useQuery({
    queryKey: ["participant", uid],
    queryFn: () => api.get(`/participants/uid/${uid}`),
    select: (res) => res.data,
    retry: false,
  });

  // Check if already premium
  useEffect(() => {
    if (participant?.is_premium) setPaid(true);
  }, [participant]);

  async function handlePay() {
    setProcessing(true);
    try {
      const checkoutRes = await api.post(`/payment/checkout/${uid}`);
      if (checkoutRes.status !== "success") throw new Error("Checkout failed");

      const snapToken = checkoutRes.data?.token;
      const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

      if (clientKey && snapToken && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess() {
            setPaid(true);
            toast.success("✅ Pembayaran berhasil!");
          },
          onPending() {
            toast.info("⏳ Pembayaran pending.");
          },
          onError() {
            toast.error("❌ Pembayaran gagal.");
          },
        });
      } else {
        // Fallback: simulate
        await api.post(`/payment/simulate-success/${uid}`);
        setPaid(true);
        toast.success("✅ Pembayaran berhasil!");
      }
    } catch {
      toast.error("❌ Gagal memproses pembayaran.");
    } finally {
      setProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !participant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Peserta tidak ditemukan.</p>
        <Button asChild variant="outline">
          <Link to="/register"><ArrowLeft className="h-4 w-4 mr-2" />Kembali</Link>
        </Button>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-6">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-green-700 dark:text-green-400">
            ✅ LUNAS
          </h1>
          <p className="text-lg font-medium">Silakan main robot!</p>
          <p className="text-sm text-muted-foreground">
            {participant.name} — UID: {participant.uid}
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <Link to="/">🏆 Ke Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/analytics/${uid}`}>📊 Lihat Profil</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
        <CardHeader className="text-center pb-2">
          <div className="mx-auto rounded-full bg-purple-100 dark:bg-purple-900 p-4 mb-3">
            <Lock className="h-10 w-10 text-purple-500" />
          </div>
          <CardTitle className="text-xl">ID untuk bermain Block Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Participant info */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-1 text-center">
            <p className="font-semibold">{participant.name}</p>
            <p className="text-sm text-muted-foreground">UID: {participant.uid}</p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Bot className="h-4 w-4 text-purple-500 shrink-0" />
              <span>Main robot + track skor real-time</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
              <span>AI Health Analysis penuh</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-purple-500 shrink-0" />
              <span>Rapor digital premium</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-center py-3 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-muted-foreground">UID: {participant.uid}</p>
          </div>

          {/* Pay button */}
          {/* <Button
            onClick={handlePay}
            disabled={processing}
            className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold text-lg py-6 shadow-lg"
          > */}
            {/* {processing ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Memproses...</>
            ) : (
              <><CreditCard className="h-5 w-5 mr-2" />Bayar Sekarang</>
            )} */}
          {/* </Button> */}

          {/* Test button */}
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              setProcessing(true);
              try {
                await api.post(`/payment/simulate-success/${uid}`);
                setPaid(true);
                toast.success("✅ Simulasi lunas berhasil!");
              } catch {
                toast.error("❌ Gagal simulasi lunas.");
              } finally {
                setProcessing(false);
              }
            }}
            disabled={processing}
            className="w-full text-xs text-muted-foreground"
          >
            ⚙️ [TEST] Simulasi Lunas
          </Button> */}

          {/* Back */}
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/register"><ArrowLeft className="h-4 w-4 mr-1" />Kembali ke Registrasi</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
