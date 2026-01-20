"use client";

import { useMemo, useState } from "react";

export default function VisualDevLookbook({ projectId }: { projectId: string }) {
  const [toneText, setToneText] = useState("gritty, intimate, paranoid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookbook, setLookbook] = useState<any>(null);

  const toneKeywords = useMemo(
    () =>
      toneText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [toneText]
  );

  async function generate() {
    setLoading(true);
    setError(null);
    setLookbook(null);

    try {
      const res = await fetch("/api/visual/lookbook/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          logline: "",
          themes: ["loss", "identity"],
          toneKeywords,
          locations: ["small apartment", "rainy street"],
          keyScenes: [
            { id: "s1", summary: "She returns home and senses something off." },
            { id: "s2", summary: "A small detail confirms someone has been inside." },
          ],
          knobs: { stylized: 0.55, movement: 0.35, contrast: 0.7 },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "REQUEST_FAILED");
      setLookbook(json.lookbook);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-wide">Visual Development</h1>
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Lookbook"}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label className="block text-sm opacity-80">Tone keywords (comma-separated)</label>
        <input
          value={toneText}
          onChange={(e) => setToneText(e.target.value)}
          className="w-full rounded-lg bg-black/60 border border-white/10 px-3 py-2 outline-none focus:border-white/20"
          placeholder="e.g. clinical, dreamlike, gritty"
        />
        <div className="text-xs opacity-60">
          Current: {toneKeywords.length ? toneKeywords.join(" · ") : "—"}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <div className="font-semibold mb-1">Error</div>
          <div className="opacity-90">{error}</div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold mb-2">LookbookDraft output</div>
        <pre className="text-xs whitespace-pre-wrap break-words opacity-90">
          {lookbook ? JSON.stringify(lookbook, null, 2) : "—"}
        </pre>
      </div>
    </div>
  );
}

