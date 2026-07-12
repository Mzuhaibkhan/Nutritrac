"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface CalorieChartProps {
  data: Array<{ date: string; calories: number }>;
}

export default function CalorieChart({ data }: CalorieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
        <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No nutrition data found for this range.</p>
      </div>
    );
  }

  // Format dates for display
  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="calColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-3)" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="var(--accent-3)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="displayDate" stroke="var(--base-secondary-dark)" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem", fontFamily: "DM Mono" }} />
          <YAxis stroke="var(--base-secondary-dark)" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem", fontFamily: "DM Mono" }} />
          <Tooltip 
            contentStyle={{ backgroundColor: "var(--base-300)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}
            labelStyle={{ fontFamily: "DM Mono", color: "var(--base-100)", fontSize: "0.8rem", textTransform: "uppercase" }}
            itemStyle={{ fontFamily: "Host Grotesk", color: "var(--accent-3)" }}
            formatter={(value) => [`${value} kcal`, "Calories"]}
          />
          <Area type="monotone" dataKey="calories" stroke="var(--accent-3)" strokeWidth={2} fillOpacity={1} fill="url(#calColor)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
