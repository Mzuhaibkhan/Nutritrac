"use client";
import dynamic from "next/dynamic";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";

const GoalForm = dynamic(() => import("@/components/GoalForm"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--base-secondary-dark)" }}>
      <p className="mono">▶ Loading goal planner...</p>
    </div>
  ),
});

export default function GoalsPage() {
  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Mission Control</p>
            <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Goals</h2>
            <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem", maxWidth: 500 }}>
              Set your nutritional and budget targets. Gemini AI will generate a personalized 7-day meal plan based on your goals and eating history.
            </p>
          </div>
        </section>
        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            <GoalForm />
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
