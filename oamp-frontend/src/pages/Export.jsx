import { useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Database, Send, Download, Loader2 } from "lucide-react";

export function Export() {
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingFull, setDownloadingFull] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);

  async function downloadExcel() {
    setDownloadingExcel(true);
    try {
      const res = await api.get("/export/excel", { responseType: "blob" });
      const url = window.URL.createObjectURL(res);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "oamp-report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel report downloaded!");
    } catch {
      toast.error("Gagal mengunduh file. Server tidak tersedia.");
    } finally {
      setDownloadingExcel(false);
    }
  }

  async function downloadPdf() {
    setDownloadingPdf(true);
    try {
      const res = await api.get("/export/pdf", { responseType: "blob" });
      const url = window.URL.createObjectURL(res);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "oamp-leaderboard.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF report downloaded!");
    } catch {
      toast.error("Gagal mengunduh file. Server tidak tersedia.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function downloadFullData() {
    setDownloadingFull(true);
    try {
      const res = await api.get("/export/csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(res);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "oamp-full-export.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Full data export downloaded!");
    } catch {
      toast.error("Gagal mengunduh file. Server tidak tersedia.");
    } finally {
      setDownloadingFull(false);
    }
  }

  async function sendToTelegram() {
    setSendingTelegram(true);
    try {
      await api.post("/export/telegram");
      toast.success("Export dikirim ke Telegram!");
    } catch {
      toast.error("Gagal mengirim ke Telegram.");
    } finally {
      setSendingTelegram(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Export & Download Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
              Download Excel Report
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Laporan lengkap — Leaderboard, Participants, Sessions, GameResults (4 sheet).
            </p>
            <Button onClick={downloadExcel} disabled={downloadingExcel} className="w-full" size="lg">
              {downloadingExcel ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Downloading...</> : <><Download className="h-4 w-4 mr-2" />Download .xlsx</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              Download PDF Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            <p className="text-sm text-muted-foreground">Tabel leaderboard dalam format PDF.</p>
            <Button onClick={downloadPdf} disabled={downloadingPdf} className="w-full" size="lg">
              {downloadingPdf ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Downloading...</> : <><Download className="h-4 w-4 mr-2" />Download .pdf</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Full Data Export
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Semua data mentah — GameResults (task01-task08, cognitive_age, variant_list) + Sessions.
            </p>
            <Button onClick={downloadFullData} disabled={downloadingFull} className="w-full" size="lg">
              {downloadingFull ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Downloading...</> : <><Download className="h-4 w-4 mr-2" />Download Data .xlsx</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              Kirim ke Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Generate Excel dan kirim langsung ke Telegram (chat yang dikonfigurasi di server).
            </p>
            <Button onClick={sendToTelegram} disabled={sendingTelegram} className="w-full" size="lg" variant="secondary">
              {sendingTelegram ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengirim...</> : <><Send className="h-4 w-4 mr-2" />Kirim ke Telegram</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
