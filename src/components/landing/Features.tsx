"use client";

import { useEffect, useRef } from "react";

const features = [
  {
    title: "Monaco Editor",
    description: "Professional code editor experience with syntax highlighting, autocomplete, and smart formatting for screenplay elements.",
    icon: "✍️",
  },
  {
    title: "Scene Navigation",
    description: "Jump between scenes instantly with the sidebar. Parse and navigate your screenplay structure effortlessly.",
    icon: "🎬",
  },
  {
    title: "AI Coaching",
    description: "Get context-aware questions and observations from your writing coach. Director Mode or Strict Socratic style.",
    icon: "🤖",
  },
  {
    title: "Smart Formatting",
    description: "Auto-format screenplay elements with proper indentation. Tab to cycle between action, character, dialogue, and more.",
    icon: "⚡",
  },
  {
    title: "Conversation History",
    description: "Your coaching conversations are saved. Build a personalized writing profile that adapts to your style.",
    icon: "💬",
  },
  {
    title: "Cloud Sync",
    description: "Your work is automatically saved and synced. Access your projects from anywhere, anytime.",
    icon: "☁️",
  },
];

export function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(".feature-card");
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add("opacity-100", "translate-y-0");
              }, index * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-black uppercase tracking-widest text-[#FF4F00] sm:text-4xl md:text-5xl">
            Features
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Everything you need to write professional screenplays
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card rounded-lg border border-gray-800 bg-black/50 p-8 opacity-0 translate-y-10 transition-all duration-700 backdrop-blur-sm hover:border-[#FF4F00] hover:bg-black/70"
            >
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="mb-3 text-xl font-bold uppercase tracking-widest text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
