"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

interface FoodLog { id: string; food_item: string; calories: number; protein_g: number; carbs_g: number; fats_g: number; cost: number; category: string; meal_type: string; logged_at: string; }

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }

export default function HistoryPage() {
  const { user } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);
  const [dayData, setDayData] = useState<Record<string, { calories: number; on_target: boolean }>>({});
  const [logs, setLogs] = useState<FoodLog[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchMonth = async () => {
      const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(getDaysInMonth(year, month)).padStart(2, "0")}`;
      try {
        const res = await apiFetch(`/api/analytics/daily-summary?from=${from}&to=${to}`);
        if (res.ok) setDayData(await res.json());
      } catch (err) {
        console.error("Month fetch error", err);
      }
    };
    fetchMonth();
  }, [year, month, user]);

  useEffect(() => {
    if (!user) return;
    const fetchDay = async () => {
      try {
        const res = await apiFetch(`/api/logs?date=${selectedDate}`);
        if (res.ok) setLogs(await res.json());
        else setLogs([]);
      } catch { setLogs([]); }
    };
    fetchDay();
  }, [selectedDate, user]);

  const days = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Food Archive</p>
            <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>History</h2>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
            {/* Calendar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--base-200)", border: "none", cursor: "pointer", fontSize: "1rem" }}>‹</button>
                <p className="mono">{MONTHS[month]} {year}</p>
                <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--base-200)", border: "none", cursor: "pointer", fontSize: "1rem" }}>›</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "0.4rem 0" }}>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.65rem" }}>{d}</p>
                  </div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: days }).map((_, i) => {
                  const d = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const dd = dayData[dateStr];
                  const isSel = dateStr === selectedDate;
                  return (
                    <button key={d} onClick={() => setSelectedDate(dateStr)}
                      style={{ aspectRatio: "1", borderRadius: 8, border: isSel ? "2px solid var(--base-300)" : "none", backgroundColor: isSel ? "var(--base-300)" : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, transition: "all 0.2s ease" }}>
                      <p className="mono" style={{ fontSize: "0.75rem", color: isSel ? "var(--base-100)" : "var(--base-300)" }}>{d}</p>
                      {dd && <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: dd.on_target ? "var(--accent-4)" : dd.calories > 0 ? "var(--accent-2)" : "var(--base-secondary-dark)" }} />}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {[["var(--accent-4)", "On target"], ["var(--accent-2)", "Over target"], ["var(--base-secondary-dark)", "No data"]].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c }} />
                    <p className="mono" style={{ fontSize: "0.65rem", color: "var(--base-secondary-dark)" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Day detail */}
            <div>
              <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1rem" }}>
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              {logs.length === 0 ? (
                <div style={{ padding: "3rem", border: "1.5px dashed var(--base-secondary-dark)", borderRadius: 16, textAlign: "center" }}>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No meals logged on this day.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ backgroundColor: "var(--base-300)", borderRadius: 12, padding: "1.25rem", color: "var(--base-100)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.95rem", textTransform: "capitalize" }}>{log.food_item}</p>
                          <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.65rem", marginTop: "0.15rem" }}>
                            {new Date(log.logged_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} — {log.meal_type}
                          </p>
                        </div>
                        <span className="tag tag-2" style={{ fontSize: "0.65rem" }}>₹{log.cost}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                        {[{ l: "Cal", v: log.calories, u: "kcal", c: "var(--accent-3)" },
                          { l: "Pro", v: log.protein_g, u: "g", c: "var(--accent-1)" },
                          { l: "Carb", v: log.carbs_g, u: "g", c: "var(--accent-4)" },
                          { l: "Fat", v: log.fats_g, u: "g", c: "var(--accent-2)" }].map(s => (
                          <div key={s.l} style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "0.4rem 0.6rem" }}>
                            <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.6" }}>{s.l}</p>
                            <p style={{ fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: "1.1rem", color: s.c }}>{s.v}{s.u}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
