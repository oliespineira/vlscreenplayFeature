export type Scene = {
  index: number;
  slugline: string;
  startLine: number;
};

export function parseScenesFromFountain(fountain: string): Scene[] {
  const lines = fountain.split("\n");
  const scenes: Scene[] = [];
  let sceneIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const upperTrimmed = trimmed.toUpperCase();
    if (
      upperTrimmed.startsWith("INT.") ||
      upperTrimmed.startsWith("EXT.") ||
      upperTrimmed.startsWith("INT./EXT.") ||
      upperTrimmed.startsWith("I/E.")
    ) {
      sceneIndex++;
      scenes.push({
        index: sceneIndex,
        slugline: trimmed,
        startLine: i + 1, // 1-based line number for Monaco
      });
    }
  }

  return scenes;
}
