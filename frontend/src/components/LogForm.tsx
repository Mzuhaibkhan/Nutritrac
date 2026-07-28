"use client";
import { useState, useEffect } from "react";
import { apiPost, apiFetch } from "@/lib/api";

interface LogResult {
  food_item: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  category: string;
  meal_type: string;
  cost: number;
  cost_inr?: number;
  smart_score?: number;
  smart_label?: string;
  smart_advice?: string;
  error?: string;
}

interface LogFormProps {
  onSuccess?: (result: LogResult) => void;
}

export default function LogForm({ onSuccess }: LogFormProps) {
  const [mode, setMode] = useState<"ai" | "manual" | "photo">("ai");
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogResult | null>(null);
  const [error, setError] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [currency, setCurrency] = useState("INR");

  const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
  const [mealType, setMealType] = useState("lunch");

  // Manual Form Fields
  const [manualFood, setManualFood] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualProt, setManualProt] = useState("");
  const [manualCarb, setManualCarb] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualFiber, setManualFiber] = useState("");
  const [manualCost, setManualCost] = useState("");
  const [manualCategory, setManualCategory] = useState("Other");

  const CATEGORIES = [
    "Healthy", "Protein", "Fruit", "Vegetable", "Dairy",
    "Grain", "Snack", "Beverage", "Fast Food", "Other"
  ];

  useEffect(() => {
    // Load currency preference from profile
    const loadCurrency = async () => {
      try {
        const res = await apiFetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setCurrency(data.preferred_currency || "INR");
        }
      } catch (err) {
        console.error("Failed to load currency preference", err);
      }
    };
    loadCurrency();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setFlipped(false);

    try {
      let data: LogResult;

      if (mode === "ai") {
        if (!text.trim()) return;
        const res = await apiPost("/api/analyze", { text, meal_type: mealType });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
      } else if (mode === "photo") {
        if (!selectedFile) throw new Error("Please upload or capture a photo first");
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("meal_type", mealType);

        const res = await apiPost("/api/analyze-image", formData);
        data = await res.json();
        if (!res.ok) throw new Error(data.error || "Photo analysis failed");
      } else {
        if (!manualFood.trim()) throw new Error("Food name is required");
        if (!manualCal) throw new Error("Calories are required");

        const costVal = parseFloat(manualCost) || 0;
        const payload = {
          food_item: manualFood,
          calories: parseInt(manualCal) || 0,
          protein_g: parseFloat(manualProt) || 0,
          carbs_g: parseFloat(manualCarb) || 0,
          fats_g: parseFloat(manualFat) || 0,
          fiber_g: parseFloat(manualFiber) || 0,
          cost: currency === "USD" ? costVal : costVal / 83.5,
          cost_inr: currency === "INR" ? costVal : costVal * 83.5,
          category: manualCategory,
          meal_type: mealType
        };

        const res = await apiPost("/api/food/manual", payload);
        data = await res.json();
        if (!res.ok) throw new Error(data.error || "Saving failed");
      }

      // Fetch ML prediction score
      const mlRes = await apiPost("/api/predict", {
        calories: data.calories,
        cost: data.cost,
        category: data.category
      });
      if (mlRes.ok) {
        const mlData = await mlRes.json();
        data.smart_score = mlData.score;
        data.smart_label = mlData.label;
        data.smart_advice = mlData.advice;
      }

      setResult(data);
      setTimeout(() => setFlipped(true), 300);
      onSuccess?.(data);

      // Clear fields
      if (mode === "manual") {
        setManualFood("");
        setManualCal("");
        setManualProt("");
        setManualCarb("");
        setManualFat("");
        setManualFiber("");
        setManualCost("");
      } else if (mode === "photo") {
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to log meal. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s?: number) => {
    if (!s) return "var(--base-secondary-dark)";
    if (s >= 75) return "var(--accent-4)";
    if (s >= 50) return "var(--accent-3)";
    return "var(--accent-2)";
  };

  return (
    <div>
      {/* Mode switcher */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => { setMode("ai"); setError(""); setResult(null); }}
          style={{ padding: "0.4rem 1rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.75rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: mode === "ai" ? "var(--base-300)" : "var(--base-200)", color: mode === "ai" ? "var(--base-100)" : "var(--base-secondary-dark)", transition: "all 0.25s ease" }}>
          ▶ AI text description
        </button>
        <button type="button" onClick={() => { setMode("photo"); setError(""); setResult(null); }}
          style={{ padding: "0.4rem 1rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.75rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: mode === "photo" ? "var(--base-300)" : "var(--base-200)", color: mode === "photo" ? "var(--base-100)" : "var(--base-secondary-dark)", transition: "all 0.25s ease" }}>
          📸 photo upload
        </button>
        <button type="button" onClick={() => { setMode("manual"); setError(""); setResult(null); }}
          style={{ padding: "0.4rem 1rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.75rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: mode === "manual" ? "var(--base-300)" : "var(--base-200)", color: mode === "manual" ? "var(--base-100)" : "var(--base-secondary-dark)", transition: "all 0.25s ease" }}>
          ▶ Manual Entry
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Meal type selector */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {MEAL_TYPES.map(m => (
            <button key={m} type="button" onClick={() => setMealType(m)}
              style={{ padding: "0.3rem 0.75rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.72rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: mealType === m ? "var(--base-300)" : "var(--base-200)", color: mealType === m ? "var(--base-100)" : "var(--base-secondary-dark)", transition: "all 0.2s ease" }}>
              {m}
            </button>
          ))}
        </div>

        {mode === "ai" && (
          <div style={{ position: "relative" }}>
            <textarea className="input-field" value={text} onChange={e => setText(e.target.value)}
              placeholder="e.g. grilled chicken salad with olive oil, cost ₹250..."
              rows={3} style={{ resize: "none", lineHeight: 1.6 }} />
          </div>
        )}

        {mode === "photo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ border: "2px dashed var(--base-secondary-dark)", borderRadius: 12, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ opacity: 0, position: "absolute", inset: 0, cursor: "pointer" }} />
              <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.85rem" }}>
                {selectedFile ? `✓ File: ${selectedFile.name}` : "📸 Click to snap or upload a meal photo"}
              </p>
            </div>
            {previewUrl && (
              <div style={{ display: "flex", justifyContent: "center", maxHeight: 200, overflow: "hidden", borderRadius: 8 }}>
                <img src={previewUrl} alt="Meal preview" style={{ objectFit: "contain", maxHeight: "100%", maxWidth: "100%" }} />
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ gridColumn: "span 2" }}>
              <input type="text" className="input-field" placeholder="Food item name (e.g. Eggs & Toast)" value={manualFood} onChange={e => setManualFood(e.target.value)} required />
            </div>
            <div>
              <input type="number" className="input-field" placeholder="Calories (kcal) *" value={manualCal} onChange={e => setManualCal(e.target.value)} required min={0} />
            </div>
            <div>
              <input type="number" className="input-field" placeholder={`Cost (${currency === "INR" ? "₹" : "$"})`} value={manualCost} onChange={e => setManualCost(e.target.value)} min={0} />
            </div>
            <div>
              <input type="number" className="input-field" placeholder="Protein (g)" value={manualProt} onChange={e => setManualProt(e.target.value)} min={0} />
            </div>
            <div>
              <input type="number" className="input-field" placeholder="Carbs (g)" value={manualCarb} onChange={e => setManualCarb(e.target.value)} min={0} />
            </div>
            <div>
              <input type="number" className="input-field" placeholder="Fat (g)" value={manualFat} onChange={e => setManualFat(e.target.value)} min={0} />
            </div>
            <div>
              <input type="number" className="input-field" placeholder="Fiber (g)" value={manualFiber} onChange={e => setManualFiber(e.target.value)} min={0} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <select className="input-field" value={manualCategory} onChange={e => setManualCategory(e.target.value)} style={{ paddingRight: "1rem" }}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading || (mode === "ai" && !text.trim()) || (mode === "photo" && !selectedFile)} className="btn-primary"
          style={{ alignSelf: "flex-start", opacity: loading || (mode === "ai" && !text.trim()) || (mode === "photo" && !selectedFile) ? 0.5 : 1 }}>
          {loading ? "Logging..." : mode === "ai" ? "▶ Analyze Meal" : mode === "photo" ? "▶ Analyze Photo" : "▶ Save Meal"}
        </button>

        {error && <p className="mono" style={{ color: "var(--accent-2)" }}>{error}</p>}
      </form>

      {/* Result Card */}
      {result && (
        <div style={{ marginTop: "2rem", perspective: 1200 }}>
          <div style={{ position: "relative", width: "100%", minHeight: 280, transformStyle: "preserve-3d", transition: "transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
            {/* Front - loading */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", backgroundColor: "var(--accent-3)", borderRadius: 12, padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="mono">Processing meal details...</p>
            </div>
            {/* Back - result */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "var(--base-300)", borderRadius: 12, padding: "1.75rem", color: "var(--base-100)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.25rem" }}>Food Item</p>
                  <h4 style={{ textTransform: "uppercase", fontFamily: "Barlow Condensed", fontSize: "1.75rem", lineHeight: 1 }}>{result.food_item}</h4>
                </div>
                {result.smart_score !== undefined && (
                  <div style={{ textAlign: "right" }}>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Smart Score</p>
                    <div style={{ fontFamily: "Barlow Condensed", fontSize: "3rem", fontWeight: 900, color: scoreColor(result.smart_score), lineHeight: 1 }}>
                      {Math.round(result.smart_score)}
                    </div>
                    <span className="tag tag-1" style={{ fontSize: "0.65rem" }}>{result.smart_label}</span>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                {[
                  { label: "Calories", val: result.calories, unit: "kcal", color: "var(--accent-3)" },
                  { label: "Protein", val: result.protein_g, unit: "g", color: "var(--accent-1)" },
                  { label: "Carbs", val: result.carbs_g, unit: "g", color: "var(--accent-4)" },
                  { label: "Fat", val: result.fats_g, unit: "g", color: "var(--accent-2)" },
                ].map(m => (
                  <div key={m.label} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "0.75rem" }}>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.65rem" }}>{m.label}</p>
                    <div style={{ fontFamily: "Barlow Condensed", fontSize: "1.75rem", fontWeight: 900, color: m.color, lineHeight: 1.1 }}>{m.val}<span style={{ fontSize: "0.85rem", marginLeft: 2 }}>{m.unit}</span></div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="tag tag-1">{result.category}</span>
                <span className="tag tag-2">
                  {currency === "INR" ? `₹${result.cost_inr || Math.round(result.cost * 83.5)}` : `$${result.cost || Math.round((result.cost_inr || 0) / 83.5)}`}
                </span>
                <span className="tag tag-3">{result.meal_type}</span>
              </div>

              {result.smart_advice && (
                <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--base-secondary-dark)", fontStyle: "italic" }}>
                  ▶ {result.smart_advice}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
