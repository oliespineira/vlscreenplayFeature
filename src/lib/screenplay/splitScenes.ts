import { parseScenesFromFountain } from "@/lib/scripts/fountainParser";

export type SceneWithText = {
  index: number;
  slugline: string;
  text: string;
};

/**
 * Splits a Fountain screenplay into scenes with their full text content.
 * Uses existing scene parser to find scene headings, then extracts text between headings.
 */
export function splitScenes(scriptText: string): SceneWithText[] {
  const lines = scriptText.split("\n");
  const scenes = parseScenesFromFountain(scriptText);
  
  if (scenes.length === 0) {
    return [];
  }

  const scenesWithText: SceneWithText[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const startLine = scene.startLine - 1; // Convert to 0-based index
    const endLine = i < scenes.length - 1 
      ? scenes[i + 1].startLine - 1 
      : lines.length;

    // Extract text from startLine to endLine (exclusive)
    const sceneLines = lines.slice(startLine, endLine);
    const sceneText = sceneLines.join("\n").trim();

    scenesWithText.push({
      index: scene.index,
      slugline: scene.slugline,
      text: sceneText,
    });
  }

  return scenesWithText;
}
