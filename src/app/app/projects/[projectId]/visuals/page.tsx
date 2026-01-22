import { requireProjectOwner } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import { VisualsBreakdownClient } from "@/components/Visuals/VisualsBreakdownClient";

export default async function VisualsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ scriptId?: string }>;
}) {
  const { projectId } = await params;
  const { scriptId: queryScriptId } = await searchParams;
  await requireProjectOwner(projectId);

  // Get full project data including coverImageLink
  const fullProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { title: true, coverImageLink: true },
  });

  if (!fullProject) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl p-8">
          <div className="rounded-lg border border-gray-800 bg-black/50 p-12 text-center backdrop-blur-sm">
            <p className="mb-4 text-lg text-gray-400">Project not found.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get all scripts for this project
  const scriptsRaw = await prisma.script.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  // Convert Date to string for client component
  const scripts = scriptsRaw.map((s) => ({
    id: s.id,
    title: s.title,
    updatedAt: s.updatedAt.toISOString(),
  }));

  if (scripts.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl p-8">
          <div className="rounded-lg border border-gray-800 bg-black/50 p-12 text-center backdrop-blur-sm">
            <p className="mb-4 text-lg text-gray-400">No scripts available.</p>
            <p className="text-sm text-gray-500">
              Create a script first to generate scene breakdowns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determine selected script: query param, or most recent
  const selectedScriptId = queryScriptId || scripts[0]?.id || null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl p-8">
        <VisualsBreakdownClient
          projectId={projectId}
          projectTitle={fullProject.title}
          coverImageLink={fullProject.coverImageLink || null}
          scripts={scripts}
          initialScriptId={selectedScriptId}
        />
      </div>
    </div>
  );
}
