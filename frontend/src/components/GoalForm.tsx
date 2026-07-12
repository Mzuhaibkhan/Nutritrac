"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

interface Goal {
  daily_calorie_goal: number;
  daily_protein_goal_g: number;
  daily_carbs_goal_g: number;
  daily_fats_goal_g: number;
  daily_budget_usd: number;
  goal_description: string;
  target_weeks: number;
}

interface MealDay {
  day: string;
  meals: { meal_type: string; name: string; calories: number; protein_g: number; carbs_g: number; fats_g: number; estimated_cost: number }[];
  day_total: { calories: number; protein_g: number; carbs_g: number; fats_g: number; cost: number };
}

interface MealPlan {
  summary: string;
  weekly_plan: MealDay[];
  tips: string[];
  projected_progress: string;
}

export default function GoalForm() {
  const [goal, setGoal] = useState<Goal>({
    daily_calorie_goal: 2000,
    daily_protein_goal_g: 150,
    daily_carbs_goal_g: 250,
    daily_fats_goal_g: 65,
    daily_budget_usd: 500, // INR Budget
    goal_description: "",
    target_weeks: 4,
  });
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [flippedDay, setFlippedDay] = useState<number | null>(null);
  const [error, setError] = useState("");

  const field = (label: string, key: keyof Goal, type = "number", suffix = "") => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label className="mono" style={{ color: "var(--base-secondary-dark)" }}>{label}{suffix && ` (${suffix})`}</label>
      <input type={type} className="input-field"
        value={goal[key] as string | number}
        onChange={e => setGoal(g => ({ ...g, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))} />
    </div>
  );

  const saveGoal = async () => {
    try {
      setError("");
      const res = await apiPost("/api/goals", goal);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        throw new Error("Failed to save goals");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save goals.");
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    setMealPlan(null);
    setError("");
    try {
      const res = await apiPost("/api/goals/meal-plan", goal);
      const data = await res.json();
      if (res.ok) {
        setMealPlan(data.plan);
      } else {
        throw new Error(data.error || "Failed to generate meal plan.");
      }
    } catch (err: any) {
      setError(err.message || "Could not generate meal plan. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Goal form */}
      <div style={{ backgroundColor: "var(--base-300)", borderRadius: 16, padding: "2rem", color: "var(--base-100)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>▶ Set Your Targets</p>
            <h4 style={{ color: "var(--base-100)", marginTop: "0.25rem" }}>Goal Configuration</h4>
          </div>
          <button onClick={saveGoal} className="btn-primary btn-accent" style={{ fontSize: "0.72rem" }}>
            {saved ? "✓ Saved" : "Save Goals"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          {field("Daily Calories", "daily_calorie_goal", "number", "kcal")}
          {field("Daily Food Budget", "daily_budget_usd", "number", "₹")}
          {field("Protein Target", "daily_protein_goal_g", "number", "g/day")}
          {field("Carbs Target", "daily_carbs_goal_g", "number", "g/day")}
          {field("Fat Target", "daily_fats_goal_g", "number", "g/day")}
          {field("Target Duration", "target_weeks", "number", "weeks")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label className="mono" style={{ color: "var(--base-secondary-dark)" }}>Describe Your Goal</label>
          <textarea className="input-field" rows={3} value={goal.goal_description}
            onChange={e => setGoal(g => ({ ...g, goal_description: e.target.value }))}
            placeholder="e.g. I want to lose 5kg in 2 months by reducing carbs and eating more protein..."
            style={{ resize: "none" }} />
        </div>

        <button onClick={generatePlan} disabled={loading} className="btn-primary"
          style={{ marginTop: "1.25rem", opacity: loading ? 0.6 : 1, backgroundColor: "var(--accent-3)", color: "var(--base-300)" }}>
          {loading ? "Generating Plan..." : "▶ Generate AI Meal Plan"}
        </button>

        {error && <p className="mono" style={{ color: "var(--accent-2)", marginTop: "1rem" }}>{error}</p>}
      </div>

      {/* Meal plan output */}
      {mealPlan && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Your 7-Day Plan</p>
            <p style={{ fontSize: "1.05rem" }}>{mealPlan.summary}</p>
          </div>

          {/* Day selector */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {mealPlan.weekly_plan.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)}
                style={{ padding: "0.4rem 0.85rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.72rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: activeDay === i ? "var(--base-300)" : "var(--base-200)", color: activeDay === i ? "var(--accent-3)" : "var(--base-secondary-dark)", transition: "all 0.2s ease" }}>
                {d.day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Active day flip cards */}
          {mealPlan.weekly_plan[activeDay] && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                {mealPlan.weekly_plan[activeDay].meals.map((meal, mi) => (
                  <div key={mi} className="flip-card" style={{ minHeight: 180 }}
                    onMouseEnter={() => setFlippedDay(mi)} onMouseLeave={() => setFlippedDay(null)}>
                    <div className="flip-card-inner" style={{ transform: flippedDay === mi ? "rotateY(180deg)" : "none" }}>
                      <div className="flip-card-front" style={{ backgroundColor: ["var(--accent-1)", "var(--accent-2)", "var(--accent-3)", "var(--accent-4)"][mi % 4] }}>
                        <p className="mono" style={{ fontSize: "0.65rem" }}>{meal.meal_type}</p>
                        <p style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.3 }}>{meal.name}</p>
                        <p className="mono" style={{ fontSize: "0.65rem" }}>{meal.calories} kcal</p>
                      </div>
                      <div className="flip-card-back" style={{ gap: "0.5rem" }}>
                        <p className="mono" style={{ fontSize: "0.65rem", color: "var(--base-secondary-dark)" }}>{meal.name}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem" }}>
                          <span>🔥 {meal.calories} kcal</span>
                          <span>💪 {meal.protein_g}g protein</span>
                          <span>🌾 {meal.carbs_g}g carbs</span>
                          <span>🫙 {meal.fats_g}g fat</span>
                          <span>💰 ~₹{meal.estimated_cost}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Day totals */}
              <div style={{ backgroundColor: "var(--base-300)", borderRadius: 12, padding: "1.25rem", color: "var(--base-100)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {[
                  { l: "Total Calories", v: mealPlan.weekly_plan[activeDay].day_total.calories, u: "kcal", c: "var(--accent-3)" },
                  { l: "Protein", v: mealPlan.weekly_plan[activeDay].day_total.protein_g, u: "g", c: "var(--accent-1)" },
                  { l: "Carbs", v: mealPlan.weekly_plan[activeDay].day_total.carbs_g, u: "g", c: "var(--accent-4)" },
                  { l: "Fat", v: mealPlan.weekly_plan[activeDay].day_total.fats_g, u: "g", c: "var(--accent-2)" },
                  { l: "Spend", v: mealPlan.weekly_plan[activeDay].day_total.cost, u: "₹", c: "var(--base-100)" },
                ].map(s => (
                  <div key={s.l}>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.65rem" }}>{s.l}</p>
                    <div style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", fontWeight: 900, color: s.c }}>{s.u === "₹" ? "₹" : ""}{s.v}{s.u !== "₹" ? s.u : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div style={{ marginTop: "1.5rem", padding: "1.25rem", borderRadius: 12, border: "1.5px dashed var(--base-secondary-dark)" }}>
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>▶ AI Tips</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {mealPlan.tips.map((tip, i) => (
                <li key={i} style={{ fontSize: "0.9rem", paddingLeft: "1rem", borderLeft: "2px solid var(--accent-3)" }}>{tip}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: "1rem", padding: "1rem 1.25rem", backgroundColor: "rgba(177,193,239,0.1)", borderRadius: 10 }}>
            <p className="mono" style={{ color: "var(--accent-1)", marginBottom: "0.25rem" }}>Projected Progress</p>
            <p style={{ fontSize: "0.9rem" }}>{mealPlan.projected_progress}</p>
          </div>
        </div>
      )}
    </div>
  );
}
