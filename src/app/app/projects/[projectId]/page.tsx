import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireProjectOwner } from "@/lib/auth/ownership";
import Link from "next/link";
import { UploadScriptButton } from "@/components/projects/UploadScriptButton";
import { DeleteScriptButton } from "@/components/projects/DeleteScriptButton";

const DEFAULT_FOUNTAIN = "Title: Untitled Script\n\nINT. ROOM - DAY\n\nA blank page.\n";

async function createScript(projectId: string) {
  "use server";

  await requireProjectOwner(projectId);

  const script = await prisma.script.create({
    data: {
      title: "Untitled Script",
      projectId,
      fountain: DEFAULT_FOUNTAIN,
    },
  });

  redirect(`/app/projects/${projectId}/scripts/${script.id}/editor`);
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await requireProjectOwner(projectId);

  const scripts = await prisma.script.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/app/projects"
            className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-yellow-500"
          >
            ← Back to Projects
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-widest text-yellow-500 sm:text-4xl">
            {project.title}
          </h1>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Scripts
          </h2>
          <div className="flex items-center gap-4">
            <UploadScriptButton projectId={projectId} />
          <form action={createScript.bind(null, projectId)}>
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
              <UploadScriptButton projectId={projectId} />
            <form action={createScript.bind(null, projectId)} className="inline-block">
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
            {scripts.map((script: Awaited<ReturnType<typeof prisma.script.findMany>>[number]) => (
              <div
                key={script.id}
                className="group relative rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm transition-all hover:border-yellow-500 hover:bg-black/70"
              >
                <Link href={`/app/projects/${projectId}/scripts/${script.id}/editor`} className="block">
                <h3 className="mb-2 text-xl font-bold uppercase tracking-widest text-white group-hover:text-yellow-500">
                  {script.title}
                </h3>
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
