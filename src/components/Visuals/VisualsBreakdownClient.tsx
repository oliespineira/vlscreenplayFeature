"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ScriptSelector } from "@/components/Visuals/ScriptSelector";
import { SceneBreakdownCard } from "@/components/Visuals/SceneBreakdownCard";
import { GenerateBreakdownButton } from "@/components/Visuals/GenerateBreakdownButton";

interface Script {
  id: string;
  title: string;
  updatedAt: string;
}

interface Scene {
  index: number;
  slugline: string;
  sceneText: string;
  breakdown: {
    id: string;
    logline: string | null;
    props: Array<{ name: string; description: string | null }> | null;
    characters: Array<{ name: string; profile: string | null }> | null;
    locations: Array<{ name: string; details: string | null }> | null;
    wardrobe: Array<{ item: string; who: string | null }> | null;
    notes: string | null;
    updatedAt: string;
  } | null;
}

interface VisualsData {
  scriptId: string;
  scriptTitle: string;
  status: "idle" | "running" | "done" | "error";
  scenes: Scene[];
}

interface VisualsBreakdownClientProps {
  projectId: string;
  projectTitle: string;
  coverImageLink: string | null;
  scripts: Script[];
  initialScriptId: string | null;
}

export function VisualsBreakdownClient({
  projectId,
  projectTitle,
  coverImageLink: initialCoverImageLink,
  scripts,
  initialScriptId,
}: VisualsBreakdownClientProps) {
  const router = useRouter();
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(
    initialScriptId
  );
  const [data, setData] = useState<VisualsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverImageLink, setCoverImageLink] = useState<string | null>(
    initialCoverImageLink
  );

  const loadData = async (scriptId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/visuals?scriptId=${scriptId}`
      );
      if (!response.ok) {
        throw new Error("Failed to load visuals data");
      }
      const visualsData: VisualsData = await response.json();
      setData(visualsData);
    } catch (error) {
      console.error("Error loading visuals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedScriptId) {
      loadData(selectedScriptId);
    }
  }, [selectedScriptId, projectId]);

  const handleScriptSelect = (scriptId: string) => {
    setSelectedScriptId(scriptId);
    router.push(`/app/projects/${projectId}/visuals?scriptId=${scriptId}`);
  };

  const handleGenerate = async () => {
    if (selectedScriptId) {
      await loadData(selectedScriptId);
    }
  };

  const hasBreakdowns = data?.scenes.some((s) => s.breakdown !== null) || false;

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-black uppercase tracking-widest text-yellow-500 sm:text-5xl">
          {projectTitle}
        </h1>

        {/* Cover Image Section */}
        {coverImageLink && (
          <div className="relative h-48 w-full overflow-hidden rounded-lg border border-gray-800">
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
        )}
      </div>

      {/* Script Selector */}
      <ScriptSelector
        scripts={scripts}
        selectedScriptId={selectedScriptId}
        onSelect={handleScriptSelect}
      />

      {loading && selectedScriptId ? (
        <div className="rounded-lg border border-gray-800 bg-black/50 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : data && selectedScriptId ? (
        <>
          {/* Generate Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
                Scene Breakdown
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                {data.scenes.length} scene{data.scenes.length !== 1 ? "s" : ""}
              </p>
            </div>
            <GenerateBreakdownButton
              projectId={projectId}
              scriptId={selectedScriptId}
              onGenerate={handleGenerate}
              status={data.status}
            />
          </div>

          {/* Scenes List */}
          {data.scenes.length === 0 ? (
            <div className="rounded-lg border border-gray-800 bg-black/50 p-8 text-center backdrop-blur-sm">
              <p className="text-sm text-gray-400">No scenes found in script</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.scenes.map((scene) => (
                <SceneBreakdownCard
                  key={scene.index}
                  sceneIndex={scene.index}
                  slugline={scene.slugline}
                  breakdown={scene.breakdown}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
