import type { Metadata } from "next";
import { Suspense } from "react";
import AuthProvider from "@/components/AuthProvider";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriTrack AI — Smart Food & Spending Intelligence",
  description:
    "Track your nutrition, monitor spending habits, and get AI-powered meal plans and insights powered by Google Gemini and machine learning.",
  keywords: "nutrition tracker, food log, spending tracker, AI meal plan, calorie tracker, health app",
  openGraph: {
    title: "NutriTrack AI",
    description: "Smart Food & Spending Intelligence powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense
          fallback={
            <div
              style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--base-100)",
              }}
            >
              <p
                className="mono"
                style={{ color: "var(--base-secondary-dark)" }}
              >
                Loading...
              </p>
            </div>
          }
        >
          <AuthProvider>
            {children}
            <CookieBanner />
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
