import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
} from "recharts";

function SessionTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-sm text-sm space-y-1.5">
      <p className="font-bold text-foreground">Session {label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold" style={{ color: entry.color }}>
            {typeof entry.value === "number" ? entry.value : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function SessionBarChart({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada data sesi.
      </div>
    );
  }

  const chartData = sessions.map((s, i) => {
    const score = s.score ?? Math.max(0, Math.round(s.level_reached * 1000 - (s.total_time || 0) * 10));
    return {
      session: `#${i + 1}`,
      score,
      dexterity: Math.round((s.dexterity_score || 0) * 10) / 10,
      level: s.level_reached ?? 0,
    };
  });

  const maxScore = Math.max(...chartData.map((d) => d.score));

  return (
    <div className="space-y-4">
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} barGap={6}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="dexterityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                <stop offset="100%" stopColor="#86efac" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="session"
              tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 700 }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              domain={[0, "auto"]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              width={45}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<SessionTooltip />} />
            <Bar
              dataKey="score"
              name="Score"
              fill="url(#scoreGradient)"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.score === maxScore
                      ? "#3b82f6"
                      : "url(#scoreGradient)"
                  }
                  opacity={entry.score === maxScore ? 1 : 0.75}
                />
              ))}
            </Bar>
            <Bar
              dataKey="dexterity"
              name="Dexterity"
              fill="url(#dexterityGradient)"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
            />
            <Line
              type="monotone"
              dataKey="level"
              name="Level"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
              yAxisId={0}
              strokeDasharray="6 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Session summary row */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-blue-500" /> Score
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-green-500" /> Dexterity
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-amber-500 border-dashed" /> Level
        </span>
      </div>
    </div>
  );
}
