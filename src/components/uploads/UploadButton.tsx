"use client";

import { useState, useRef } from "react";

interface UploadButtonProps {
  onUploaded: (url: string, thumbUrl?: string) => void;
  accept?: string;
  label?: string;
  className?: string;
}

export function UploadButton({
  onUploaded,
  accept = "image/*",
  label = "Upload",
  className = "",
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      onUploaded(data.url, data.thumbUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <label className={`cursor-pointer ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />
      <span className="inline-block rounded border border-pink-400 px-4 py-2 text-xs font-bold uppercase tracking-widest text-pink-400 transition-all hover:bg-pink-400 hover:text-black disabled:opacity-50">
        {isUploading ? "Uploading..." : label}
      </span>
    </label>
  );
}
