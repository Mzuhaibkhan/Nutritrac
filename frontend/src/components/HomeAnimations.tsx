"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function HomeAnimations() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Horizontal strips parallax
    const speeds = [0.3, -0.2, 0.25];
    const strips = document.querySelectorAll<HTMLElement>(".strip-row");

    const st = ScrollTrigger.create({
      trigger: ".outro-section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        strips.forEach((strip, i) => {
          const dir = speeds[i] ?? 0.2;
          gsap.set(strip, { x: `${self.progress * 100 * dir}%` });
        });
      },
    });

    // How it works scroll reveal
    const cards = document.querySelectorAll(".how-card");
    const cardAnims: gsap.core.Tween[] = [];
    cards.forEach((card, i) => {
      cardAnims.push(
        gsap.fromTo(
          card,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
          }
        )
      );
    });

    return () => {
      st.kill();
      cardAnims.forEach((anim) => {
        anim.scrollTrigger?.kill();
        anim.kill();
      });
    };
  }, []);

  return null;
}
