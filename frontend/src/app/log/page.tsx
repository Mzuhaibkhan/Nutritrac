"use client";
import dynamic from "next/dynamic";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";

const LogForm = dynamic(() => import("@/components/LogForm"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--base-secondary-dark)" }}>
      <p className="mono">▶ Loading meal log form...</p>
    </div>
  ),
});

export default function LogPage() {
  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ New Entry</p>
            <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Log Meal</h2>
            <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem", maxWidth: 500 }}>
              Describe what you ate and the cost. Gemini AI will extract all nutritional data automatically.
            </p>
          </div>
        </section>
        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <LogForm />
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
