"use client";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";

export default function PrivacyPolicyPage() {
  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Legal Information</p>
            <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Privacy Policy</h2>
            <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem" }}>Effective date: July 13, 2026</p>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container" style={{ maxWidth: 800, color: "var(--base-300)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", lineHeight: 1.7 }}>
              
              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>1. Introduction</h4>
                <p>
                  Welcome to NutriTrack AI (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>2. Information We Collect</h4>
                <p>
                  We collect personal information that you voluntarily provide to us when you register, log in, or use the App. The personal information we collect includes:
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <li><strong>Account Credentials:</strong> We use Supabase Auth to handle Google OAuth and email logins. This includes your email address, name, and profile picture.</li>
                  <li><strong>Health & Nutrition Data:</strong> Meals logged manually or via Gemini AI analysis, calories, macronutrients (proteins, carbs, fats), and cost.</li>
                  <li><strong>Activity Data:</strong> Step counts, active minutes, duration, distance, heart rate, and workouts logged manually or synced from third-party apps like Strava.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>3. How We Use Your Information</h4>
                <p>
                  We use personal information collected via our App for a variety of business purposes described below:
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <li>To facilitate account creation and logon process (Google OAuth / Supabase Auth).</li>
                  <li>To track, calculate, and display nutrition intake, cost metrics, and activity performance.</li>
                  <li>To generate personalized, AI-powered meal plans and health insights (using Google Gemini API).</li>
                  <li>To provide user data isolation so that each user has access only to their own files.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>4. Third-Party Integrations</h4>
                <p>
                  Our app allows you to connect third-party platforms like Strava. When you connect these services:
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <li>We collect and sync only the activities from the last 30 days that you permit.</li>
                  <li>Your credentials and access tokens are encrypted and securely stored in MongoDB.</li>
                  <li>You can disconnect these services at any time from your Account Settings.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>5. Data Security & Storage</h4>
                <p>
                  We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. All user data is securely stored in a private MongoDB Atlas database. However, please remember that no method of transmission over the internet or database storage is 100% secure.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>6. Contact Us</h4>
                <p>
                  If you have questions or comments about this policy, you may contact us at: <span className="mono" style={{ textDecoration: "underline" }}>privacy@nutritrack.ai</span>
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
