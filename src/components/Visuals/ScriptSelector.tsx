"use client";

interface Script {
  id: string;
  title: string;
  updatedAt: string;
}

interface ScriptSelectorProps {
  scripts: Script[];
  selectedScriptId: string | null;
  onSelect: (scriptId: string) => void;
}

export function ScriptSelector({
  scripts,
  selectedScriptId,
  onSelect,
}: ScriptSelectorProps) {
  if (scripts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-black/50 p-4 backdrop-blur-sm">
        <p className="text-sm text-gray-400">No scripts available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-black/50 p-4 backdrop-blur-sm">
      <label className="mb-2 block text-sm font-medium uppercase tracking-wider text-gray-300">
        Select Script
      </label>
      <select
        value={selectedScriptId || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded border border-gray-700 bg-black/50 px-4 py-2 text-white focus:border-pink-400 focus:outline-none"
      >
        {scripts.map((script) => (
          <option key={script.id} value={script.id}>
            {script.title}
          </option>
        ))}
      </select>
    </div>
  );
}
