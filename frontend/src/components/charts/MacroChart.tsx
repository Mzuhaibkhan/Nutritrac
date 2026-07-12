"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

interface MacroChartProps {
  data: Array<{ date: string; protein_g: number; carbs_g: number; fats_g: number }>;
}

export default function MacroChart({ data }: MacroChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
        <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No macronutrient data found.</p>
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
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="displayDate" stroke="var(--base-secondary-dark)" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem", fontFamily: "DM Mono" }} />
          <YAxis stroke="var(--base-secondary-dark)" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem", fontFamily: "DM Mono" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--base-300)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}
            labelStyle={{ fontFamily: "DM Mono", color: "var(--base-100)", fontSize: "0.8rem", textTransform: "uppercase" }}
            itemStyle={{ fontFamily: "Host Grotesk", fontSize: "0.85rem" }}
          />
          <Legend 
            wrapperStyle={{ fontFamily: "DM Mono", fontSize: "0.75rem", textTransform: "uppercase", paddingTop: "0.75rem" }}
            iconType="circle"
          />
          <Bar dataKey="protein_g" name="Protein" fill="var(--accent-1)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="carbs_g" name="Carbs" fill="var(--accent-4)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="fats_g" name="Fat" fill="var(--accent-2)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
