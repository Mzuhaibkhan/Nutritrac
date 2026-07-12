"use client";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

interface CombinedCompareChartProps {
  data: Array<{
    date: string;
    calories_in?: number;
    calories_out?: number;
  }>;
}

export default function CombinedCompareChart({ data }: CombinedCompareChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
        <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No activity or meal records found.</p>
      </div>
    );
  }

  // Format dates for display
  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  }));

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          {/* Calories In (Food Intake) - Bar */}
          <Bar dataKey="calories_in" name="Calories In" fill="var(--accent-3)" radius={[4, 4, 0, 0]} barSize={24} />
          {/* Calories Out (Burned Activity) - Line */}
          <Line type="monotone" dataKey="calories_out" name="Calories Out" stroke="var(--accent-2)" strokeWidth={3} dot={{ stroke: "var(--accent-2)", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
