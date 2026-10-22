export default function LogLoading() {
  return (
    <div style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
      {/* ── Top Header Skeleton ── */}
      <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
        <div className="container">
          <div style={{ height: "1rem", width: "100px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "4px", marginBottom: "0.5rem" }} />
          <div style={{ height: "4rem", width: "320px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "8px", marginBottom: "0.5rem" }} />
          <div style={{ height: "1.2rem", width: "420px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
        </div>
      </section>

      {/* ── Form Card Skeleton ── */}
      <section style={{ padding: "3rem 0 6rem" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div
            style={{
              minHeight: "420px",
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1.5px dashed rgba(249,244,235,0.12)",
              borderRadius: "20px",
              padding: "3rem 2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.5rem",
            }}
          >
            <div style={{ height: "2.5rem", width: "240px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "30px" }} />
            <div style={{ height: "5rem", width: "100%", maxWidth: "600px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "12px" }} />
            <div style={{ height: "3rem", width: "180px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "8px" }} />
          </div>
        </div>
      </section>
    </div>
  );
}
