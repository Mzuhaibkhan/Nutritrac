export default function DashboardLoading() {
  return (
    <div style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
      {/* ── Top Header Skeleton ── */}
      <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
        <div className="container">
          <div style={{ height: "1rem", width: "120px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "4px", marginBottom: "1rem" }} />
          <div style={{ height: "3.5rem", width: "300px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "8px", marginBottom: "1rem" }} />
          <div style={{ height: "1.2rem", width: "240px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
        </div>
      </section>

      {/* ── Content Grid Skeleton ── */}
      <div className="container" style={{ padding: "3rem 0 6rem" }}>
        {/* Metric Cards Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "140px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(249,244,235,0.08)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ height: "0.9rem", width: "80px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "4px" }} />
              <div style={{ height: "2rem", width: "120px", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "6px" }} />
              <div style={{ height: "0.6rem", width: "100%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: "320px",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(249,244,235,0.1)",
                borderRadius: "16px",
                padding: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.85rem" }}>
                ▶ Loading analytics data...
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
