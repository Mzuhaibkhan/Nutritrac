"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ActivityChartProps {
  data: Array<{ date: string; steps: number; calories_burned: number; active_minutes: number }>;
  metric: "steps" | "calories_burned" | "active_minutes";
}

export default function ActivityChart({ data, metric }: ActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
        <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No activity records found.</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  }));

  const CONFIG = {
    steps: {
      color: "var(--accent-1)",
      label: "Steps",
      unit: "steps"
    },
    calories_burned: {
      color: "var(--accent-2)",
      label: "Calories Burned",
      unit: "kcal"
    },
    active_minutes: {
      color: "var(--accent-4)",
      label: "Active Minutes",
      unit: "min"
    }
  };

  const metricConf = CONFIG[metric];

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="displayDate" stroke="var(--base-secondary-dark)" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem", fontFamily: "DM Mono" }} />
          <YAxis stroke="var(--base-secondary-dark)" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem", fontFamily: "DM Mono" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--base-300)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}
            labelStyle={{ fontFamily: "DM Mono", color: "var(--base-100)", fontSize: "0.8rem", textTransform: "uppercase" }}
            itemStyle={{ fontFamily: "Host Grotesk", color: metricConf.color }}
            formatter={(value) => [`${value} ${metricConf.unit}`, metricConf.label]}
          />
          <Bar dataKey={metric} fill={metricConf.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
