"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import ActivityChart from "@/components/charts/ActivityChart";

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  steps: number;
  distance_km: number;
  duration_minutes: number;
  calories_burned: number;
  activity_date: string;
  source: string;
}

interface ActivitySummary {
  daily: Array<{ date: string; steps: number; calories_burned: number; active_minutes: number }>;
  type_counts: Record<string, number>;
  totals: { steps: number; distance_km: number; active_minutes: number; calories_burned: number; count: number };
}

export default function ActivitiesDashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        apiFetch("/api/activities"),
        apiFetch("/api/activities/summary?range=week")
      ]);
      if (listRes.ok) setActivities(await listRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (err) {
      console.error("Failed to load activities", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const handleStravaSync = async () => {
    setSyncing(true);
    setSyncMsg("Connecting to Strava...");
    try {
      // Check status first
      const statusRes = await apiFetch("/api/strava/status");
      const status = await statusRes.json();

      if (!status.connected) {
        // Connect flow
        const connectRes = await apiFetch("/api/strava/connect");
        const connectData = await connectRes.json();
        if (connectData.auth_url) {
          window.location.href = connectData.auth_url;
          return;
        }
        throw new Error("Strava OAuth configuration missing.");
      }

      // Sync flow
      setSyncMsg("Syncing activity data...");
      const syncRes = await apiFetch("/api/strava/sync", { method: "POST" });
      const syncData = await syncRes.json();
      if (syncRes.ok) {
        setSyncMsg(`Successfully synced ${syncData.synced} new activities!`);
        fetchActivities();
      } else {
        throw new Error(syncData.error || "Sync failed.");
      }
    } catch (err: any) {
      setSyncMsg(err.message || "Failed to sync. Please try again.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(""), 5000);
    }
  };

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        
        {/* ── Header ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Fitness Hub</p>
                <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Activities</h2>
                <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem" }}>Track workouts, exercises, steps, and active calories.</p>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/activities/log" className="btn-primary btn-accent">▶ Log Workout</Link>
                <button onClick={handleStravaSync} disabled={syncing} className="btn-primary" style={{ border: "1px solid rgba(249,244,235,0.2)" }}>
                  {syncing ? "Syncing..." : "Sync Strava"}
                </button>
              </div>
            </div>
            {syncMsg && (
              <div style={{ marginTop: "1rem", backgroundColor: "rgba(255,255,255,0.05)", padding: "0.85rem 1.25rem", borderRadius: 8 }}>
                <p className="mono" style={{ color: "var(--accent-3)", fontSize: "0.82rem" }}>▶ {syncMsg}</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Weekly Totals ──────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0", borderBottom: "1px solid var(--base-200)" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1.25rem" }}>▶ Weekly Total Output</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {[
                { label: "Total Steps", val: summary?.totals.steps || 0, unit: "steps", color: "var(--accent-1)" },
                { label: "Distance", val: (summary?.totals.distance_km || 0).toFixed(1), unit: "km", color: "var(--accent-3)" },
                { label: "Active Time", val: Math.round(summary?.totals.active_minutes || 0), unit: "mins", color: "var(--accent-4)" },
                { label: "Energy Burned", val: Math.round(summary?.totals.calories_burned || 0), unit: "kcal", color: "var(--accent-2)" },
              ].map(s => (
                <div key={s.label} className="dashed-card">
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>{s.label}</p>
                  <div className="stat-number" style={{ color: s.color, fontSize: "3.5rem" }}>
                    {s.val}
                    <span style={{ fontSize: "1rem", fontFamily: "DM Mono", marginLeft: 4 }}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Steps Trends ───────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>▶ Daily Steps Trends</p>
              <Link href="/activities/history" className="btn-primary" style={{ fontSize: "0.72rem" }}>View Workout Log</Link>
            </div>
            {loading ? (
              <div style={{ height: 300, backgroundColor: "var(--base-300)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Loading activity charts...</p>
              </div>
            ) : (
              <div className="chart-container" style={{ padding: "1.5rem" }}>
                <ActivityChart data={summary?.daily || []} metric="steps" />
              </div>
            )}
          </div>
        </section>

        {/* ── Recent Workouts ────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0 5rem", backgroundColor: "var(--base-200)" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1.25rem" }}>▶ Recent Workouts</p>
            {activities.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", border: "1.5px dashed var(--base-secondary-dark)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No workouts logged recently.</p>
                <Link href="/activities/log" className="btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>▶ Log Your First Workout</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {activities.slice(0, 10).map(act => (
                  <div key={act.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--base-100)", borderRadius: 10, padding: "1rem 1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem", textTransform: "capitalize" }}>{act.title || act.activity_type}</p>
                      <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.7rem", marginTop: "0.15rem" }}>
                        {new Date(act.activity_date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="tag tag-3">{act.activity_type}</span>
                      {act.steps > 0 && <span className="tag tag-1">{act.steps} steps</span>}
                      {act.distance_km > 0 && <span className="tag tag-4">{act.distance_km} km</span>}
                      <span className="tag tag-4">{act.duration_minutes} mins</span>
                      <span className="tag tag-2">{act.calories_burned} kcal</span>
                      <span className="tag tag-dark" style={{ textTransform: "uppercase" }}>{act.source}</span>
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
