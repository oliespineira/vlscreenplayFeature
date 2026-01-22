import { ensureUser } from "@/lib/auth/ensureUser";
import Link from "next/link";

export default async function AppHome() {
  await ensureUser();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-black uppercase tracking-widest text-[#FF4F00] sm:text-5xl">
          Welcome Back
        </h1>
        <p className="mb-8 text-lg text-gray-400">
          Continue working on your projects or start a new one.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/app/projects"
            className="rounded bg-[#FF4F00] px-8 py-4 text-base font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-[#FF6B2B] active:scale-95"
          >
            View Projects
          </Link>
        </div>
      </div>
    </main>
  );
}
