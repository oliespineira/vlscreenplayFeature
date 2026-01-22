"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gray-900" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#FF4F00] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#FF4F00] blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="animate-fade-in-up">
          <h1 className="mb-6 text-4xl font-black uppercase tracking-widest text-[#FF4F00] sm:text-5xl md:text-6xl lg:text-7xl">
            Write Your
            <br />
            <span className="text-white">Screenplay</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-400 sm:text-xl md:text-2xl">
            Professional screenplay writing with AI-powered coaching. Transform your ideas into
            cinematic stories.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded bg-[#FF4F00] px-8 py-4 text-base font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-[#FF6B2B] active:scale-95 sm:text-lg"
            >
              Start Writing
            </Link>
            <Link
              href="#features"
              className="rounded border-2 border-[#FF4F00] px-8 py-4 text-base font-bold uppercase tracking-widest text-[#FF4F00] transition-all hover:bg-[#FF4F00] hover:text-black active:scale-95 sm:text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="h-8 w-8 text-[#FF4F00]"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
