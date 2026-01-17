import { ensureUser } from "@/lib/auth/ensureUser";
import Link from "next/link";

export default async function AppHome() {
  await ensureUser();

  return (
    <main className="min-h-screen p-8 text-white">
      <h1 className="text-3xl font-bold">DION App</h1>
      <p className="mt-2 text-white/70">
        This is the authenticated area. Next: Projects, Scripts, Editor.
      </p>
      <div className="mt-6">
        <Link
          href="/app/projects"
          className="inline-block rounded bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Go to Projects
        </Link>
      </div>
    </main>
  );
}
