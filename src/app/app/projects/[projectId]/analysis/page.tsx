import Link from "next/link";
import { requireProjectOwner } from "@/lib/auth/ownership";
import { ScriptAnalysisClient } from "@/components/projects/ScriptAnalysisClient";

export default async function ProjectAnalysisPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await requireProjectOwner(projectId);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href={`/app/projects/${projectId}`}
            className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-[#FF4F00]"
          >
            ← Back to Project
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-widest text-[#FF4F00] sm:text-4xl">
            Script Analysis
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Upload a script to generate characters, logline, tone, and more.
          </p>
        </div>

        <ScriptAnalysisClient
          projectId={projectId}
          initialProjectTitle={project.title}
          initialAnalysis={null}
        />
      </div>
    </div>
  );
}

