import { requireProjectOwner } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function SceneDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; sceneId: string }>;
}) {
  const { projectId, sceneId } = await params;
  await requireProjectOwner(projectId);

  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: {
      images: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!scene || scene.projectId !== projectId) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl p-8">
          <div className="rounded-lg border border-gray-800 bg-black/50 p-12 text-center backdrop-blur-sm">
            <p className="mb-4 text-lg text-gray-400">Scene not found.</p>
            <Link
              href={`/app/projects/${projectId}/visuals`}
              className="text-sm text-pink-400 hover:underline"
            >
              Back to Scenes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl p-8">
        <Link
          href={`/app/projects/${projectId}/visuals`}
          className="mb-4 inline-block text-sm text-gray-400 hover:text-pink-400"
        >
          ← Back to Scenes
        </Link>

        <div className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-white mb-4">
            {scene.title}
          </h1>
          {scene.description && (
            <p className="text-gray-300 mb-4">{scene.description}</p>
          )}
          {scene.tone && (
            <p className="text-sm text-gray-400 mb-4">Tone: {scene.tone}</p>
          )}

          {scene.images.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {scene.images.map((image) => (
                  <div key={image.id} className="relative aspect-square">
                    {image.url.startsWith("data:") ? (
                      <img
                        src={image.url}
                        alt="Scene image"
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <img
                        src={image.url}
                        alt="Scene image"
                        className="w-full h-full object-cover rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
