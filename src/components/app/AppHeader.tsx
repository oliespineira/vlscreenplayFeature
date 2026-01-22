"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export function AppHeader() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/app", label: "Dashboard" },
    { href: "/app/projects", label: "Scripts" },
  ];

  return (
    <header className="border-b border-gray-800 bg-black/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/app"
            className="text-xl font-black uppercase tracking-widest text-[#FF4F00] transition-opacity hover:opacity-70"
          >
            DION
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium uppercase tracking-widest transition-colors ${
                    isActive
                      ? "text-[#FF4F00]"
                      : "text-white hover:text-[#FF4F00]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#FF4F00]" />
                  )}
                </Link>
              );
            })}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>
    </header>
  );
}
