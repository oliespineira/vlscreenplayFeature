"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Sign Up",
    description: "Create your account and set up your writer profile. Personalize your coaching style preferences.",
  },
  {
    number: "02",
    title: "Create a Project",
    description: "Start a new screenplay project. Organize multiple scripts within projects for better workflow.",
  },
  {
    number: "03",
    title: "Write Your Script",
    description: "Use the Monaco editor with smart formatting. Navigate scenes, get AI coaching, and let your story unfold.",
  },
  {
    number: "04",
    title: "Get Feedback",
    description: "Ask your AI coach about scenes or selections. Choose Director Mode for observations or Socratic for questions-only.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll(".step-item");
            items.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add("opacity-100", "translate-x-0");
              }, index * 200);
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
      id="how-it-works"
      className="relative py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-black uppercase tracking-widest text-yellow-500 sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Get started in minutes
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="step-item flex flex-col items-start gap-6 opacity-0 -translate-x-10 transition-all duration-700 md:flex-row md:items-center lg:gap-12"
            >
              <div className="flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-yellow-500 bg-black text-2xl font-black text-yellow-500">
                  {step.number}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-bold uppercase tracking-widest text-white">
                  {step.title}
                </h3>
                <p className="text-lg text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
