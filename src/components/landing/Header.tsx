"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface HeaderProps {
  isScrolled: boolean;
}

export function Header({ isScrolled }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"EN" | "ES">("EN");
  const { isSignedIn } = useUser();

  const toggleLanguage = () => {
    setLanguage(language === "EN" ? "ES" : "EN");
  };

  const navLinks = [
    { href: "#home", label: language === "EN" ? "Home" : "Inicio" },
    { href: "#features", label: language === "EN" ? "Features" : "Características" },
    { href: "#how-it-works", label: language === "EN" ? "How It Works" : "Cómo Funciona" },
    { href: "#testimonials", label: language === "EN" ? "Testimonials" : "Testimonios" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-md border-b border-gray-800"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-black uppercase tracking-widest text-[#FF4F00] transition-opacity hover:opacity-70"
          >
            DION
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium uppercase tracking-widest text-white transition-colors hover:text-[#FF4F00]"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#FF4F00] transition-all duration-300 hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="rounded border border-gray-800 px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-white transition-all hover:border-[#FF4F00] hover:text-[#FF4F00]"
            >
              {language}
            </button>

            {/* CTA Button */}
            {isSignedIn ? (
              <Link
                href="/app"
                className="rounded bg-[#FF4F00] px-6 py-2 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
              >
                {language === "EN" ? "Go to App" : "Ir a la App"}
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="rounded bg-[#FF4F00] px-6 py-2 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
              >
                {language === "EN" ? "Get Started" : "Comenzar"}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-800 py-4 md:hidden">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium uppercase tracking-widest text-white transition-colors hover:text-[#FF4F00]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
