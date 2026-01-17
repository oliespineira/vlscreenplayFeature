import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireProjectOwner } from "@/lib/auth/ownership";
import Link from "next/link";

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
    <div className="min-h-screen p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/app/projects"
            className="mb-4 inline-block text-white/70 hover:text-white"
          >
            ← Back to Projects
          </Link>
          <h1 className="text-3xl font-bold">{project.title}</h1>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Scripts</h2>
          <form action={createScript.bind(null, projectId)}>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              New Script
            </button>
          </form>
        </div>

        {scripts.length === 0 ? (
          <p className="text-white/70">No scripts yet. Create your first script!</p>
        ) : (
          <div className="space-y-2">
            {scripts.map((script) => (
              <Link
                key={script.id}
                href={`/app/projects/${projectId}/scripts/${script.id}/editor`}
                className="block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <h3 className="text-lg font-semibold">{script.title}</h3>
                <p className="mt-1 text-sm text-white/60">
                  Updated {new Date(script.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
