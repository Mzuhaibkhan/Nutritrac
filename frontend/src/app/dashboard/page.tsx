"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import CalorieChart from "@/components/charts/CalorieChart";
import MacroChart from "@/components/charts/MacroChart";
import SpendChart from "@/components/charts/SpendChart";
import ActivityChart from "@/components/charts/ActivityChart";

interface DaySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  total_spend: number;
  meal_count: number;
}

interface ActivitySummary {
  steps: number;
  calories_burned: number;
  active_minutes: number;
}

interface RecentLog {
  id: string;
  food_item: string;
  calories: number;
  protein_g: number;
  cost: number;
  category: string;
  meal_type: string;
  logged_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [dailyNutrition, setDailyNutrition] = useState<any[]>([]);
  const [dailyActivities, setDailyActivities] = useState<any[]>([]);
  const [range, setRange] = useState("week");
  const [loading, setLoading] = useState(true);

  // Profile goals (fetched or defaults)
  const [goals, setGoals] = useState({
    calorie_goal: 2000,
    protein_goal_g: 150,
    carbs_goal_g: 250,
    fats_goal_g: 65,
    budget_inr: 500,
    step_goal: 10000,
    active_min_goal: 30
  });

  const localDate = new Date();
  const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [logsRes, analyticsRes, goalsRes, activitiesRes] = await Promise.all([
          apiFetch(`/api/logs?date=${today}`),
          apiFetch(`/api/analytics?range=${range}`),
          apiFetch("/api/goals"),
          apiFetch(`/api/activities?date=${today}`)
        ]);

        if (logsRes.ok) {
          const d = await logsRes.json();
          setLogs(d);
        }

        if (goalsRes.ok) {
          const gData = await goalsRes.json();
          if (gData && gData.id) {
            setGoals({
              calorie_goal: gData.daily_calorie_goal || 2000,
              protein_goal_g: gData.daily_protein_goal_g || 150,
              carbs_goal_g: gData.daily_carbs_goal_g || 250,
              fats_goal_g: gData.daily_fats_goal_g || 65,
              budget_inr: gData.daily_budget_usd || 500, // Using field as INR budget
              step_goal: gData.daily_step_goal || 10000,
              active_min_goal: gData.daily_active_minutes_goal || 30
            });
          }
        }

        if (analyticsRes.ok) {
          const d = await analyticsRes.json();
          setDailyNutrition(d.daily_nutrition || []);
          setDailyActivities(d.daily_activities || []);
          
          // Calculate today's intake summary
          const todayNutrition = (d.daily_nutrition || []).find((x: any) => x.date === today);
          if (todayNutrition) {
            setSummary({
              total_calories: todayNutrition.calories || 0,
              total_protein: todayNutrition.protein_g || 0,
              total_carbs: todayNutrition.carbs_g || 0,
              total_fats: todayNutrition.fats_g || 0,
              total_spend: todayNutrition.cost || 0,
              meal_count: logs.length
            });
          } else {
            setSummary({
              total_calories: 0,
              total_protein: 0,
              total_carbs: 0,
              total_fats: 0,
              total_spend: 0,
              meal_count: 0
            });
          }
        }

        if (activitiesRes.ok) {
          const acts = await activitiesRes.json();
          const todaySummary = acts.reduce((acc: any, act: any) => {
            acc.steps += act.steps || 0;
            acc.calories_burned += act.calories_burned || 0;
            acc.active_minutes += act.duration_minutes || 0;
            return acc;
          }, { steps: 0, calories_burned: 0, active_minutes: 0 });
          setActivitySummary(todaySummary);
        }
      } catch (err) {
        console.error("Dashboard loading error", err);
      }
      setLoading(false);
    };

    fetchDashboard();
  }, [range, user]);

  const MACRO_STATS = [
    { label: "Calories", val: Math.round(summary?.total_calories || 0), unit: "kcal", goal: goals.calorie_goal, color: "var(--accent-3)", tag: "tag-3" },
    { label: "Protein", val: Math.round(summary?.total_protein || 0), unit: "g", goal: goals.protein_goal_g, color: "var(--accent-1)", tag: "tag-1" },
    { label: "Carbs", val: Math.round(summary?.total_carbs || 0), unit: "g", goal: goals.carbs_goal_g, color: "var(--accent-4)", tag: "tag-4" },
    { label: "Fat", val: Math.round(summary?.total_fats || 0), unit: "g", goal: goals.fats_goal_g, color: "var(--accent-2)", tag: "tag-2" },
  ];

  const ACTIVITY_STATS = [
    { label: "Steps", val: activitySummary?.steps || 0, unit: "steps", goal: goals.step_goal, color: "var(--accent-1)", tag: "tag-1" },
    { label: "Calories Burned", val: Math.round(activitySummary?.calories_burned || 0), unit: "kcal", goal: 300, color: "var(--accent-2)", tag: "tag-2" },
    { label: "Active Minutes", val: activitySummary?.active_minutes || 0, unit: "min", goal: goals.active_min_goal, color: "var(--accent-4)", tag: "tag-4" },
  ];

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Control Center</p>
                <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Dashboard</h2>
                <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem" }}>
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/log" className="btn-primary btn-accent">▶ Log Meal</Link>
                <Link href="/activities/log" className="btn-primary btn-accent" style={{ backgroundColor: "var(--accent-1)", color: "var(--base-300)" }}>▶ Log Activity</Link>
                <Link href="/insights" className="btn-primary" style={{ border: "1px solid rgba(249,244,235,0.2)" }}>Insights</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Today's Nutrition & Budget ────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0 1rem", borderBottom: "1px solid var(--base-200)" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1.25rem" }}>▶ Today&apos;s Intake</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {MACRO_STATS.map(s => {
                const pct = Math.min(100, (s.val / s.goal) * 100);
                return (
                  <div key={s.label} className="dashed-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>{s.label}</p>
                      <span className={`tag ${s.tag}`}>{s.unit}</span>
                    </div>
                    <div className="stat-number" style={{ color: s.color, fontSize: "3.5rem", marginBottom: "0.5rem" }}>{s.val}</div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", marginTop: "0.35rem", fontSize: "0.68rem" }}>Goal: {s.goal}{s.unit}</p>
                  </div>
                );
              })}
              {/* Spend */}
              <div className="dashed-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Spent</p>
                  <span className="tag tag-2">₹</span>
                </div>
                <div className="stat-number" style={{ color: "var(--accent-2)", fontSize: "3.5rem", marginBottom: "0.5rem" }}>₹{(summary?.total_spend || 0).toFixed(0)}</div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, ((summary?.total_spend || 0) / goals.budget_inr) * 100)}%`, backgroundColor: "var(--accent-2)" }} />
                </div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginTop: "0.35rem", fontSize: "0.68rem" }}>Budget: ₹{goals.budget_inr}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Today's Activity Tracking ────────────────────────────────── */}
        <section style={{ padding: "1.5rem 0 2.5rem", borderBottom: "1px solid var(--base-200)" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1.25rem" }}>▶ Today&apos;s Activity</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {ACTIVITY_STATS.map(s => {
                const pct = Math.min(100, (s.val / s.goal) * 100);
                return (
                  <div key={s.label} className="dashed-card" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>{s.label}</p>
                      <span className={`tag ${s.tag}`}>{s.unit}</span>
                    </div>
                    <div className="stat-number" style={{ color: s.color, fontSize: "3.5rem", marginBottom: "0.5rem" }}>{s.val}</div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", marginTop: "0.35rem", fontSize: "0.68rem" }}>Goal: {s.goal} {s.unit}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Charts ───────────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>▶ Analytics Trends</p>
              <TimeRangeSelector value={range} onChange={setRange} />
            </div>
            {loading ? (
              <div style={{ height: 300, backgroundColor: "var(--base-300)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Loading charts...</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2.5rem" }}>
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>Calorie Intake (kcal)</p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <CalorieChart data={dailyNutrition} />
                  </div>
                </div>
                
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>Steps History</p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <ActivityChart data={dailyActivities} metric="steps" />
                  </div>
                </div>

                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>Nutrition Balance (g)</p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <MacroChart data={dailyNutrition} />
                  </div>
                </div>

                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>Food Budget (₹)</p>
                  <div className="chart-container" style={{ padding: "1rem" }}>
                    <SpendChart data={dailyNutrition} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Recent logs ──────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0 5rem", backgroundColor: "var(--base-200)" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>▶ Today&apos;s Logs</p>
              <Link href="/history" className="btn-primary" style={{ fontSize: "0.72rem" }}>View All History</Link>
            </div>
            {logs.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", border: "1.5px dashed var(--base-secondary-dark)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No meals logged today.</p>
                <Link href="/log" className="btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>▶ Log Your First Meal</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {logs.map(log => (
                  <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--base-100)", borderRadius: 10, padding: "1rem 1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem", textTransform: "capitalize" }}>{log.food_item}</p>
                      <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.7rem", marginTop: "0.15rem" }}>
                        {new Date(log.logged_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="tag tag-3">{log.calories} kcal</span>
                      <span className="tag tag-1">{log.protein_g}g P</span>
                      <span className="tag tag-2">₹{log.cost}</span>
                      <span className="tag tag-4">{log.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
