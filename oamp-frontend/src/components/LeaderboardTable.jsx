import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Medal, ChevronUp, ChevronDown, Minus } from "lucide-react";

const rankConfig = {
  1: {
    bg: "bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-950/30 dark:via-amber-950/30",
    border: "border-l-4 border-l-yellow-400",
    badge: "bg-yellow-400 text-yellow-900",
    gradient: "from-yellow-400 to-amber-500",
  },
  2: {
    bg: "bg-gradient-to-r from-[#f3f4f6] via-gray-50 to-[#f3f4f6] dark:from-gray-800 dark:via-gray-800",
    border: "border-l-4 border-l-border",
    badge: "bg-[#d1d5db] text-foreground",
    gradient: "from-[#d1d5db] to-[#9ca3af]",
  },
  3: {
    bg: "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/30 dark:via-amber-950/30",
    border: "border-l-4 border-l-orange-400",
    badge: "bg-orange-300 text-orange-900",
    gradient: "from-orange-300 to-orange-400",
  },
};

function getScoreDisplay(row) {
  const s = row.score ?? null;
  return s != null ? Math.round(s) : null;
}

function getPointDiff(row, data, index) {
  if (index === 0) return null;
  const currentScore = getScoreDisplay(row);
  const prevScore = getScoreDisplay(data[index - 1]);
  if (currentScore == null || prevScore == null) return null;
  return currentScore - prevScore;
}

export function LeaderboardTable({ data, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4 animate-float">🎮</div>
        <p className="text-lg font-bold" style={{ fontFamily: '"Fredoka", sans-serif' }}>
          Yuk Mulai Main!
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Belum ada peserta yang main. Ayo daftar dan mulai permainan!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Podium — Top 3 */}
      {data.length >= 1 && (
        <div className="flex items-end justify-center gap-3 py-8 px-4">
          {data[1] && (
            <PodiumSlot
              rank={2}
              name={data[1].name}
              grade={data[1].grade}
              score={getScoreDisplay(data[1])}
              height="h-24"
              onClick={() => navigate(`/analytics/${data[1].uid || data[1].participant_id}`)}
            />
          )}
          {data[0] && (
            <PodiumSlot
              rank={1}
              name={data[0].name}
              grade={data[0].grade}
              score={getScoreDisplay(data[0])}
              height="h-36"
              onClick={() => navigate(`/analytics/${data[0].uid || data[0].participant_id}`)}
            />
          )}
          {data[2] && (
            <PodiumSlot
              rank={3}
              name={data[2].name}
              grade={data[2].grade}
              score={getScoreDisplay(data[2])}
              height="h-20"
              onClick={() => navigate(`/analytics/${data[2].uid || data[2].participant_id}`)}
            />
          )}
        </div>
      )}

      {/* Full table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16 text-center">#</TableHead>
            <TableHead>Pemain</TableHead>
            <TableHead className="text-center">Kelas</TableHead>
            <TableHead className="text-center">Skor</TableHead>
            <TableHead className="text-center">Selisih</TableHead>
            <TableHead className="text-center">Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const config = rankConfig[row.rank];
            const score = getScoreDisplay(row);
            const diff = getPointDiff(row, data, index);

            return (
              <TableRow
                key={row.participant_id || row.uid || index}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-[1.005] group",
                  config ? `${config.bg} ${config.border}` : "hover:bg-accent/30"
                )}
                onClick={() =>
                  navigate(`/analytics/${row.uid || row.participant_id}`)
                }
              >
                <TableCell className="text-center">
                  {row.rank === 1 ? (
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold">
                      1
                    </span>
                  ) : row.rank === 2 ? (
                    <Medal className="h-5 w-5 text-muted-foreground mx-auto" />
                  ) : row.rank === 3 ? (
                    <Medal className="h-5 w-5 text-orange-400 mx-auto" />
                  ) : (
                    <span className="text-muted-foreground font-bold text-sm">#{row.rank}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm",
                        row.rank === 1
                          ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                          : row.rank === 2
                          ? "bg-gradient-to-br from-[#d1d5db] to-[#9ca3af] text-foreground"
                          : row.rank === 3
                          ? "bg-gradient-to-br from-orange-300 to-orange-400 text-white"
                          : "bg-gradient-to-br from-violet-400 to-purple-500 text-white"
                      )}
                    >
                      {row.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">
                        {row.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{row.age} th</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-bold text-xs rounded-xl border border-border shadow-sm">
                    {row.grade}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "font-black text-base tabular-nums",
                    row.rank <= 3 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {score != null ? score : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {diff != null ? (
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-bold",
                      diff < 0 ? "text-red-500" : diff === 0 ? "text-muted-foreground" : "text-emerald-500"
                    )}>
                      {diff < 0 ? <ChevronDown className="h-3 w-3" /> : diff > 0 ? <ChevronUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {Math.abs(diff)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs font-bold">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.level_reached != null ? (
                    <span className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-muted text-sm font-bold">
                      {row.level_reached}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PodiumSlot({ rank, name, grade, score, height, onClick }) {
  const colors = {
    1: {
      bg: "from-yellow-400 via-amber-400 to-orange-400",
      text: "text-yellow-900",
    },
    2: {
      bg: "from-[#d1d5db] via-[#9ca3af] to-[#6b7280]",
      text: "text-foreground",
    },
    3: {
      bg: "from-orange-300 via-orange-350 to-orange-400",
      text: "text-orange-900",
    },
  };

  const c = colors[rank];

  return (
    <div
      className="flex flex-col items-center cursor-pointer group animate-slide-up"
      onClick={onClick}
      style={{ animationDelay: `${rank * 100}ms` }}
    >
      <div className="relative">
        <div
          className={cn(
            "h-16 w-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl font-bold text-white shadow-sm group-hover:scale-110 transition-all duration-300",
            c.bg
          )}
        >
          {name?.charAt(0)?.toUpperCase()}
        </div>
      </div>
      <p className="font-bold text-sm mt-2.5 text-center group-hover:text-primary transition-colors">
        {name}
      </p>
      <Badge variant="outline" className="text-[10px] mt-0.5 rounded-xl border border-border shadow-sm">{grade}</Badge>
      <div
        className={cn(
          "w-32 mt-3 rounded-t-xl bg-gradient-to-t flex flex-col items-center justify-start pt-4 pb-3 shadow-sm",
          c.bg,
          height
        )}
      >
        <span className={cn("text-3xl font-black tabular-nums", c.text)}>
          {score ?? "—"}
        </span>
        <span className={cn("text-xs font-bold opacity-70", c.text)}>
          pts
        </span>
      </div>
    </div>
  );
}
