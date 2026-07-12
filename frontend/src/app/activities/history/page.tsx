"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import { apiFetch, apiDelete } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  steps: number;
  distance_km: number;
  duration_minutes: number;
  calories_burned: number;
  activity_date: string;
  start_time?: string;
  source: string;
  notes?: string;
}

export default function ActivityHistoryPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const url = filterType ? `/api/activities?type=${filterType}` : "/api/activities";
      const res = await apiFetch(url);
      if (res.ok) setActivities(await res.json());
    } catch (err) {
      console.error("History loading error", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [filterType, user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity record?")) return;
    try {
      const res = await apiDelete(`/api/activities/${id}`);
      if (res.ok) {
        setActivities(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Delete activity error", err);
    }
  };

  const ACTIVITY_TYPES = ["walking", "running", "cycling", "gym", "yoga", "swimming", "other"];

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        
        {/* ── Header ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ History Log</p>
                <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Workouts</h2>
              </div>
              
              {/* Type Filter */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <button onClick={() => setFilterType("")}
                  style={{ padding: "0.3rem 0.75rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.72rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: filterType === "" ? "var(--accent-3)" : "var(--base-200)", color: filterType === "" ? "var(--base-300)" : "var(--base-secondary-dark)" }}>
                  All
                </button>
                {ACTIVITY_TYPES.map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    style={{ padding: "0.3rem 0.75rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.72rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: filterType === t ? "var(--accent-3)" : "var(--base-200)", color: filterType === t ? "var(--base-300)" : "var(--base-secondary-dark)" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── History List ───────────────────────────────────── */}
        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container">
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Loading activity logs...</p>
              </div>
            ) : activities.length === 0 ? (
              <div style={{ padding: "4rem", textAlign: "center", border: "1.5px dashed var(--base-secondary-dark)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No matching activities found in your history.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {activities.map(act => (
                  <div key={act.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "var(--base-200)", borderRadius: 12, padding: "1.25rem 1.75rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <h4 style={{ fontSize: "1.5rem", textTransform: "uppercase", fontFamily: "Barlow Condensed", lineHeight: 1, marginBottom: "0.25rem" }}>
                        {act.title}
                      </h4>
                      <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.75rem" }}>
                        {new Date(act.activity_date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        {act.start_time && ` @ ${act.start_time}`}
                      </p>
                      {act.notes && (
                        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--base-secondary-dark)", fontStyle: "italic" }}>
                          &ldquo;{act.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span className="tag tag-3">{act.activity_type}</span>
                        {act.steps > 0 && <span className="tag tag-1">{act.steps} steps</span>}
                        {act.distance_km > 0 && <span className="tag tag-4">{act.distance_km} km</span>}
                        <span className="tag tag-4">{act.duration_minutes} min</span>
                        <span className="tag tag-2">{act.calories_burned} kcal</span>
                        <span className="tag tag-dark" style={{ textTransform: "uppercase" }}>{act.source}</span>
                      </div>
                      
                      <button onClick={() => handleDelete(act.id)} style={{ color: "var(--accent-2)", cursor: "pointer", fontSize: "0.85rem", padding: "0.5rem" }} className="mono" aria-label="Delete entry">
                        ✕
                      </button>
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
