"use client";
import { useEffect, useRef } from "react";
import HeroSection from "@/components/HeroSection";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SKILLS = [
  ["Calorie Tracking", "Macro Analysis", "AI Nutrition", "Smart Budget", "Meal Planning", "Food History"],
  ["Gemini AI", "Random Forest", "Supabase", "Real-time Logs", "Visual Charts"],
  ["Protein Goals", "Carb Tracking", "Fat Monitoring", "Fiber Intake", "Spending Trends", "Progress Compare"],
];
const SKILL_COLORS = ["tag-1", "tag-2", "tag-3"];

const HOW_CARDS = [
  { num: "01", title: "Log Your Meal", desc: "Type what you ate and the cost. Our AI handles the rest — calories, macros, category.", accent: "var(--accent-1)" },
  { num: "02", title: "AI Analyzes", desc: "Google Gemini extracts precise nutrition data and categorizes your food instantly.", accent: "var(--accent-2)" },
  { num: "03", title: "Track & Improve", desc: "View charts, compare periods, get personalized meal plans based on your history.", accent: "var(--accent-3)" },
];

export default function Home() {
  const stripRefs = useRef<HTMLDivElement[]>([]);
  const howRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Horizontal strips parallax
    const speeds = [0.3, -0.2, 0.25];
    ScrollTrigger.create({
      trigger: ".outro-section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        stripRefs.current.forEach((strip, i) => {
          const dir = speeds[i];
          gsap.set(strip, { x: `${self.progress * 100 * dir}%` });
        });
      },
    });

    // How it works scroll reveal
    const cards = document.querySelectorAll(".how-card");
    cards.forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 0.7, delay: i * 0.15, ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 85%" },
      });
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <LenisProvider>
      <Nav />

      {/* ── Hero ────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── How it works ────────────────────────────────────── */}
      <section ref={howRef} style={{ position: "relative", width: "100vw", minHeight: "100svh", backgroundColor: "var(--base-300)", color: "var(--base-100)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "8rem 0" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", padding: "1.5rem 2.75rem", display: "flex", justifyContent: "space-between" }}>
          <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>▶ System Pipeline</p>
          <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>[ How it works ]</p>
        </div>

        <div className="container">
          <h3 style={{ color: "var(--base-100)", marginBottom: "3rem", width: "60%" }}>
            From plate to insights in seconds
          </h3>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {HOW_CARDS.map(c => (
              <div key={c.num} className="how-card" style={{ flex: 1, minWidth: 240, backgroundColor: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(249,244,235,0.12)", borderRadius: 16, padding: "2rem" }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1rem" }}>{c.num}</p>
                <h4 style={{ color: c.accent, marginBottom: "1rem", fontSize: "2rem" }}>{c.title}</h4>
                <p style={{ color: "var(--base-secondary-dark)", fontSize: "0.95rem", lineHeight: 1.6 }}>{c.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "4rem", display: "flex", gap: "1rem" }}>
            <Link href="/log" className="btn-primary btn-accent" style={{ fontSize: "0.82rem" }}>▶ Start Logging</Link>
            <Link href="/dashboard" className="btn-primary" style={{ fontSize: "0.82rem", border: "1px solid rgba(249,244,235,0.2)" }}>View Dashboard</Link>
          </div>
        </div>
      </section>

      {/* ── Outro strips ────────────────────────────────────── */}
      <section className="outro-section" style={{ position: "relative", width: "100vw", minHeight: "100svh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-around", width: "150vw", left: "-25vw" }}>
          {SKILLS.map((row, i) => (
            <div key={i} ref={el => { if (el) stripRefs.current[i] = el; }} className="strip-row">
              {[...row, ...row].map((skill, j) => (
                <span key={j} className={`tag ${SKILL_COLORS[i % 3]}`} style={{ whiteSpace: "nowrap", padding: "6px 14px", fontSize: "0.78rem" }}>{skill}</span>
              ))}
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <h3 style={{ width: "100%", maxWidth: 700, color: "var(--base-300)" }}>
            Every meal tells a story
          </h3>
          <p style={{ marginTop: "1rem", color: "var(--base-secondary-dark)", fontSize: "1.1rem" }}>
            NutriTrack AI reads it for you
          </p>
        </div>
      </section>

      {/* ── CTA footer ──────────────────────────────────────── */}
      <section ref={ctaRef} style={{ backgroundColor: "var(--base-300)", padding: "5rem 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "2rem" }}>
          <div>
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>▶ Ready to start?</p>
            <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,6vw,7rem)" }}>Track Smarter</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Link href="/log" className="btn-primary btn-accent">▶ Log First Meal</Link>
            <Link href="/goals" className="btn-primary" style={{ border: "1px solid rgba(249,244,235,0.2)" }}>Set My Goals</Link>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "3rem", paddingTop: "2rem" }}>
          <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>NutriTrack AI © 2026</p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/privacy" style={{ textDecoration: "underline" }} className="mono">
                Privacy Policy
              </Link>
              <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>AMD Ideathon</p>
            </div>
          </div>
        </div>
      </section>
    </LenisProvider>
  );
}
