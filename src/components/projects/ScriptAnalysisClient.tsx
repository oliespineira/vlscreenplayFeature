"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScriptAnalysis } from "@/lib/domain/scriptAnalysis";

type Props = {
  projectId: string;
  initialProjectTitle: string;
  initialAnalysis: ScriptAnalysis | null;
};

function deriveTitleFromLogline(logline: string): string {
  return logline
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ")
    .trim();
}

export function ScriptAnalysisClient({
  projectId,
  initialProjectTitle,
  initialAnalysis,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<ScriptAnalysis | null>(null);

  const hasAnalysis = useMemo(() => !!analysis, [analysis]);

  // hydrate from saved project analysis on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) return;
        const data = (await res.json()) as any;

        if (cancelled) return;
        const saved = data?.scriptAnalysis;
        if (saved && typeof saved === "object") {
          setAnalysis(saved as ScriptAnalysis);
          setIsEditing(false);
        }
      } catch {
        // ignore; analyzer still works without hydration
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
  };

  const analyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/projects/${projectId}/analyze-script`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "analysis failed");
      }

      setAnalysis(data as ScriptAnalysis);
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent("scenes:updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!analysis) return;
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptAnalysis: analysis }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "failed to save changes");

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to save changes");
    }
  };

  const applyToProject = async () => {
    if (!analysis) return;
    setError(null);

    const derivedTitle = deriveTitleFromLogline(analysis.logline || "");
    const title = derivedTitle || initialProjectTitle || "Untitled Project";

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: analysis.theme_analysis || "",
          scriptAnalysis: analysis,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "failed to apply analysis");
      alert("analysis applied to project successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to apply analysis");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-2xl font-bold uppercase tracking-widest text-white">
          Upload Script
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              supported formats
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={onUpload}
              className="block w-full text-sm text-gray-300 file:mr-4 file:rounded file:border-0 file:bg-[#FF4F00] file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-black hover:file:bg-[#FF6B2B]"
            />
            <p className="mt-2 text-xs text-gray-500">
              pdf, docx, txt (max 15mb)
            </p>
          </div>

          <button
            onClick={analyze}
            disabled={!file || loading}
            className="rounded bg-[#FF4F00] px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-[#FF6B2B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze & Fill Presentation"}
          </button>

          {error && (
            <div className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {hydrating && !hasAnalysis && (
            <p className="text-xs text-gray-500">loading saved analysis...</p>
          )}
        </div>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold uppercase tracking-widest text-white">
              Analysis Results
            </h3>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => {
                    setSnapshot(analysis);
                    setIsEditing(true);
                  }}
                  className="rounded border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:border-[#FF4F00] hover:text-[#FF4F00]"
                >
                  Make Changes
                </button>
              ) : (
                <>
                  <button
                    onClick={saveChanges}
                    className="rounded border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:border-[#FF4F00] hover:text-[#FF4F00]"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      if (snapshot) setAnalysis(snapshot);
                      setIsEditing(false);
                    }}
                    className="rounded border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:border-gray-500 hover:text-white"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={applyToProject}
                className="rounded bg-[#FF4F00] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-[#FF6B2B] active:scale-95"
              >
                Apply to Project
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <section className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#FF4F00]">
                Logline
              </h4>
              {isEditing ? (
                <textarea
                  className="w-full rounded border border-gray-800 bg-black/60 p-3 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                  rows={3}
                  value={analysis.logline}
                  onChange={(e) =>
                    setAnalysis((a) => (a ? { ...a, logline: e.target.value } : a))
                  }
                />
              ) : (
                <p className="whitespace-pre-wrap text-gray-300">
                  {analysis.logline || "—"}
                </p>
              )}
            </section>

            <section className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#FF4F00]">
                Main Theme
              </h4>
              {isEditing ? (
                <textarea
                  className="w-full rounded border border-gray-800 bg-black/60 p-3 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                  rows={3}
                  value={analysis.main_theme}
                  onChange={(e) =>
                    setAnalysis((a) =>
                      a ? { ...a, main_theme: e.target.value } : a,
                    )
                  }
                />
              ) : (
                <p className="whitespace-pre-wrap text-gray-300">
                  {analysis.main_theme || "—"}
                </p>
              )}
            </section>

            <section className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#FF4F00]">
                Tone
              </h4>
              {isEditing ? (
                <input
                  className="w-full rounded border border-gray-800 bg-black/60 p-2 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                  value={analysis.tone}
                  onChange={(e) =>
                    setAnalysis((a) => (a ? { ...a, tone: e.target.value } : a))
                  }
                />
              ) : (
                <p className="text-gray-300">{analysis.tone || "—"}</p>
              )}
            </section>

            <section className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#FF4F00]">
                Characters
              </h4>
              {isEditing ? (
                <div className="space-y-4">
                  {analysis.characters.map((c, i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded border border-gray-800 bg-black/60 p-3"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input
                          className="rounded border border-gray-800 bg-black/70 p-2 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                          placeholder="Name"
                          value={c.name}
                          onChange={(e) => {
                            const next = [...analysis.characters];
                            next[i] = { ...next[i], name: e.target.value };
                            setAnalysis((a) => (a ? { ...a, characters: next } : a));
                          }}
                        />
                        <input
                          className="rounded border border-gray-800 bg-black/70 p-2 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                          placeholder="Role"
                          value={c.role || ""}
                          onChange={(e) => {
                            const next = [...analysis.characters];
                            next[i] = { ...next[i], role: e.target.value };
                            setAnalysis((a) => (a ? { ...a, characters: next } : a));
                          }}
                        />
                      </div>
                      <textarea
                        className="w-full rounded border border-gray-800 bg-black/70 p-2 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                        placeholder="Description"
                        rows={3}
                        value={c.description}
                        onChange={(e) => {
                          const next = [...analysis.characters];
                          next[i] = { ...next[i], description: e.target.value };
                          setAnalysis((a) => (a ? { ...a, characters: next } : a));
                        }}
                      />
                      <div className="flex justify-end">
                        <button
                          className="rounded border border-red-900 bg-red-950/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-200 hover:bg-red-950/50"
                          onClick={() => {
                            const next = analysis.characters.filter((_, j) => j !== i);
                            setAnalysis((a) => (a ? { ...a, characters: next } : a));
                          }}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="rounded border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:border-[#FF4F00] hover:text-[#FF4F00]"
                    onClick={() => {
                      const next = [
                        ...analysis.characters,
                        { name: "", description: "", role: "" },
                      ];
                      setAnalysis((a) => (a ? { ...a, characters: next } : a));
                    }}
                    type="button"
                  >
                    Add Character
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {analysis.characters.map((c, i) => (
                    <li key={i} className="text-gray-300">
                      <strong className="text-white">{c.name || "Unnamed"}</strong>
                      {c.role && (
                        <span className="ml-2 text-[#FF4F00]">({c.role})</span>
                      )}
                      {c.description && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                          {c.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#FF4F00]">
                Deeper Theme Analysis
              </h4>
              {isEditing ? (
                <textarea
                  className="w-full rounded border border-gray-800 bg-black/60 p-3 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                  rows={6}
                  value={analysis.theme_analysis}
                  onChange={(e) =>
                    setAnalysis((a) =>
                      a ? { ...a, theme_analysis: e.target.value } : a,
                    )
                  }
                />
              ) : (
                <p className="whitespace-pre-wrap text-gray-300">
                  {analysis.theme_analysis || "—"}
                </p>
              )}
            </section>

            {analysis.look && (
              <section className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#FF4F00]">
                  Look & Aesthetic
                </h4>

                <div className="space-y-4">
                  <div>
                    <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                      Aesthetic
                    </h5>
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-gray-800 bg-black/60 p-2 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                        value={analysis.look.aesthetic}
                        onChange={(e) =>
                          setAnalysis((a) =>
                            a
                              ? {
                                  ...a,
                                  look: {
                                    ...(a.look || {
                                      aesthetic: "",
                                      color_palette: [],
                                      visual_references: [],
                                    }),
                                    aesthetic: e.target.value,
                                  },
                                }
                              : a,
                          )
                        }
                      />
                    ) : (
                      <p className="text-gray-300">{analysis.look.aesthetic || "—"}</p>
                    )}
                  </div>

                  <div>
                    <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                      Color Palette
                    </h5>
                    {isEditing ? (
                      <div className="space-y-2">
                        {analysis.look.color_palette.map((color, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              className="flex-1 rounded border border-gray-800 bg-black/60 p-2 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                              value={color}
                              onChange={(e) => {
                                const next = [...analysis.look!.color_palette];
                                next[i] = e.target.value;
                                setAnalysis((a) =>
                                  a ? { ...a, look: { ...(a.look as any), color_palette: next } } : a,
                                );
                              }}
                            />
                            <button
                              className="rounded border border-red-900 bg-red-950/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-200 hover:bg-red-950/50"
                              onClick={() => {
                                const next = analysis.look!.color_palette.filter(
                                  (_, j) => j !== i,
                                );
                                setAnalysis((a) =>
                                  a ? { ...a, look: { ...(a.look as any), color_palette: next } } : a,
                                );
                              }}
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          className="rounded border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:border-[#FF4F00] hover:text-[#FF4F00]"
                          onClick={() => {
                            const next = [...(analysis.look?.color_palette || []), ""];
                            setAnalysis((a) =>
                              a ? { ...a, look: { ...(a.look as any), color_palette: next } } : a,
                            );
                          }}
                          type="button"
                        >
                          Add Color
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {analysis.look.color_palette.map((color, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-gray-700 bg-black/40 px-3 py-1 text-xs text-gray-300"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                      Visual References
                    </h5>
                    {isEditing ? (
                      <div className="space-y-2">
                        {analysis.look.visual_references.map((ref, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              className="flex-1 rounded border border-gray-800 bg-black/60 p-2 text-sm text-gray-200 outline-none focus:border-[#FF4F00]"
                              value={ref}
                              onChange={(e) => {
                                const next = [...analysis.look!.visual_references];
                                next[i] = e.target.value;
                                setAnalysis((a) =>
                                  a
                                    ? {
                                        ...a,
                                        look: {
                                          ...(a.look as any),
                                          visual_references: next,
                                        },
                                      }
                                    : a,
                                );
                              }}
                            />
                            <button
                              className="rounded border border-red-900 bg-red-950/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-200 hover:bg-red-950/50"
                              onClick={() => {
                                const next = analysis.look!.visual_references.filter(
                                  (_, j) => j !== i,
                                );
                                setAnalysis((a) =>
                                  a
                                    ? {
                                        ...a,
                                        look: {
                                          ...(a.look as any),
                                          visual_references: next,
                                        },
                                      }
                                    : a,
                                );
                              }}
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          className="rounded border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:border-[#FF4F00] hover:text-[#FF4F00]"
                          onClick={() => {
                            const next = [...(analysis.look?.visual_references || []), ""];
                            setAnalysis((a) =>
                              a
                                ? {
                                    ...a,
                                    look: { ...(a.look as any), visual_references: next },
                                  }
                                : a,
                            );
                          }}
                          type="button"
                        >
                          Add Reference
                        </button>
                      </div>
                    ) : (
                      <ul className="list-inside list-disc space-y-1 text-gray-300">
                        {analysis.look.visual_references.map((ref, i) => (
                          <li key={i}>{ref}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

