"use client";

import { useState } from "react";

interface ExportPanelProps {
  projectId: string;
}

export function ExportPanel({ projectId }: ExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async (type: "dossier" | "script" | "storyboard") => {
    setExporting(type);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/export/${type}`, {
        method: "POST",
      });

      if (!res.ok) {
        let errorMessage = `Failed to export ${type}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Handle file download if response is a blob
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
          setSuccess(`${type} export started successfully`);
        } else if (data.message) {
          // Placeholder message (e.g., "not yet implemented")
          setSuccess(data.message);
        } else {
          setSuccess(`${type} export completed`);
        }
      } else {
        // Assume it's a file download (e.g., script export returns text/plain)
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const contentDisposition = res.headers.get("content-disposition");
        let filename = `${type}-${projectId}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        } else {
          // Default extensions based on content type
          if (contentType?.includes("text/plain")) {
            filename += ".fountain";
          } else if (contentType?.includes("pdf")) {
            filename += ".pdf";
          } else if (contentType?.includes("zip")) {
            filename += ".zip";
          }
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess(`${type} downloaded successfully`);
      }
    } catch (error) {
      console.error("Export error:", error);
      setError(error instanceof Error ? error.message : `Failed to export ${type}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Export Dossier */}
        <button
          onClick={() => handleExport("dossier")}
          disabled={!!exporting}
          className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-pink-400 bg-black/50 p-8 backdrop-blur-sm transition-all hover:border-pink-300 hover:bg-black/70 disabled:opacity-50"
        >
          <div className="mb-4 text-4xl">📄</div>
          <h3 className="mb-2 text-xl font-bold uppercase tracking-wider text-white">
            Export Dossier
          </h3>
          <p className="text-center text-sm text-gray-400">
            Complete project documentation
          </p>
          {exporting === "dossier" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-pink-400">Exporting...</div>
            </div>
          )}
        </button>

        {/* Export Script */}
        <button
          onClick={() => handleExport("script")}
          disabled={!!exporting}
          className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-pink-400 bg-black/50 p-8 backdrop-blur-sm transition-all hover:border-pink-300 hover:bg-black/70 disabled:opacity-50"
        >
          <div className="mb-4 text-4xl">📝</div>
          <h3 className="mb-2 text-xl font-bold uppercase tracking-wider text-white">
            Export Script
          </h3>
          <p className="text-center text-sm text-gray-400">
            Download screenplay file
          </p>
          {exporting === "script" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-pink-400">Exporting...</div>
            </div>
          )}
        </button>

        {/* Export Storyboard */}
        <button
          onClick={() => handleExport("storyboard")}
          disabled={!!exporting}
          className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-pink-400 bg-black/50 p-8 backdrop-blur-sm transition-all hover:border-pink-300 hover:bg-black/70 disabled:opacity-50"
        >
          <div className="mb-4 text-4xl">🎬</div>
          <h3 className="mb-2 text-xl font-bold uppercase tracking-wider text-white">
            Export Storyboard
          </h3>
          <p className="text-center text-sm text-gray-400">
            Visual storyboard PDF
          </p>
          {exporting === "storyboard" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-pink-400">Exporting...</div>
            </div>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-8 rounded-lg border border-gray-800 bg-black/30 p-4 text-center text-sm text-gray-500">
        You can also access Export via the top navigation.
      </div>
    </div>
  );
}
