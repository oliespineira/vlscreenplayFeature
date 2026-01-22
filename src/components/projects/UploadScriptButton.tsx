"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { docxToText } from "@/lib/importers/docxToText";
import { pdfToText } from "@/lib/importers/pdfToText";
import { textToFountain } from "@/lib/importers/textToFountain";

interface UploadScriptButtonProps {
  projectId: string;
}

export function UploadScriptButton({ projectId }: UploadScriptButtonProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const fileName = file.name;
      const extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
      
      let content: string;
      let sourceType: "fountain" | "txt" | "md" | "docx" | "pdf";

      // Determine title (filename without extension)
      const title = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;

      // Handle different file types
      if (extension === ".fountain") {
        content = await file.text();
        sourceType = "fountain";
      } else if ([".txt", ".md"].includes(extension)) {
        const rawContent = await file.text();
        // Convert plain text to Fountain format
        content = textToFountain(rawContent);
        sourceType = extension === ".txt" ? "txt" : "md";
      } else if (extension === ".docx") {
        const rawContent = await docxToText(file);
        // Convert DOCX text to Fountain format
        content = textToFountain(rawContent);
        sourceType = "docx";
      } else if (extension === ".pdf") {
        const rawContent = await pdfToText(file);
        sourceType = "pdf";
        
        // Check if PDF extraction returned empty or very little text
        if (!rawContent || rawContent.trim().length < 10) {
          throw new Error(
            "This PDF appears to be scanned (image-only). Please upload a text-based PDF or use TXT/Fountain."
          );
        }
        
        // Convert PDF text to Fountain format
        content = textToFountain(rawContent);
      } else {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      // Send to import endpoint
      const response = await fetch(`/api/projects/${projectId}/scripts/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          sourceType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import script");
      }

      const data = await response.json();
      
      // Refresh the page to show the new script
      router.refresh();
      
      // Optionally navigate to the editor
      router.push(`/app/projects/${projectId}/scripts/${data.scriptId}/editor`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload script");
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="cursor-pointer">
        <input
          type="file"
          accept=".fountain,.txt,.md,.docx,.pdf"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
        <span className="inline-block rounded border-2 border-[#FF4F00] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#FF4F00] transition-all hover:bg-[#FF4F00] hover:text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
          {isUploading ? "Uploading..." : "Upload Script"}
        </span>
      </label>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
