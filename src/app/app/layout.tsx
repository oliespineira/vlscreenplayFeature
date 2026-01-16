import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl p-6">{children}</div>
    </div>
  );
}
