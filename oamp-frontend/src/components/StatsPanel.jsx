import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import { Users, Clock, Brain, Eye, UserCheck } from "lucide-react";

const PIE_COLORS = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b"];

export function StatsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get("/stats"),
    refetchInterval: 30000,
  });

  const stats = useMemo(() => data?.data?.stats || data?.data || {}, [data]);
  const levelAvgs = useMemo(() => data?.data?.level_avgs || [], [data]);
  const timeline = useMemo(() => (data?.data?.timeline || []).slice().reverse(), [data]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-lg">Memuat statistik...</div>;
  }

  const kpiCards = [
    { label: "Total Peserta", value: stats.total_participants ?? "—", icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { label: "Rata-rata Waktu", value: stats.avg_time ? `${stats.avg_time}s` : "—", icon: Clock, color: "text-violet-600 dark:text-violet-400" },
    { label: "Waktu Tercepat", value: stats.min_time ? `${stats.min_time}s` : "—", icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Usia Kognitif Rata-rata", value: stats.avg_cognitive_age ? `${stats.avg_cognitive_age} th` : "—", icon: Brain, color: "text-pink-600 dark:text-pink-400" },
    { label: "Visuo-Spatial Rata-rata", value: stats.avg_visuo_spatial ? `${stats.avg_visuo_spatial}%` : "—", icon: Eye, color: "text-amber-600 dark:text-amber-400" },
  ];

  const genderData = [
    { name: "Laki-laki", value: stats.total_male || 0 },
    { name: "Perempuan", value: stats.total_female || 0 },
  ].filter(d => d.value > 0);

  const chartLabelStyle = { fill: "currentColor", fontSize: 11 };
  const gridStroke = "currentColor";
  const chartCardCls = "bg-card border border-[var(--color-border)] rounded-2xl p-5";

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        {kpiCards.map((card) => (
          <div key={card.label} className={cn("rounded-2xl p-4 border border-[var(--color-border)] bg-card shadow-sm")}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={cn("h-4 w-4", card.color)} />
              <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">{card.label}</span>
            </div>
            <div className={cn("text-2xl font-black tabular-nums text-slate-900 dark:text-white", card.color)}>
              <span className={card.color}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className={chartCardCls}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Rata-rata Waktu per Level</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelAvgs}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="level" tick={chartLabelStyle} axisLine={false} tickLine={false} className="text-slate-400 dark:text-slate-500" />
                <YAxis tick={chartLabelStyle} axisLine={false} tickLine={false} unit="s" className="text-slate-400 dark:text-slate-500" />
                <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(v) => [`${v}s`, "Avg Waktu"]} />
                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className={chartCardCls}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Distribusi Gender</h3>
          <div style={{ height: 280 }}>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="45%" outerRadius={80} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                  >
                    {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">Belum ada data</div>
            )}
          </div>
        </div>
      </div>

      {/* Line chart */}
      <div className={chartCardCls}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Tren Waktu Peserta (20 terakhir)</h3>
        <div style={{ height: 300 }}>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="name" tick={chartLabelStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" className="text-slate-400 dark:text-slate-500" />
                <YAxis tick={chartLabelStyle} axisLine={false} tickLine={false} unit="s" className="text-slate-400 dark:text-slate-500" />
                <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(v) => [`${Number(v).toFixed(2)}s`, "Waktu"]} />
                <Line type="monotone" dataKey="avg_time" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">Belum ada data</div>
          )}
        </div>
      </div>
    </div>
  );
}
