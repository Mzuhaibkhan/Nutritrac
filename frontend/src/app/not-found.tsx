"use client";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import Link from "next/link";

export default function NotFound() {
  return (
    <LenisProvider>
      <Nav />
      <main style={{ minHeight: "100vh", backgroundColor: "var(--base-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontFamily: "Barlow Condensed", fontSize: "clamp(6rem, 15vw, 12rem)", lineHeight: 1, color: "var(--accent-2)", textShadow: "4px 4px 0px rgba(0,0,0,0.1)" }}>
            404
          </h1>
          <h2 style={{ fontFamily: "Barlow Condensed", fontSize: "2.5rem", textTransform: "uppercase", color: "var(--base-300)", marginBottom: "1rem" }}>
            Page Not Found
          </h2>
          <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "2.5rem", maxWidth: 400, margin: "0 auto 2.5rem" }}>
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link href="/" className="btn-primary" style={{ padding: "0.8rem 2rem", fontSize: "1.1rem" }}>
            ▶ Return Home
          </Link>
        </div>
      </main>
    </LenisProvider>
  );
}
