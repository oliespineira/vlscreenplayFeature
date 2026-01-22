"use client";

import { useState } from "react";

interface GenerateBreakdownButtonProps {
  projectId: string;
  scriptId: string;
  onGenerate: () => Promise<void>;
  status?: "idle" | "running" | "done" | "error";
}

export function GenerateBreakdownButton({
  projectId,
  scriptId,
  onGenerate,
  status = "idle",
}: GenerateBreakdownButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/visuals/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scriptId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate breakdown");
      }

      await onGenerate();
    } catch (error) {
      console.error("Error generating breakdown:", error);
      alert(error instanceof Error ? error.message : "Failed to generate breakdown");
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = isGenerating || status === "running";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="rounded bg-[#FF4F00] px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-[#FF6B2B] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Generating..." : "Generate Breakdown"}
    </button>
  );
}
