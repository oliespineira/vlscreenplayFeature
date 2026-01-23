"use client";

import { useEffect, useRef } from "react";

interface BlobState {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  phase: number;
}

export function MoltenBackground() {
  const gooLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = gooLayerRef.current;
    if (!layer) return;

    const blobs = Array.from(
      layer.querySelectorAll<HTMLDivElement>(".blob")
    );

    // Cursor target (in px)
    let tx = window.innerWidth * 0.5;
    let ty = window.innerHeight * 0.5;

    // Liquid feel controls
    let stiffness = 0.012; // spring strength toward target
    let damping = 0.86; // velocity retention (higher = thicker)
    let wobble = 0.14; // how much blobs orbit around cursor

    // Each blob has physics state
    const state: BlobState[] = blobs.map((el, i) => ({
      el,
      x: tx + (i - 1.5) * 120,
      y: ty + (i % 2 ? 140 : -140),
      vx: 0,
      vy: 0,
      mass: 1 + i * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));

    const handlePointerMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const handleResize = () => {
      tx = window.innerWidth * 0.5;
      ty = window.innerHeight * 0.5;
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("resize", handleResize);

    // Animate
    let rafId: number;
    function tick(t: number) {
      const time = t * 0.001;

      state.forEach((b, i) => {
        // Calculate vector from cursor to blob
        const dx = b.x - tx;
        const dy = b.y - ty;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Direction away from cursor
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Orbital motion for organic feel
        const angle = b.phase + time * (0.35 + i * 0.05);
        const orbitalX = Math.cos(angle) * 220 * wobble;
        const orbitalY = Math.sin(angle) * 220 * wobble;

        // Target position is away from cursor + orbital offset
        const repelDistance = 100 + i * 25;
        const targetX = tx + dirX * repelDistance + orbitalX;
        const targetY = ty + dirY * repelDistance + orbitalY;

        // Spring force toward target (pulls blob away from cursor)
        const ax = (targetX - b.x) * (stiffness / b.mass);
        const ay = (targetY - b.y) * (stiffness / b.mass);

        // Integrate velocity with damping ("viscosity")
        b.vx = (b.vx + ax) * damping;
        b.vy = (b.vy + ay) * damping;

        b.x += b.vx;
        b.y += b.vy;

        b.el.style.transform = `translate(${b.x}px, ${b.y}px) translate(-50%, -50%)`;
      });

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* SVG filter definition */}
      <svg width="0" height="0" className="absolute">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          ref={gooLayerRef}
          className="absolute inset-0"
          style={{
            filter: "url(#goo) blur(18px) saturate(1.3) contrast(1.1)",
            transform: "scale(1.1)",
          }}
        >
          {/* Shadow blob for depth */}
          <div
            className="blob absolute"
            style={{
              width: "760px",
              height: "760px",
              borderRadius: "999px",
              willChange: "transform",
              background: `radial-gradient(circle at 35% 35%,
                rgba(120, 20, 0, 0.95),
                rgba(30, 8, 6, 0.95) 40%,
                rgba(0,0,0,0) 70%)`,
              mixBlendMode: "multiply",
              opacity: 0.9,
            }}
          />
          {/* Light blobs */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="blob absolute"
              style={{
                width: "520px",
                height: "520px",
                borderRadius: "999px",
                willChange: "transform",
                background: `radial-gradient(circle at 30% 30%,
                  rgba(255, 250, 220, 0.95),
                  rgba(255, 170, 70, 0.75) 35%,
                  rgba(255, 90, 0, 0.45) 60%,
                  rgba(0,0,0,0) 72%)`,
                mixBlendMode: "screen",
                opacity: 0.95,
              }}
            />
          ))}
        </div>
      </div>

      {/* Film grain */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
          backgroundSize: "220px 220px",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}
