"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("nutritrack_cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("nutritrack_cookie_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--base-300)",
        color: "var(--base-100)",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        zIndex: 9999,
        boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
        fontFamily: "DM Mono, monospace",
      }}
    >
      <div style={{ flex: "1 1 300px", fontSize: "0.85rem", lineHeight: 1.5 }}>
        We use cookies to ensure you get the best experience on our website. By continuing to use this site, you agree to our{" "}
        <Link href="/privacy" style={{ textDecoration: "underline", color: "var(--accent-3)" }}>
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" style={{ textDecoration: "underline", color: "var(--accent-3)" }}>
          Terms & Conditions
        </Link>.
      </div>
      <button
        onClick={handleAccept}
        className="btn-primary"
        style={{
          padding: "0.5rem 1.5rem",
          fontSize: "0.85rem",
          whiteSpace: "nowrap",
        }}
      >
        Accept & Close
      </button>
    </div>
  );
}
