"use client";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";

export default function TermsAndConditionsPage() {
  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Legal Information</p>
            <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Terms & Conditions</h2>
            <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem" }}>Effective date: July 13, 2026</p>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container" style={{ maxWidth: 800, color: "var(--base-300)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", lineHeight: 1.7 }}>
              
              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>1. Acceptance of Terms</h4>
                <p>
                  By accessing or using the NutriTrack AI web application, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>2. Use of Service</h4>
                <p>
                  NutriTrack AI provides AI-powered health and nutrition insights. 
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <li><strong>Not Medical Advice:</strong> Our services, AI predictions, and meal plans do not constitute medical advice. Always consult a healthcare professional before changing your diet or fitness routine.</li>
                  <li><strong>Account Security:</strong> You are responsible for safeguarding the password and credentials that you use to access the service.</li>
                  <li><strong>Fair Use:</strong> You agree not to abuse the AI generation endpoints or attempt to bypass rate limits.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>3. Intellectual Property</h4>
                <p>
                  The Service and its original content, features, and functionality are and will remain the exclusive property of NutriTrack AI and its licensors. Our trademarks may not be used in connection with any product or service without our prior written consent.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>4. Third-Party Links & Services</h4>
                <p>
                  Our Service may contain links to third-party web sites or services that are not owned or controlled by NutriTrack AI (e.g., Strava). We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>5. Limitation of Liability</h4>
                <p>
                  In no event shall NutriTrack AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "Barlow Condensed", fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>6. Contact Us</h4>
                <p>
                  If you have any questions about these Terms, please contact us at: <span className="mono" style={{ textDecoration: "underline" }}>legal@nutritrack.ai</span>
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
