"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/", label: "Index" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/log", label: "Log Meal" },
  { href: "/activities", label: "Activities" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Insights" },
  { href: "/compare", label: "Compare" },
  { href: "/goals", label: "Goals" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [time, setTime] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLLIElement[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Live clock (IST)
  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setTime(t);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll hide/show
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastScrollY.current && y > 100);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GSAP menu animation
  useEffect(() => {
    if (!overlayRef.current) return;
    if (open) {
      gsap.to(overlayRef.current, { scaleY: 1, duration: 0.5, ease: "power3.out", transformOrigin: "top" });
      gsap.to(linksRef.current, {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.2, ease: "power3.out",
      });
      gsap.to(footerRef.current, { opacity: 1, duration: 0.4, delay: 0.45, ease: "power2.out" });
    } else {
      gsap.to(linksRef.current, { opacity: 0, y: 10, duration: 0.2, stagger: 0.03 });
      gsap.to(footerRef.current, { opacity: 0, duration: 0.2 });
      gsap.to(overlayRef.current, { scaleY: 0, duration: 0.45, delay: 0.1, ease: "power3.in", transformOrigin: "top" });
    }
  }, [open]);

  // Init hidden state
  useEffect(() => {
    if (!overlayRef.current) return;
    gsap.set(overlayRef.current, { scaleY: 0 });
    gsap.set(linksRef.current, { opacity: 0, y: 15 });
    gsap.set(footerRef.current, { opacity: 0 });
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav className="nav-menu" style={{ position: "fixed", top: "1.5rem", left: "50%", transform: `translateX(-50%) ${hidden ? "translateY(-200%)" : "translateY(0)"}`, width: "52%", maxWidth: 640, zIndex: 1000, transition: "transform 0.4s ease" }}>
      {/* Header bar */}
      <div style={{ position: "relative", padding: "0.9rem 1.5rem 0.9rem 1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--base-300)", borderRadius: 8, zIndex: 2 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--accent-3)" }} />
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.75rem", color: "var(--base-100)", textTransform: "uppercase", letterSpacing: "0.1em" }}>NutriTrack AI</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* User avatar / login button */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "var(--accent-1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "var(--base-300)" }}>
                  {(user.email?.[0] || "U").toUpperCase()}
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "0.7rem",
                color: "var(--accent-3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Login
            </Link>
          )}

          <button onClick={() => setOpen(o => !o)} aria-label="Toggle menu" style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0.5rem", cursor: "pointer", background: "none", border: "none" }}>
            <span style={{ display: "block", width: 20, height: 2, backgroundColor: "var(--base-100)", borderRadius: 1, transition: "all 0.25s ease", transform: open ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <span style={{ display: "block", width: 20, height: 2, backgroundColor: "var(--base-100)", borderRadius: 1, transition: "all 0.25s ease", transform: open ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Dropdown overlay */}
      <div ref={overlayRef} style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "var(--base-300)", borderRadius: "0 0 8px 8px", marginTop: -8, paddingTop: 8, overflow: "hidden", transformOrigin: "top" }}>
        <ul style={{ listStyle: "none", padding: "1.5rem 0 1rem" }}>
          {navLinks.map((l, i) => (
            <li key={l.href} ref={el => { if (el) linksRef.current[i] = el; }} style={{ margin: "-4px 0" }}>
              <Link href={l.href} style={{ display: "block", padding: "0.4rem 1.75rem", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "4rem", textTransform: "uppercase", color: pathname === l.href ? "var(--accent-3)" : "var(--base-100)", lineHeight: 0.9, letterSpacing: "-0.02rem", transition: "color 0.2s ease" }}
                onMouseEnter={e => { if (pathname !== l.href)(e.target as HTMLElement).style.color = "var(--accent-1)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = pathname === l.href ? "var(--accent-3)" : "var(--base-100)"; }}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div ref={footerRef} style={{ padding: "0.75rem 1.75rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {user ? (
              <>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.78rem", color: "var(--base-secondary-dark)", textTransform: "uppercase" }}>
                  {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                </span>
                <button
                  onClick={signOut}
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: "0.78rem",
                    color: "var(--accent-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                  }}
                >
                  &#9654; Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: "0.78rem",
                  color: "var(--accent-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                &#9654; Sign In
              </Link>
            )}
          </div>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.78rem", color: "var(--base-secondary-dark)" }}>{time} IST</span>
        </div>
      </div>
    </nav>
  );
}
