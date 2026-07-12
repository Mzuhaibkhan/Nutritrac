"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface SpendChartProps {
  data: Array<{ date: string; cost: number }>;
}

export default function SpendChart({ data }: SpendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
        <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No spending data found.</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="displayDate" stroke="var(--base-secondary-dark)" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem", fontFamily: "DM Mono" }} />
          <YAxis stroke="var(--base-secondary-dark)" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem", fontFamily: "DM Mono" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--base-300)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}
            labelStyle={{ fontFamily: "DM Mono", color: "var(--base-100)", fontSize: "0.8rem", textTransform: "uppercase" }}
            itemStyle={{ fontFamily: "Host Grotesk", color: "var(--accent-2)" }}
            formatter={(value) => [`₹${value}`, "Spent"]}
          />
          <Line type="monotone" dataKey="cost" stroke="var(--accent-2)" strokeWidth={3} dot={{ stroke: "var(--accent-2)", strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
