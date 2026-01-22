import { requireScriptOwner } from "@/lib/auth/ownership";
import { EditorClient } from "./EditorClient";
import Link from "next/link";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string; scriptId: string }>;
}) {
  const { projectId, scriptId } = await params;
  const script = await requireScriptOwner(scriptId);

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-full">
        <div className="mb-4 flex items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href={`/app/projects/${projectId}`}
            className="text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-yellow-500"
          >
            ← Back to Project
          </Link>
          <Link
            href={`/app/projects/${projectId}/visuals?scriptId=${scriptId}`}
            className="rounded border border-pink-400 px-4 py-2 text-xs font-bold uppercase tracking-widest text-pink-400 transition-all hover:bg-pink-400 hover:text-black"
          >
            Go to Visualising
          </Link>
        </div>

        <div className="h-[calc(100vh-6rem)]">
          <EditorClient
            scriptId={scriptId}
            initialTitle={script.title}
            initialFountain={script.fountain}
          />
        </div>
      </div>
    </div>
  );
}
