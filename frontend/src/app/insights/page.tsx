"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import CalorieChart from "@/components/charts/CalorieChart";
import MacroChart from "@/components/charts/MacroChart";
import SpendChart from "@/components/charts/SpendChart";
import ActivityChart from "@/components/charts/ActivityChart";

export default function InsightsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState("week");
  const [dailyNutrition, setDailyNutrition] = useState<any[]>([]);
  const [dailyActivities, setDailyActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/analytics?range=${range}`);
        if (res.ok) {
          const d = await res.json();
          setDailyNutrition(d.daily_nutrition || []);
          setDailyActivities(d.daily_activities || []);
        }
      } catch (err) {
        console.error("Insights load error", err);
      }
      setLoading(false);
    };
    fetch_();
  }, [range, user]);

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Visual Logs</p>
                <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Insights</h2>
              </div>
              <TimeRangeSelector value={range} onChange={setRange} />
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container">
            {loading ? (
              <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--base-300)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Generating charts...</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "2.5rem" }}>
                
                {/* Calories chart */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Calorie Intake</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--base-secondary-dark)", marginTop: "0.15rem", marginBottom: "0.75rem" }}>
                    Daily calorie consumption over time
                  </p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <CalorieChart data={dailyNutrition} />
                  </div>
                </div>

                {/* Steps chart */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Steps Tracker</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--base-secondary-dark)", marginTop: "0.15rem", marginBottom: "0.75rem" }}>
                    Daily steps count trends
                  </p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <ActivityChart data={dailyActivities} metric="steps" />
                  </div>
                </div>

                {/* Macro chart */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Macronutrient Balance</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--base-secondary-dark)", marginTop: "0.15rem", marginBottom: "0.75rem" }}>
                    Protein, carbs, and fat distributions
                  </p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <MacroChart data={dailyNutrition} />
                  </div>
                </div>

                {/* Spending chart */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Food Expenditures</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--base-secondary-dark)", marginTop: "0.15rem", marginBottom: "0.75rem" }}>
                    Food budget expenses (₹)
                  </p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <SpendChart data={dailyNutrition} />
                  </div>
                </div>

                {/* Active Minutes chart */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Exercise Activity</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--base-secondary-dark)", marginTop: "0.15rem", marginBottom: "0.75rem" }}>
                    Daily active minutes spent exercising
                  </p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <ActivityChart data={dailyActivities} metric="active_minutes" />
                  </div>
                </div>

                {/* Active Calories Burned chart */}
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Active Energy Burned</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--base-secondary-dark)", marginTop: "0.15rem", marginBottom: "0.75rem" }}>
                    Daily active calories burned (kcal)
                  </p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <ActivityChart data={dailyActivities} metric="calories_burned" />
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
