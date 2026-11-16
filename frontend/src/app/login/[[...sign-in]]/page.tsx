"use client";
import { Suspense, useEffect } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(redirect);
    }
  }, [isLoaded, isSignedIn, redirect, router]);

  if (isLoaded && isSignedIn) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(10, 10, 10, 0.08)",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06)",
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "var(--accent-3, #ffdd94)",
            margin: "0 auto 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "1.2rem",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--base-300, #0a0a0a)",
            marginBottom: "0.5rem",
          }}
        >
          Successfully Signed In
        </h3>
        <p style={{ color: "var(--base-secondary-dark, #686560)", fontSize: "0.875rem" }}>
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <SignIn
      path="/login"
      signUpUrl="/sign-up"
      forceRedirectUrl={redirect}
      fallbackRedirectUrl={redirect}
      appearance={{
        elements: {
          rootBox: {
            width: "100%",
            maxWidth: "420px",
          },
          card: {
            backgroundColor: "#ffffff",
            border: "1px solid rgba(10, 10, 10, 0.08)",
            borderRadius: "20px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06)",
            padding: "2rem",
          },
          headerTitle: {
            color: "var(--base-300, #0a0a0a)",
            fontFamily: "var(--font-heading, 'Host Grotesk', sans-serif)",
            fontWeight: 700,
            fontSize: "1.5rem",
            letterSpacing: "-0.02em",
          },
          headerSubtitle: {
            color: "var(--base-secondary-dark, #686560)",
            fontSize: "0.875rem",
          },
          socialButtonsBlockButton: {
            backgroundColor: "var(--base-100, #f9f4eb)",
            borderColor: "rgba(10, 10, 10, 0.1)",
            color: "var(--base-300, #0a0a0a)",
            borderRadius: "12px",
            fontWeight: 500,
          },
          socialButtonsBlockButtonText: {
            color: "var(--base-300, #0a0a0a)",
            fontWeight: 500,
          },
          dividerRow: {
            margin: "1.25rem 0",
          },
          dividerLine: {
            backgroundColor: "rgba(10, 10, 10, 0.1)",
          },
          dividerText: {
            color: "var(--base-secondary-dark, #686560)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
          formFieldLabel: {
            color: "var(--base-300, #0a0a0a)",
            fontSize: "0.825rem",
            fontWeight: 500,
          },
          formFieldInput: {
            backgroundColor: "var(--base-100, #f9f4eb)",
            borderColor: "rgba(10, 10, 10, 0.12)",
            color: "var(--base-300, #0a0a0a)",
            borderRadius: "10px",
            fontSize: "0.875rem",
          },
          formButtonPrimary: {
            backgroundColor: "var(--accent-3, #ffdd94)",
            color: "#0a0a0a",
            fontWeight: 600,
            borderRadius: "12px",
            border: "none",
            boxShadow: "none",
          },
          footer: {
            backgroundColor: "transparent",
          },
          footerAction: {
            backgroundColor: "transparent",
          },
          footerActionText: {
            color: "var(--base-secondary-dark, #686560)",
          },
          footerActionLink: {
            color: "var(--base-300, #0a0a0a)",
            fontWeight: 600,
            textDecoration: "underline",
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
              color: "var(--base-300, #0a0a0a)",
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
