import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBanner({ isOnline }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-border shadow-sm",
        isOnline
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          Server Connected
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Server tidak terjangkau. Data mungkin tidak update.
        </>
      )}
    </div>
  );
}
