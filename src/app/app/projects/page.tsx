import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ensureUser } from "@/lib/auth/ensureUser";
import Link from "next/link";
import { UploadScriptButtonGlobal } from "@/components/projects/UploadScriptButtonGlobal";
import { DeleteScriptButton } from "@/components/projects/DeleteScriptButton";

async function createScript() {
  "use server";

  const user = await ensureUser();

  // Create a default project if needed, or get the first one
  let project = await prisma.project.findFirst({
    where: { ownerId: user.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        title: "My Screenplays",
        ownerId: user.id,
      },
    });
  }

  const script = await prisma.script.create({
    data: {
      title: "Untitled Script",
      projectId: project.id,
      fountain: "Title: Untitled Script\n\nINT. ROOM - DAY\n\nA blank page.\n",
    },
  });

  redirect(`/app/scripts/${script.id}`);
}

export default async function ScriptsPage() {
  const user = await ensureUser();

  // Get all scripts across all projects for this user
  const scripts = await prisma.script.findMany({
    where: {
      project: {
        ownerId: user.id,
      },
    },
    include: {
      project: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  }) as Array<{
    id: string;
    title: string;
    updatedAt: Date;
    projectId: string;
    fountain: string;
    project: { title: string };
  }>;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black uppercase tracking-widest text-yellow-500 sm:text-4xl">
            Scripts
          </h1>
          <div className="flex items-center gap-4">
            <UploadScriptButtonGlobal />
            <form action={createScript}>
              <button
                type="submit"
                className="rounded bg-yellow-500 px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-yellow-400 active:scale-95"
              >
                New Script
              </button>
            </form>
          </div>
        </div>

        {scripts.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-black/50 p-12 text-center backdrop-blur-sm">
            <p className="mb-4 text-lg text-gray-400">No scripts yet.</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <UploadScriptButtonGlobal />
              <form action={createScript} className="inline-block">
                <button
                  type="submit"
                  className="rounded bg-yellow-500 px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-yellow-400 active:scale-95"
                >
                  Create Your First Script
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scripts.map((script) => (
              <div
                key={script.id}
                className="group relative rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm transition-all hover:border-yellow-500 hover:bg-black/70"
              >
                <Link href={`/app/scripts/${script.id}`} className="block">
                  <h2 className="mb-2 text-xl font-bold uppercase tracking-widest text-white group-hover:text-yellow-500">
                    {script.title}
                  </h2>
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gray-500">
                    {script.project.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    Updated {new Date(script.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
                <div className="mt-4 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                  <DeleteScriptButton scriptId={script.id} scriptTitle={script.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
