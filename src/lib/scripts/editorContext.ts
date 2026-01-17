import { classifyLine, type ElementType } from "@/lib/scripts/fountainSmart";

export type CursorContext = {
  lineNumber: number;
  column: number;
  elementType: ElementType;
  activeCharacter?: string;
  sceneSlugline?: string;
  sceneIndex?: number;
  scenePosition?: "early" | "middle" | "late";
};

export function computeCursorContext(params: {
  fountain: string;
  lineNumber: number; // 1-based
  column: number;
  scenes: { index: number; slugline: string; startLine: number }[];
}): CursorContext {
  const { fountain, lineNumber, column, scenes } = params;
  const lines = fountain.split("\n");
  const currentLine = lines[lineNumber - 1] ?? "";
  const elementType = classifyLine(currentLine);

  // Find active scene
  const activeScene = scenes
    .slice()
    .reverse()
    .find((scene) => scene.startLine <= lineNumber);

  let sceneSlugline: string | undefined;
  let sceneIndex: number | undefined;
  let scenePosition: "early" | "middle" | "late" | undefined;

  if (activeScene) {
    sceneSlugline = activeScene.slugline;
    sceneIndex = activeScene.index;

    // Find scene end line
    const nextScene = scenes.find((s) => s.startLine > activeScene.startLine);
    const endLine = nextScene ? nextScene.startLine - 1 : lines.length;

    // Determine scene position
    const sceneLen = Math.max(1, endLine - activeScene.startLine + 1);
    const offset = lineNumber - activeScene.startLine;
    const ratio = offset / sceneLen;

    if (ratio < 0.33) {
      scenePosition = "early";
    } else if (ratio < 0.66) {
      scenePosition = "middle";
    } else {
      scenePosition = "late";
    }
  }

  // Determine active character
  let activeCharacter: string | undefined;
  if (elementType === "dialogue" || elementType === "parenthetical") {
    // Scan upward from current line to scene start
    const startScan = Math.max(0, lineNumber - 1);
    const sceneStart = activeScene ? Math.max(0, activeScene.startLine - 1) : 0;

    for (let i = startScan; i >= sceneStart; i--) {
      const line = lines[i] ?? "";
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;

      const lineType = classifyLine(line);
      if (lineType === "character") {
        activeCharacter = trimmed.toUpperCase();
        break;
      }

      // Also check if it's an uppercase short line (character cue heuristic)
      const upperTrimmed = trimmed.toUpperCase();
      const isUppercase = trimmed === upperTrimmed && trimmed.length >= 2 && trimmed.length <= 30;
      const isSceneHeading =
        upperTrimmed.startsWith("INT.") ||
        upperTrimmed.startsWith("EXT.") ||
        upperTrimmed.startsWith("INT./EXT.") ||
        upperTrimmed.startsWith("I/E.");
      const isTransition = upperTrimmed.endsWith(" TO:") || upperTrimmed === "FADE IN:" || upperTrimmed === "FADE OUT:";
      const hasColon = trimmed.includes(":");

      if (isUppercase && !isSceneHeading && !isTransition && !hasColon) {
        activeCharacter = trimmed.toUpperCase();
        break;
      }
    }
  }

  return {
    lineNumber,
    column,
    elementType,
    activeCharacter,
    sceneSlugline,
    sceneIndex,
    scenePosition,
  };
}
