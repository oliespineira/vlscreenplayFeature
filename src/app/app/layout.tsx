import type { ReactNode } from "react";
import { TopNav } from "@/components/Layout/TopNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
