import { requireProjectOwner } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import { parseScenesFromFountain } from "@/lib/scripts/fountainParser";
import { VisualsWorkspace } from "@/components/Visuals/VisualsWorkspace";
import { redirect } from "next/navigation";

export default async function VisualPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await requireProjectOwner(projectId);

  // Get full project data including coverImageLink
  const fullProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { title: true, coverImageLink: true },
  });

  if (!fullProject) {
    redirect(`/app/projects/${projectId}`);
  }

  // Get the most recent script for this project
  const scripts = await prisma.script.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
    take: 1,
  });

  if (scripts.length === 0) {
    // Redirect to project page if no script exists
    redirect(`/app/projects/${projectId}`);
  }

  const script = scripts[0];
  const scenes = parseScenesFromFountain(script.fountain);

  // Format scenes for the workspace
  const formattedScenes = scenes.map((scene) => ({
    id: `scene-${scene.index}`,
    slugline: scene.slugline,
    index: scene.index,
    excerpt: "", // Could extract excerpt from script if needed
  }));

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <VisualsWorkspace
          projectId={projectId}
          projectTitle={fullProject.title}
          coverImageLink={fullProject.coverImageLink || null}
          scenes={formattedScenes}
        />
      </div>
    </div>
  );
}
