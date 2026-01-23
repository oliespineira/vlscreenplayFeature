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

    const centerX = window.innerWidth * 0.5;
    const centerY = window.innerHeight * 0.5;

    // Each blob has physics state with random targets
    const state: BlobState[] = blobs.map((el, i) => {
      const angle = (i / blobs.length) * Math.PI * 2;
      const radius = 200 + Math.random() * 150;
      return {
        el,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        mass: 1 + i * 0.25,
        phase: Math.random() * Math.PI * 2,
      };
    });

    // Cursor position for repulsion
    let cursorX = window.innerWidth * 0.5;
    let cursorY = window.innerHeight * 0.5;

    const handlePointerMove = (e: PointerEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    // Generate random targets for each blob
    const generateRandomTarget = () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
    });

    // Each blob gets its own random target
    const targets = state.map(() => generateRandomTarget());
    const targetChangeInterval = 3000; // ms
    let lastTargetChange = 0;

    // Animate
    let rafId: number;
    function tick(t: number) {
      const time = t * 0.001;

      // Change targets periodically
      if (t - lastTargetChange > targetChangeInterval) {
        state.forEach((_, i) => {
          targets[i] = generateRandomTarget();
        });
        lastTargetChange = t;
      }

      state.forEach((b, i) => {
        const target = targets[i];

        // Add gentle orbital motion for organic feel
        const angle = b.phase + time * (0.2 + i * 0.03);
        const orbitalX = Math.cos(angle) * 80;
        const orbitalY = Math.sin(angle) * 80;

        // Target position with orbital offset
        const targetX = target.x + orbitalX;
        const targetY = target.y + orbitalY;

        // Soft spring force toward random target
        const stiffness = 0.008;
        const damping = 0.92;
        let ax = (targetX - b.x) * (stiffness / b.mass);
        let ay = (targetY - b.y) * (stiffness / b.mass);

        // REPULSION FROM CURSOR (only pushes away, never attracts)
        const dx = b.x - cursorX;
        const dy = b.y - cursorY;
        const distToCursor = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Apply strong repulsion when cursor is close
        const repelRadius = 300;
        if (distToCursor < repelRadius) {
          const repelStrength = (1 - distToCursor / repelRadius) * 15;
          const dirX = dx / distToCursor;
          const dirY = dy / distToCursor;
          
          // Add repulsion force (pushes AWAY from cursor)
          ax += dirX * repelStrength;
          ay += dirY * repelStrength;
        }

        // Integrate velocity with damping
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
