import Link from "next/link";
import VisualDevLookbook from "./components/VisualDevLookbook";

export default async function VisualDevPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/app/projects/${projectId}`}
            className="text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-yellow-500"
          >
            ← Back to Project
          </Link>
        </div>

        <VisualDevLookbook projectId={projectId} />
      </div>
    </div>
  );
}

