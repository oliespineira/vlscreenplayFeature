"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Scene {
  id: string;
  slugline: string;
  index: number;
  excerpt: string;
}

interface VisualElement {
  id: string;
  url: string;
  note: string | null;
  tags: string | null;
  createdAt: string;
}

interface VisualsWorkspaceProps {
  projectId: string;
  projectTitle: string;
  coverImageLink: string | null;
  scenes: Scene[];
}

export function VisualsWorkspace({
  projectId,
  projectTitle,
  coverImageLink: initialCoverImageLink,
  scenes,
}: VisualsWorkspaceProps) {
  const router = useRouter();
  const [coverImageLink, setCoverImageLink] = useState<string | null>(initialCoverImageLink);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [sceneVisuals, setSceneVisuals] = useState<Record<string, VisualElement[]>>({});
  const [loadingVisuals, setLoadingVisuals] = useState(true);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [newVisualUrl, setNewVisualUrl] = useState("");
  const [newVisualNote, setNewVisualNote] = useState("");
  const [newVisualTags, setNewVisualTags] = useState("");
  const [uploadingVisual, setUploadingVisual] = useState(false);

  // Load visual elements for all scenes
  useEffect(() => {
    const loadVisuals = async () => {
      try {
        const visuals: Record<string, VisualElement[]> = {};
        for (const scene of scenes) {
          const res = await fetch(`/api/projects/${projectId}/visuals/scene/${scene.id}`);
          if (res.ok) {
            const data = await res.json();
            visuals[scene.id] = Array.isArray(data) ? data : [];
          } else {
            visuals[scene.id] = [];
          }
        }
        setSceneVisuals(visuals);
      } catch (error) {
        console.error("Failed to load visuals:", error);
      } finally {
        setLoadingVisuals(false);
      }
    };

    loadVisuals();
  }, [projectId, scenes]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    setUploadingCover(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/projects/${projectId}/visuals/cover`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload cover image");
      }

      const data = await res.json();
      setCoverImageLink(data.url);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAddVisual = async (sceneId: string) => {
    if (!newVisualUrl.trim()) {
      alert("Please provide an image URL");
      return;
    }

    setUploadingVisual(true);
    try {
      const formData = new FormData();
      formData.append("url", newVisualUrl);
      if (newVisualNote) formData.append("note", newVisualNote);
      if (newVisualTags) formData.append("tags", newVisualTags);

      const res = await fetch(`/api/projects/${projectId}/visuals/scene/${sceneId}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add visual element");
      }

      const newElement = await res.json();
      setSceneVisuals((prev) => ({
        ...prev,
        [sceneId]: [...(prev[sceneId] || []), newElement],
      }));

      // Reset form
      setNewVisualUrl("");
      setNewVisualNote("");
      setNewVisualTags("");
      setShowAddModal(null);
    } catch (error) {
      console.error("Add visual error:", error);
      alert(error instanceof Error ? error.message : "Failed to add visual element");
    } finally {
      setUploadingVisual(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-black uppercase tracking-widest text-yellow-500 sm:text-5xl">
          {projectTitle}
        </h1>

        {/* Cover Image Section */}
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {coverImageLink ? (
              <div className="relative h-48 w-48 overflow-hidden rounded-lg border border-gray-800">
                {coverImageLink.startsWith("data:") ? (
                  <img
                    src={coverImageLink}
                    alt="Project cover"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={coverImageLink}
                    alt="Project cover"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-gray-800 bg-black/50">
                <span className="text-sm text-gray-500">No cover image</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium uppercase tracking-wider text-gray-300">
              Project Cover Image
            </label>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
                className="hidden"
              />
              <span className="inline-block rounded border border-pink-400 px-4 py-2 text-xs font-bold uppercase tracking-widest text-pink-400 transition-all hover:bg-pink-400 hover:text-black disabled:opacity-50">
                {uploadingCover ? "Uploading..." : coverImageLink ? "Change Cover" : "Upload Cover"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Scenes</h2>
        <div className="max-h-[calc(100vh-500px)] space-y-4 overflow-y-auto">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                    Scene {scene.index}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">{scene.slugline}</p>
                </div>
                <button
                  onClick={() => setShowAddModal(scene.id)}
                  className="rounded border border-pink-400 px-4 py-2 text-xs font-bold uppercase tracking-widest text-pink-400 transition-all hover:bg-pink-400 hover:text-black"
                >
                  Add Visual Element
                </button>
              </div>

              {/* Visual Elements */}
              {loadingVisuals ? (
                <p className="text-sm text-gray-500">Loading visuals...</p>
              ) : sceneVisuals[scene.id]?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {sceneVisuals[scene.id].map((visual) => (
                    <div
                      key={visual.id}
                      className="group relative overflow-hidden rounded border border-gray-800"
                    >
                      <div className="relative aspect-square">
                        {visual.url.startsWith("data:") ? (
                          <img
                            src={visual.url}
                            alt={visual.note || "Visual element"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Image
                            src={visual.url}
                            alt={visual.note || "Visual element"}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      {visual.note && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {visual.note}
                        </div>
                      )}
                      {visual.tags && (
                        <div className="absolute top-2 right-2 rounded bg-pink-400/80 px-2 py-1 text-xs font-bold text-black">
                          {visual.tags}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No visual elements yet</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center border-t border-gray-800 pt-8">
        <button
          onClick={() => router.push(`/app/projects/${projectId}/export`)}
          className="rounded bg-pink-400 px-8 py-4 text-base font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-pink-300 active:scale-95"
        >
          Export
        </button>
      </div>

      {/* Add Visual Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-gray-800 bg-black p-6">
            <h3 className="mb-4 text-xl font-bold uppercase tracking-wider text-white">
              Add Visual Element
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Image URL
                </label>
                <input
                  type="url"
                  value={newVisualUrl}
                  onChange={(e) => setNewVisualUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded border border-gray-800 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Note (optional)
                </label>
                <textarea
                  value={newVisualNote}
                  onChange={(e) => setNewVisualNote(e.target.value)}
                  placeholder="Add a note about this visual..."
                  rows={3}
                  className="w-full rounded border border-gray-800 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Tags (optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={newVisualTags}
                  onChange={(e) => setNewVisualTags(e.target.value)}
                  placeholder="mood, lighting, color"
                  className="w-full rounded border border-gray-800 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowAddModal(null);
                    setNewVisualUrl("");
                    setNewVisualNote("");
                    setNewVisualTags("");
                  }}
                  className="flex-1 rounded border border-gray-600 px-4 py-2 text-sm font-medium uppercase tracking-wider text-gray-300 transition-colors hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddVisual(showAddModal)}
                  disabled={uploadingVisual || !newVisualUrl.trim()}
                  className="flex-1 rounded bg-pink-400 px-4 py-2 text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-pink-300 disabled:opacity-50"
                >
                  {uploadingVisual ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
