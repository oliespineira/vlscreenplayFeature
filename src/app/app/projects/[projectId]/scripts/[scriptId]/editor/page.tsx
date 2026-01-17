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
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/app/projects/${projectId}`}
          className="mb-4 inline-block text-white/70 hover:text-white"
        >
          ← Back to Project
        </Link>

        <div className="h-[calc(100vh-8rem)]">
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
