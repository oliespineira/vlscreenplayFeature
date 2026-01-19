"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteScriptButtonProps {
  scriptId: string;
  scriptTitle: string;
}

export function DeleteScriptButton({ scriptId, scriptTitle }: DeleteScriptButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete script");
      }

      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete script. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-400">Delete "{scriptTitle}"?</p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
            className="rounded border border-gray-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-400 transition-all hover:border-gray-500 hover:text-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirm(true);
      }}
      className="rounded border border-red-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-600 transition-all hover:bg-red-600 hover:text-white"
    >
      Delete
    </button>
  );
}
