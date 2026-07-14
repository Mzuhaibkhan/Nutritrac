"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import { apiFetch, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Profile targets states
  const [displayName, setDisplayName] = useState("");
  const [calGoal, setCalGoal] = useState("");
  const [protGoal, setProtGoal] = useState("");
  const [carbGoal, setCarbGoal] = useState("");
  const [fatGoal, setFatGoal] = useState("");
  const [stepGoal, setStepGoal] = useState("");
  const [minGoal, setMinGoal] = useState("");
  const [budgetGoal, setBudgetGoal] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("INR");
  const [waterGoal, setWaterGoal] = useState("3000");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Strava integration states
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const [stravaMsg, setStravaMsg] = useState("");

  useEffect(() => {
    if (!user) return;

    // Fetch user profile targets
    const loadProfile = async () => {
      try {
        const res = await apiFetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.display_name || "");
          setCalGoal(String(data.daily_calorie_goal || 2000));
          setProtGoal(String(data.daily_protein_goal_g || 150));
          setCarbGoal(String(data.daily_carbs_goal_g || 250));
          setFatGoal(String(data.daily_fats_goal_g || 65));
          setStepGoal(String(data.daily_step_goal || 10000));
          setMinGoal(String(data.daily_active_minutes_goal || 30));
          setBudgetGoal(String(data.daily_budget_usd || 500));
          setPreferredCurrency(data.preferred_currency || "INR");
          setWaterGoal(String(data.daily_water_goal_ml || 3000));
        }
      } catch (err) {
        console.error("Profile load failed", err);
      }
    };

    // Fetch Strava status
    const loadStravaStatus = async () => {
      try {
        const res = await apiFetch("/api/strava/status");
        if (res.ok) {
          const data = await res.json();
          setStravaConnected(data.connected);
        }
      } catch (err) {
        console.error("Strava status load failed", err);
      }
    };

    loadProfile();
    loadStravaStatus();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await apiPost("/api/profile", {
        display_name: displayName,
        daily_calorie_goal: parseInt(calGoal) || 2000,
        daily_protein_goal_g: parseInt(protGoal) || 150,
        daily_carbs_goal_g: parseInt(carbGoal) || 250,
        daily_fats_goal_g: parseInt(fatGoal) || 65,
        daily_step_goal: parseInt(stepGoal) || 10000,
        daily_active_minutes_goal: parseInt(minGoal) || 30,
        daily_budget_usd: parseFloat(budgetGoal) || 500,
        preferred_currency: preferredCurrency,
        daily_water_goal_ml: parseInt(waterGoal) || 3000
      });

      if (res.ok) {
        setSaveMsg("Profile targets saved successfully!");
      } else {
        throw new Error("Failed to save goals.");
      }
    } catch (err: any) {
      setSaveMsg(err.message || "Failed to save profile targets.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  const handleStravaToggle = async () => {
    if (stravaConnected) {
      // Disconnect
      if (!confirm("Are you sure you want to disconnect your Strava account?")) return;
      try {
        const res = await apiDelete("/api/strava/disconnect");
        if (res.ok) {
          setStravaConnected(false);
          setStravaMsg("Strava disconnected.");
        }
      } catch (err) {
        setStravaMsg("Failed to disconnect Strava.");
      }
    } else {
      // Connect
      try {
        const res = await apiFetch("/api/strava/connect");
        const data = await res.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
        } else {
          throw new Error("Strava OAuth setup missing on server.");
        }
      } catch (err: any) {
        setStravaMsg(err.message || "Failed to initiate Strava connection.");
      }
    }
    setTimeout(() => setStravaMsg(""), 4000);
  };

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        
        {/* ── Header ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ System Preferences</p>
            <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Settings</h2>
            <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem" }}>Manage fitness targets, connected apps, and account details.</p>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}>
            
            {/* Left Column: Health Profile & Goals */}
            <div>
              <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1.25rem" }}>▶ Health Goals & Targets</p>
              
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Display Name</label>
                  <input type="text" className="input-field" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Daily Calorie Goal (kcal)</label>
                    <input type="number" className="input-field" value={calGoal} onChange={e => setCalGoal(e.target.value)} required min={500} />
                  </div>
                  <div>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Daily Food Budget</label>
                    <input type="number" className="input-field" value={budgetGoal} onChange={e => setBudgetGoal(e.target.value)} required min={10} />
                  </div>
                  <div>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Preferred Currency</label>
                    <select className="input-field" value={preferredCurrency} onChange={e => setPreferredCurrency(e.target.value)} style={{ paddingRight: "1rem" }}>
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Daily Water Goal (ml)</label>
                    <input type="number" className="input-field" value={waterGoal} onChange={e => setWaterGoal(e.target.value)} required min={500} />
                  </div>
                  <div>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Protein Target (g)</label>
                    <input type="number" className="input-field" value={protGoal} onChange={e => setProtGoal(e.target.value)} required min={10} />
                  </div>
                  <div>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Carbs Target (g)</label>
                    <input type="number" className="input-field" value={carbGoal} onChange={e => setCarbGoal(e.target.value)} required min={10} />
                  </div>
                  <div>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Fats Target (g)</label>
                    <input type="number" className="input-field" value={fatGoal} onChange={e => setFatGoal(e.target.value)} required min={5} />
                  </div>
                  <div>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Daily Step Goal</label>
                    <input type="number" className="input-field" value={stepGoal} onChange={e => setStepGoal(e.target.value)} required min={1000} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label className="mono" style={{ color: "var(--base-secondary-dark)", display: "block", marginBottom: "0.35rem" }}>Daily Active Minutes Target</label>
                    <input type="number" className="input-field" value={minGoal} onChange={e => setMinGoal(e.target.value)} required min={5} />
                  </div>
                </div>

                <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>
                  {saving ? "Saving..." : "▶ Save Profile"}
                </button>

                {saveMsg && <p className="mono" style={{ color: "var(--accent-4)", fontSize: "0.82rem" }}>▶ {saveMsg}</p>}
              </form>
            </div>

            {/* Right Column: Connected Fitness Apps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1.25rem" }}>▶ Connected Applications</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Strava Card */}
                  <div style={{ backgroundColor: "var(--base-200)", padding: "1.5rem", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ fontSize: "1.5rem", fontFamily: "Barlow Condensed" }}>Strava</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--base-secondary-dark)" }}>Sync workout activities, routes, and statistics</p>
                    </div>
                    <button onClick={handleStravaToggle} className="btn-primary" style={{ backgroundColor: stravaConnected ? "var(--accent-2)" : "var(--accent-1)", color: "var(--base-300)" }}>
                      {stravaConnected ? "Disconnect" : "Connect"}
                    </button>
                  </div>

                  {/* Google Health Connect */}
                  <div style={{ backgroundColor: "var(--base-200)", padding: "1.5rem", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7 }}>
                    <div>
                      <h4 style={{ fontSize: "1.5rem", fontFamily: "Barlow Condensed" }}>Google Health Connect <span className="tag tag-3" style={{ fontSize: "0.6rem", marginLeft: 4 }}>Coming Soon</span></h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--base-secondary-dark)" }}>Sync steps, calories, and sleep from Android devices</p>
                    </div>
                  </div>

                  {/* Realme Link */}
                  <div style={{ backgroundColor: "var(--base-200)", padding: "1.5rem", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7 }}>
                    <div>
                      <h4 style={{ fontSize: "1.5rem", fontFamily: "Barlow Condensed" }}>Realme Link <span className="tag tag-3" style={{ fontSize: "0.6rem", marginLeft: 4 }}>Bridge Soon</span></h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--base-secondary-dark)" }}>Sync smartwatches via Google Health Connect integration</p>
                    </div>
                  </div>
                </div>

                {stravaMsg && (
                  <p className="mono" style={{ color: "var(--accent-3)", marginTop: "1rem", fontSize: "0.82rem" }}>▶ {stravaMsg}</p>
                )}
              </div>

              {/* Data & Privacy */}
              <div style={{ borderTop: "1px solid var(--base-200)", paddingTop: "1.5rem" }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>▶ Data Management & Privacy</p>
                <p style={{ fontSize: "0.88rem", color: "var(--base-secondary-dark)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  All health, nutrition, spending, and activity records logged are completely private to your account. We never sell your data.
                </p>
                <Link href="/privacy" style={{ fontSize: "0.82rem", textDecoration: "underline", color: "var(--base-300)" }} className="mono">
                  Read Privacy Policy
                </Link>
              </div>
            </div>

          </div>
        </section>

      </main>
    </LenisProvider>
  );
}
