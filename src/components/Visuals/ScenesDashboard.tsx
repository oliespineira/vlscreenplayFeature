"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadButton } from "@/components/uploads/UploadButton";
import Link from "next/link";

interface Scene {
  id: string;
  title: string;
  description: string;
  tone: string;
  tags: string[];
  status: string;
  sequenceIndex: number;
  images: Array<{
    id: string;
    url: string;
    thumbUrl: string;
  }>;
}

interface Project {
  id: string;
  title: string;
  description: string;
  creative: string | null;
  headerImageUrl: string | null;
}

interface ScenesDashboardProps {
  projectId: string;
  initialProject: Project;
  initialScenes: Scene[];
}

function SortableSceneItem({
  scene,
  index,
  projectId,
}: {
  scene: Scene;
  index: number;
  projectId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cover = scene.images?.[0]?.thumbUrl || scene.images?.[0]?.url;

  const handleDelete = async () => {
    if (!window.confirm("Delete this scene?")) return;
    try {
      const response = await fetch(
        `/api/projects/${projectId}/scenes/${scene.id}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        window.location.reload();
      } else {
        throw new Error("Failed to delete scene");
      }
    } catch (error) {
      console.error("Failed to delete scene", error);
      alert("Failed to delete scene");
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-zinc-900/60 border border-white/10 rounded-lg overflow-hidden group ${isDragging ? "z-50" : ""}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {cover ? (
          cover.startsWith("data:") ? (
            <img
              src={cover}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
              alt={scene.title}
            />
          ) : (
            <Image
              src={cover}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform"
              alt={scene.title}
            />
          )
        ) : (
          <div className="w-full h-full bg-zinc-800" />
        )}
        <div className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1 rounded bg-black/60 border border-white/10 cursor-grab hover:bg-black/80 transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-medium text-sm">{scene.title}</h3>
            <p className="text-xs text-gray-400">{scene.tone || "—"}</p>
          </div>
          <button
            className="text-[11px] px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={handleDelete}
            title="Delete scene"
          >
            Delete
          </button>
        </div>
        <Link
          className="mt-2 inline-block text-xs px-2 py-1 rounded bg-white text-black hover:bg-gray-200"
          href={`/app/projects/${projectId}/visuals/scenes/${scene.id}`}
        >
          Open
        </Link>
      </div>
    </li>
  );
}

export function ScenesDashboard({
  projectId,
  initialProject,
  initialScenes,
}: ScenesDashboardProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [scenes, setScenes] = useState(initialScenes);
  const [editingProject, setEditingProject] = useState(false);
  const [projectTitle, setProjectTitle] = useState(project.title);
  const [projectLogline, setProjectLogline] = useState(project.description);
  const [projectCreative, setProjectCreative] = useState(project.creative || "");
  const [newSceneTitle, setNewSceneTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && scenes) {
      const oldIndex = scenes.findIndex((s) => s.id === active.id);
      const newIndex = scenes.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(scenes, oldIndex, newIndex);
      setScenes(newOrder);

      const sceneIds = newOrder.map((s) => s.id);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/scenes/reorder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sceneIds }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to reorder scenes");
        }
      } catch (error) {
        console.error("Error reordering scenes:", error);
        // Revert on error
        setScenes(scenes);
        alert("Failed to reorder scenes");
      }
    }
  };

  const handleUpdateProject = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle,
          description: projectLogline,
          creative: projectCreative,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      const updated = await response.json();
      setProject({
        ...project,
        title: updated.title,
        description: updated.description,
        creative: updated.creative,
      });
      setEditingProject(false);
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateHeaderImage = async (url: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headerImageUrl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to update header image");
      }

      const updated = await response.json();
      setProject({ ...project, headerImageUrl: updated.headerImageUrl });
    } catch (error) {
      console.error("Error updating header image:", error);
      alert("Failed to update header image");
    }
  };

  const handleCreateScene = async () => {
    if (!newSceneTitle.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSceneTitle }),
      });

      if (!response.ok) {
        throw new Error("Failed to create scene");
      }

      const newScene = await response.json();
      setScenes([...scenes, newScene]);
      setNewSceneTitle("");
      router.refresh();
    } catch (error) {
      console.error("Error creating scene:", error);
      alert("Failed to create scene");
    } finally {
      setIsCreating(false);
    }
  };

  const isVideo = project.headerImageUrl
    ? /\.(mp4|webm|mov)$/i.test(project.headerImageUrl) ||
      project.headerImageUrl.startsWith("data:video/")
    : false;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative group">
        <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden">
          {project.headerImageUrl ? (
            isVideo ? (
              <video
                className="absolute inset-0 w-full h-full object-cover"
                src={project.headerImageUrl}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              project.headerImageUrl.startsWith("data:") ? (
                <img
                  src={project.headerImageUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="Project header"
                />
              ) : (
                <Image
                  src={project.headerImageUrl}
                  fill
                  className="object-cover"
                  alt="Project header"
                />
              )
            )
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">No header image</p>
                <p className="text-xs opacity-75">Upload an image below</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black" />
          <div className="absolute bottom-6 left-0 right-0">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                {editingProject ? (
                  <div className="space-y-3 bg-black/30 rounded-xl p-4 backdrop-blur border border-white/10">
                    <input
                      className="w-full bg-transparent text-white placeholder-gray-400 text-3xl sm:text-4xl font-bold outline-none"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="Title"
                    />
                    <textarea
                      className="w-full bg-transparent text-gray-200 placeholder-gray-400 text-sm outline-none min-h-[72px]"
                      value={projectLogline}
                      onChange={(e) => setProjectLogline(e.target.value)}
                      placeholder="Logline"
                      rows={3}
                    />
                    <input
                      className="w-full bg-transparent text-gray-200 placeholder-gray-400 text-sm outline-none"
                      value={projectCreative}
                      onChange={(e) => setProjectCreative(e.target.value)}
                      placeholder="Creative's name"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="px-3 py-2 text-sm rounded bg-white text-black hover:bg-gray-200 disabled:opacity-50"
                        onClick={handleUpdateProject}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="px-3 py-2 text-sm rounded bg-zinc-900/80 text-white hover:bg-zinc-800 border border-white/10"
                        onClick={() => {
                          setEditingProject(false);
                          setProjectTitle(project.title);
                          setProjectLogline(project.description);
                          setProjectCreative(project.creative || "");
                        }}
                      >
                        Cancel
                      </button>
                      <UploadButton
                        onUploaded={(url) => handleUpdateHeaderImage(url)}
                        accept="image/*,video/*"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold">
                      {project.title || "Untitled Project"}
                    </h1>
                    {project.description && (
                      <p className="mt-2 text-sm text-gray-200 line-clamp-3">
                        {project.description}
                      </p>
                    )}
                    {project.creative && (
                      <p className="mt-1 text-xs text-gray-300">
                        by {project.creative}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        className="text-xs px-3 py-1 rounded bg-white text-black hover:bg-gray-200"
                        onClick={() => setEditingProject(true)}
                      >
                        Edit
                      </button>
                      <UploadButton
                        onUploaded={(url) => handleUpdateHeaderImage(url)}
                        accept="image/*,video/*"
                      />
                      {project.headerImageUrl && (
                        <button
                          className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleUpdateHeaderImage("")}
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scenes grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Scenes</h2>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={scenes.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenes.map((scene, idx) => (
                <SortableSceneItem
                  key={scene.id}
                  scene={scene}
                  index={idx}
                  projectId={projectId}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      {/* Floating Add Scene */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-black/50 backdrop-blur border border-white/10 rounded-xl shadow-xl p-2">
          <div className="flex items-center gap-2">
            <input
              className="bg-transparent placeholder-gray-400 text-sm px-3 py-2 outline-none text-white w-40"
              placeholder="New scene title"
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateScene();
                }
              }}
            />
            <button
              onClick={handleCreateScene}
              disabled={isCreating || !newSceneTitle.trim()}
              className="inline-flex items-center gap-1 bg-white text-black text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <span className="text-lg leading-none">+</span>
              Add Scene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
