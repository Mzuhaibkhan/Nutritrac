"use client";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  return (
    <SignIn
      routing="hash"
      fallbackRedirectUrl={redirect}
      appearance={{
        elements: {
          card: {
            backgroundColor: "#111111",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          },
          headerTitle: {
            color: "#ffffff",
          },
          headerSubtitle: {
            color: "#888888",
          },
          socialButtonsBlockButton: {
            backgroundColor: "#1a1a1a",
            borderColor: "rgba(255, 255, 255, 0.15)",
            color: "#ffffff",
          },
          formButtonPrimary: {
            backgroundColor: "var(--accent-3, #b4f481)",
            color: "#0a0a0a",
            fontWeight: 600,
          },
        },
      }}
    />
  );
}

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--base-100)",
        padding: "2rem",
      }}
    >
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "var(--accent-3)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-heading, sans-serif)",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--base-secondary-light, #ffffff)",
              letterSpacing: "-0.02em",
            }}
          >
            NUTRITRACK<span style={{ color: "var(--accent-3)" }}>.AI</span>
          </span>
        </Link>
      </div>

      <Suspense fallback={<div style={{ color: "var(--base-secondary-dark)" }}>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
