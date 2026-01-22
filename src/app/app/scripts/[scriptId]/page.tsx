import { requireScriptOwner } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { parseScenesFromFountain } from "@/lib/scripts/fountainParser";

export default async function ScriptScenesPage({
  params,
}: {
  params: Promise<{ scriptId: string }>;
}) {
  const { scriptId } = await params;
  const script = await requireScriptOwner(scriptId);

  const scenes = parseScenesFromFountain(script.fountain);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/app/projects"
            className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-[#FF4F00]"
          >
            ← Back to Scripts
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-widest text-[#FF4F00] sm:text-4xl">
            {script.title}
          </h1>
        </div>

        {scenes.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-black/50 p-12 text-center backdrop-blur-sm">
            <p className="mb-4 text-lg text-gray-400">No scenes yet.</p>
            <Link
              href={`/app/scripts/${scriptId}/editor`}
              className="inline-block rounded bg-[#FF4F00] px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-[#FF6B2B] active:scale-95"
            >
              Start Writing
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
                Scenes ({scenes.length})
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Click on a scene to jump to it in the editor
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scenes.map((scene) => (
                <Link
                  key={scene.index}
                  href={`/app/scripts/${scriptId}/editor?scene=${scene.startLine}`}
                  className="group rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm transition-all hover:border-[#FF4F00] hover:bg-black/70"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FF4F00] bg-black text-sm font-black text-[#FF4F00]">
                      {scene.index}
                    </span>
                    <h3 className="text-lg font-bold uppercase tracking-widest text-white group-hover:text-[#FF4F00]">
                      {scene.slugline}
                    </h3>
                  </div>
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                    Line {scene.startLine}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href={`/app/scripts/${scriptId}/editor`}
                className="inline-block rounded border-2 border-[#FF4F00] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#FF4F00] transition-all hover:bg-[#FF4F00] hover:text-black active:scale-95"
              >
                Open Editor
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
