import { requireProjectOwner } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import { ExportPanel } from "@/components/Export/ExportPanel";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await requireProjectOwner(projectId);

  const scripts = await prisma.script.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-widest text-yellow-500 sm:text-5xl">
            {project.title}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Export your project in various formats
          </p>
        </div>

        <ExportPanel projectId={projectId} scripts={scripts} />
      </div>
    </div>
  );
}
