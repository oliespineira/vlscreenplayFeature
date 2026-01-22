"use client";

import { useState } from "react";

interface Script {
  id: string;
  title: string;
  updatedAt: Date;
}

interface ExportPanelProps {
  projectId: string;
  scripts: Script[];
}

export function ExportPanel({ projectId, scripts }: ExportPanelProps) {
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(
    scripts.length > 0 ? scripts[0].id : null
  );
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async (type: "dossier" | "script" | "storyboard") => {
    if (!selectedScriptId) {
      setError("Please select a script to export");
      return;
    }

    setExporting(type);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/export/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scriptId: selectedScriptId }),
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

  if (scripts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-black/50 p-12 text-center backdrop-blur-sm">
        <p className="mb-4 text-lg text-gray-400">No scripts found in this project.</p>
        <p className="text-sm text-gray-500">
          Create a script first before exporting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Script Selector */}
      <div className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
        <label className="mb-3 block text-sm font-medium uppercase tracking-wider text-gray-300">
          Select Script to Export
        </label>
        <select
          value={selectedScriptId || ""}
          onChange={(e) => setSelectedScriptId(e.target.value)}
          className="w-full rounded border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-[#FF4F00] focus:outline-none"
        >
          {scripts.map((script) => (
            <option key={script.id} value={script.id}>
              {script.title} (Updated {new Date(script.updatedAt).toLocaleDateString()})
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500">
          Choose which script you want to export
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Export Dossier */}
        <button
          onClick={() => handleExport("dossier")}
          disabled={!!exporting}
          className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-[#FF4F00] bg-black/50 p-8 backdrop-blur-sm transition-all hover:border-[#FF6B2B] hover:bg-black/70 disabled:opacity-50"
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
              <div className="text-[#FF4F00]">Exporting...</div>
            </div>
          )}
        </button>

        {/* Export Script */}
        <button
          onClick={() => handleExport("script")}
          disabled={!!exporting}
          className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-[#FF4F00] bg-black/50 p-8 backdrop-blur-sm transition-all hover:border-[#FF6B2B] hover:bg-black/70 disabled:opacity-50"
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
              <div className="text-[#FF4F00]">Exporting...</div>
            </div>
          )}
        </button>

        {/* Export Storyboard */}
        <button
          onClick={() => handleExport("storyboard")}
          disabled={!!exporting}
          className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-[#FF4F00] bg-black/50 p-8 backdrop-blur-sm transition-all hover:border-[#FF6B2B] hover:bg-black/70 disabled:opacity-50"
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
              <div className="text-[#FF4F00]">Exporting...</div>
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
