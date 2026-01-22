"use client";

import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Screenwriter",
    content:
      "DION transformed how I write. The AI coach asks the right questions and helps me discover my own solutions. Director Mode is brilliant.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Filmmaker",
    content:
      "The scene navigation and smart formatting save me hours. I can focus on the story instead of wrestling with formatting.",
    rating: 5,
  },
  {
    name: "Emma Thompson",
    role: "Writer",
    content:
      "The conversation history feature is a game-changer. My coach remembers our discussions and adapts to my writing style. It feels personal.",
    rating: 5,
  },
  {
    name: "James Park",
    role: "Director",
    content:
      "Finally, a screenplay tool that understands the craft. The Monaco editor with screenplay-specific features is exactly what I needed.",
    rating: 5,
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100");
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

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative py-24 opacity-0 transition-opacity duration-700 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-black uppercase tracking-widest text-[#FF4F00] sm:text-4xl md:text-5xl">
            Testimonials
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            What writers are saying
          </p>
        </div>

        <div
          className="relative mx-auto max-w-4xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden rounded-lg border border-gray-800 bg-black/50 p-8 backdrop-blur-sm">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="min-w-full flex-shrink-0 px-4 text-center"
                >
                  <div className="mb-4 flex justify-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-[#FF4F00]">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="mb-6 text-lg italic text-gray-300">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-bold uppercase tracking-widest text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-[#FF4F00]"
                    : "w-2 bg-gray-700 hover:bg-gray-600"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
