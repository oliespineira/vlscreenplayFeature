import { requireScriptOwner } from "@/lib/auth/ownership";
import { EditorClient } from "./EditorClient";
import Link from "next/link";

export default async function ScriptEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ scriptId: string }>;
  searchParams: Promise<{ scene?: string }>;
}) {
  const { scriptId } = await params;
  const { scene } = await searchParams;
  const script = await requireScriptOwner(scriptId);

  const initialSceneLine = scene ? parseInt(scene, 10) : undefined;

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-full">
        <Link
          href={`/app/scripts/${scriptId}`}
          className="mb-4 inline-block px-4 text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-[#FF4F00] sm:px-6 lg:px-8"
        >
          ← Back to Scenes
        </Link>

        <div className="h-[calc(100vh-6rem)]">
          <EditorClient
            scriptId={scriptId}
            initialTitle={script.title}
            initialFountain={script.fountain}
            initialSceneLine={initialSceneLine}
          />
        </div>
      </div>
    </div>
  );
}
