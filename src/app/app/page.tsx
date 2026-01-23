import { ensureUser } from "@/lib/auth/ensureUser";
import Link from "next/link";
import { MoltenBackground } from "@/components/app/MoltenBackground";

export default async function AppHome() {
  await ensureUser();

  return (
    <main className="relative min-h-screen">
      <MoltenBackground />
      <div className="relative z-10 mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-black uppercase tracking-widest text-yellow-500 sm:text-5xl">
          Welcome Back
        </h1>
        <p className="mb-8 text-lg text-gray-400">
          Continue writing your screenplays or start a new script.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/app/projects"
            className="rounded bg-yellow-500 px-8 py-4 text-base font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-yellow-400 active:scale-95"
          >
            View Scripts
          </Link>
        </div>
      </div>
    </main>
  );
}
