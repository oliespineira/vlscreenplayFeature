import { ensureUser } from "@/lib/auth/ensureUser";

export default async function AppHome() {
  await ensureUser();

  return (
    <main className="min-h-screen p-8 text-white">
      <h1 className="text-3xl font-bold">DION App</h1>
      <p className="mt-2 text-white/70">
        This is the authenticated area. Next: Projects, Scripts, Editor.
      </p>
    </main>
  );
}
