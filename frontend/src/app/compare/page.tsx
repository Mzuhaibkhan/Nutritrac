"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import CombinedCompareChart from "@/components/charts/CombinedCompareChart";

interface PeriodData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  spend?: number;
}

interface ActivityData {
  steps?: number;
  calories_burned?: number;
  active_minutes?: number;
  distance_km?: number;
}

interface CompareResponse {
  this_period: PeriodData;
  last_period: PeriodData;
  this_activities: ActivityData;
  last_activities: ActivityData;
  period: string;
  this_range: string;
  last_range: string;
}

export default function ComparePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"week" | "month" | "year">("week");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/compare?mode=${mode}`);
        if (res.ok) {
          const d: CompareResponse = await res.json();
          setData(d);

          // Build composite chart data for the ComposedChart
          // Let's create dummy plot points for this period vs last period
          const points = [
            {
              date: "This Period",
              calories_in: d.this_period.calories || 0,
              calories_out: d.this_activities.calories_burned || 0,
            },
            {
              date: "Last Period",
              calories_in: d.last_period.calories || 0,
              calories_out: d.last_activities.calories_burned || 0,
            }
          ];
          setChartData(points);
        }
      } catch (err) {
        console.error("Compare loading error", err);
      }
      setLoading(false);
    };
    fetch_();
  }, [mode, user]);

  const pct = (a?: number, b?: number) => {
    const prev = a || 0;
    const curr = b || 0;
    return prev > 0 ? ((curr - prev) / prev) * 100 : 0;
  };

  const NUTRITION_METRICS = [
    { key: "calories", label: "Calories In", unit: "kcal", lowerIsBetter: true, color: "var(--accent-3)" },
    { key: "protein", label: "Protein", unit: "g", lowerIsBetter: false, color: "var(--accent-1)" },
    { key: "carbs", label: "Carbs", unit: "g", lowerIsBetter: true, color: "var(--accent-4)" },
    { key: "fats", label: "Fat", unit: "g", lowerIsBetter: true, color: "var(--accent-2)" },
    { key: "spend", label: "Food Budget Spent", unit: "₹", lowerIsBetter: true, color: "var(--accent-2)" },
  ];

  const ACTIVITY_METRICS = [
    { key: "steps", label: "Steps taken", unit: "", lowerIsBetter: false, color: "var(--accent-1)" },
    { key: "calories_burned", label: "Calories Burned", unit: "kcal", lowerIsBetter: false, color: "var(--accent-2)" },
    { key: "active_minutes", label: "Active minutes", unit: "min", lowerIsBetter: false, color: "var(--accent-4)" },
    { key: "distance_km", label: "Distance", unit: "km", lowerIsBetter: false, color: "var(--accent-3)" },
  ];

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        
        {/* ── Header ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Period Analysis</p>
                <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Compare</h2>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["week", "month", "year"] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} className="btn-primary"
                    style={{ backgroundColor: mode === m ? "var(--accent-3)" : "transparent", color: mode === m ? "var(--base-300)" : "var(--base-100)", border: "1px solid rgba(249,244,235,0.2)" }}>
                    This {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container">
            {loading ? (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--base-300)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Comparing periods...</p>
              </div>
            ) : data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                
                {/* Composed chart */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>Calories In vs Calories Out</p>
                  <div className="chart-container" style={{ padding: "1.5rem" }}>
                    <CombinedCompareChart data={chartData} />
                  </div>
                </div>

                {/* Nutrition Table */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>▶ Meal & Nutrition Comparison</p>
                  <div style={{ backgroundColor: "var(--base-300)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["Metric", `This ${mode}`, `Last ${mode}`, "Change"].map(h => (
                        <p key={h} className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.72rem" }}>{h}</p>
                      ))}
                    </div>
                    {NUTRITION_METRICS.map(m => {
                      const curr = data.this_period[m.key as keyof PeriodData] || 0;
                      const prev = data.last_period[m.key as keyof PeriodData] || 0;
                      const change = pct(prev, curr);
                      const isGood = m.lowerIsBetter ? change <= 0 : change >= 0;
                      return (
                        <div key={m.key} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", padding: "1.1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: m.color }} />
                            <p className="mono" style={{ color: "var(--base-100)", fontSize: "0.78rem" }}>{m.label}</p>
                          </div>
                          <p style={{ color: "var(--base-100)", fontFamily: "Barlow Condensed", fontSize: "1.5rem", fontWeight: 900 }}>
                            {m.unit === "₹" ? "₹" : ""}{Math.round(curr)}{m.unit !== "₹" ? m.unit : ""}
                          </p>
                          <p style={{ color: "var(--base-secondary-dark)", fontFamily: "Barlow Condensed", fontSize: "1.5rem", fontWeight: 900 }}>
                            {m.unit === "₹" ? "₹" : ""}{Math.round(prev)}{m.unit !== "₹" ? m.unit : ""}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontFamily: "Barlow Condensed", fontSize: "1.4rem", fontWeight: 900, color: isGood ? "var(--accent-4)" : "var(--accent-2)" }}>
                              {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
                            </span>
                            <span>{isGood ? "✅" : "⚠️"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Activities Table */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>▶ Fitness & Activity Comparison</p>
                  <div style={{ backgroundColor: "var(--base-300)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["Metric", `This ${mode}`, `Last ${mode}`, "Change"].map(h => (
                        <p key={h} className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.72rem" }}>{h}</p>
                      ))}
                    </div>
                    {ACTIVITY_METRICS.map(m => {
                      const curr = data.this_activities[m.key as keyof ActivityData] || 0;
                      const prev = data.last_activities[m.key as keyof ActivityData] || 0;
                      const change = pct(prev, curr);
                      const isGood = m.lowerIsBetter ? change <= 0 : change >= 0;
                      return (
                        <div key={m.key} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", padding: "1.1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: m.color }} />
                            <p className="mono" style={{ color: "var(--base-100)", fontSize: "0.78rem" }}>{m.label}</p>
                          </div>
                          <p style={{ color: "var(--base-100)", fontFamily: "Barlow Condensed", fontSize: "1.5rem", fontWeight: 900 }}>
                            {Math.round(curr)} {m.unit}
                          </p>
                          <p style={{ color: "var(--base-secondary-dark)", fontFamily: "Barlow Condensed", fontSize: "1.5rem", fontWeight: 900 }}>
                            {Math.round(prev)} {m.unit}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontFamily: "Barlow Condensed", fontSize: "1.4rem", fontWeight: 900, color: isGood ? "var(--accent-4)" : "var(--accent-2)" }}>
                              {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
                            </span>
                            <span>{isGood ? "✅" : "⚠️"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p style={{ color: "var(--base-secondary-dark)", fontSize: "0.82rem" }}>
                  ✅ = moving toward goal &nbsp;|&nbsp; ⚠️ = needs attention
                </p>
              </div>
            ) : (
              <div style={{ padding: "4rem", textAlign: "center", border: "1.5px dashed var(--base-secondary-dark)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No comparison data found. Try logging activities and meals!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
