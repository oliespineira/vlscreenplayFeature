import { requireProjectOwner } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import { ScenesDashboard } from "@/components/Visuals/ScenesDashboard";
import Link from "next/link";

export default async function VisualsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { projectId } = await params;
  const { view } = await searchParams;
  await requireProjectOwner(projectId);

  // Get full project data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      description: true,
      creative: true,
      headerImageUrl: true,
    },
  });

  if (!project) {
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

  // Get scenes
  const scenes = await prisma.scene.findMany({
    where: { projectId },
    include: {
      images: {
        orderBy: { position: "asc" },
      },
    },
    orderBy: [
      { sequenceIndex: "asc" },
      { createdAt: "asc" },
    ],
  });

  // If view=breakdown, show breakdown feature
  if (view === "breakdown") {
    const { VisualsBreakdownClient } = await import(
      "@/components/Visuals/VisualsBreakdownClient"
    );
    const scriptsRaw = await prisma.script.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    const scripts = scriptsRaw.map((s) => ({
      id: s.id,
      title: s.title,
      updatedAt: s.updatedAt.toISOString(),
    }));

    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl p-8">
          <div className="mb-4 flex items-center gap-4">
            <Link
              href={`/app/projects/${projectId}/visuals`}
              className="text-sm text-gray-400 hover:text-pink-400"
            >
              ← Back to Scenes Dashboard
            </Link>
          </div>
          <VisualsBreakdownClient
            projectId={projectId}
            projectTitle={project.title}
            coverImageLink={project.headerImageUrl || null}
            scripts={scripts}
            initialScriptId={scripts[0]?.id || null}
          />
        </div>
      </div>
    );
  }

  // Default: show scenes dashboard
  return (
    <div className="min-h-screen">
      <div className="mb-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-gray-400">
              Scene Management
            </h2>
          </div>
          <Link
            href={`/app/projects/${projectId}/visuals?view=breakdown`}
            className="text-xs px-3 py-1 rounded border border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-black transition-all"
          >
            Scene Breakdown
          </Link>
        </div>
      </div>
      <ScenesDashboard
        projectId={projectId}
        initialProject={project}
        initialScenes={scenes}
      />
    </div>
  );
}
