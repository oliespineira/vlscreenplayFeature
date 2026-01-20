"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RenameProjectButtonProps {
  projectId: string;
  initialTitle: string;
}

export function RenameProjectButton({
  projectId,
  initialTitle,
}: RenameProjectButtonProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to rename project");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error("Rename project error:", err);
      setError(err instanceof Error ? err.message : "Failed to rename project");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSaving}
          className="w-full rounded border border-gray-700 bg-black/60 px-2 py-1 text-xs text-white outline-none focus:border-yellow-500"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-yellow-500 px-3 py-1 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-yellow-400 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setIsEditing(false);
              setTitle(initialTitle);
              setError(null);
            }}
            className="rounded border border-gray-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-400 transition-all hover:border-gray-500 hover:text-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsEditing(true);
      }}
      className="rounded border border-gray-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-400 transition-all hover:border-gray-500 hover:text-gray-300"
    >
      Rename
    </button>
  );
}

