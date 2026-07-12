"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LogActivityPage() {
  const router = useRouter();
  const [type, setType] = useState("walking");
  const [title, setTitle] = useState("");
  const [dateVal, setDateVal] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("");
  const [steps, setSteps] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [hr, setHr] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ACTIVITY_TYPES = [
    "walking", "running", "cycling", "gym", "yoga", "swimming", "hiking", "sports", "other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiPost("/api/activities", {
        activity_type: type,
        title: title || undefined,
        activity_date: dateVal,
        duration_minutes: parseFloat(duration) || 0,
        steps: parseInt(steps) || 0,
        distance_km: parseFloat(distance) || 0,
        calories_burned: parseFloat(calories) || 0,
        heart_rate_avg: parseInt(hr) || undefined,
        notes: notes || undefined
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save workout.");
      }

      router.push("/activities");
    } catch (err: any) {
      setError(err.message || "Failed to log workout. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Manual Tracking</p>
            <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Log Workout</h2>
            <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem", maxWidth: 500 }}>
              Enter your steps, distance, active minutes, and calories burned manually.
            </p>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container" style={{ maxWidth: 700 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              {/* Type Grid */}
              <div>
                <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.5rem" }}>Activity Type</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {ACTIVITY_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      style={{ padding: "0.35rem 0.85rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.72rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: type === t ? "var(--base-300)" : "var(--base-200)", color: type === t ? "var(--base-100)" : "var(--base-secondary-dark)", transition: "all 0.2s ease" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Title / Name</label>
                <input type="text" className="input-field" placeholder="e.g. Afternoon run in park" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              {/* Grid fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Date</label>
                  <input type="date" className="input-field" value={dateVal} onChange={e => setDateVal(e.target.value)} required />
                </div>
                <div>
                  <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Duration (minutes) *</label>
                  <input type="number" className="input-field" value={duration} onChange={e => setDuration(e.target.value)} required min={1} />
                </div>
                <div>
                  <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Steps</label>
                  <input type="number" className="input-field" value={steps} onChange={e => setSteps(e.target.value)} min={0} />
                </div>
                <div>
                  <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Distance (km)</label>
                  <input type="number" step="0.01" className="input-field" value={distance} onChange={e => setDistance(e.target.value)} min={0} />
                </div>
                <div>
                  <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Calories Burned (kcal)</label>
                  <input type="number" className="input-field" value={calories} onChange={e => setCalories(e.target.value)} min={0} />
                </div>
                <div>
                  <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Avg Heart Rate (bpm)</label>
                  <input type="number" className="input-field" value={hr} onChange={e => setHr(e.target.value)} min={0} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Notes</label>
                <textarea className="input-field" placeholder="Notes on how you felt or details of the workout..." rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: "none" }} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>
                {loading ? "Saving..." : "▶ Save Workout"}
              </button>

              {error && <p className="mono" style={{ color: "var(--accent-2)" }}>{error}</p>}
            </form>
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
