export type ElementType =
  | "scene"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export const INDENT = {
  dialogue: 8,
  parenthetical: 12,
  character: 18,
  transition: 55, // Right-aligned transitions (reduced from 65)
} as const;

export function extractCharacterNames(fountain: string): string[] {
  const lines = fountain.split("\n");
  const nameCounts = new Map<string, number>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Character cue line: uppercase, length 2-30, not scene heading, not transition, no colon
    // Use trimmed (works even when indented)
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
      const name = trimmed;
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    }
  }

  // Sort by frequency desc, then alphabetically
  return Array.from(nameCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([name]) => name);
}

export function classifyLine(line: string): ElementType {
  const trimmed = line.trim();
  if (trimmed.length === 0) return "action";

  const upperTrimmed = trimmed.toUpperCase();
  const leadingSpaces = line.length - line.trimStart().length;

  // Scene heading (flush-left)
  if (
    leadingSpaces === 0 &&
    (upperTrimmed.startsWith("INT.") ||
      upperTrimmed.startsWith("EXT.") ||
      upperTrimmed.startsWith("INT./EXT.") ||
      upperTrimmed.startsWith("I/E."))
  ) {
    return "scene";
  }

  // Transition (check indentation)
  if (upperTrimmed.endsWith(" TO:") || upperTrimmed === "FADE IN:" || upperTrimmed === "FADE OUT:") {
    if (leadingSpaces >= INDENT.transition) {
      return "transition";
    }
  }

  // Parenthetical (check indentation)
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    if (leadingSpaces >= INDENT.parenthetical) {
      return "parenthetical";
    }
  }

  // Character (check indentation and uppercase short)
  const isUppercase = trimmed === upperTrimmed && trimmed.length >= 2 && trimmed.length <= 30;
  if (isUppercase && !trimmed.includes(":")) {
    if (leadingSpaces >= INDENT.character) {
      return "character";
    }
  }

  // Dialogue (indented at dialogue level or more, but not other types)
  if (leadingSpaces >= INDENT.dialogue && trimmed.length > 0) {
    // Not a parenthetical or transition
    if (!(trimmed.startsWith("(") && trimmed.endsWith(")")) && 
        !upperTrimmed.endsWith(" TO:") && 
        upperTrimmed !== "FADE IN:" && 
        upperTrimmed !== "FADE OUT:") {
      return "dialogue";
    }
  }

  // Default to action (flush-left or minimal indentation)
  return "action";
}

export function detectIntentForLine(trimmed: string): ElementType {
  if (trimmed.length === 0) return "action";

  const upperTrimmed = trimmed.toUpperCase();

  // Scene heading
  if (
    upperTrimmed.startsWith("INT.") ||
    upperTrimmed.startsWith("EXT.") ||
    upperTrimmed.startsWith("INT./EXT.") ||
    upperTrimmed.startsWith("I/E.")
  ) {
    return "scene";
  }

  // Transition
  if (
    upperTrimmed === "CUT TO:" ||
    upperTrimmed === "FADE IN:" ||
    upperTrimmed === "FADE OUT:" ||
    upperTrimmed === "DISSOLVE TO:" ||
    upperTrimmed === "SMASH CUT TO:" ||
    upperTrimmed.endsWith(" TO:")
  ) {
    return "transition";
  }

  // Parenthetical
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return "parenthetical";
  }

  // Character (uppercase, short, not scene/transition)
  const isUppercase = trimmed === upperTrimmed && trimmed.length >= 2 && trimmed.length <= 30;
  if (isUppercase && !trimmed.includes(":")) {
    return "character";
  }

  // Default to action
  return "action";
}

export function nextLineIndentAfter(type: ElementType): number {
  switch (type) {
    case "scene":
    case "action":
    case "transition":
      return 0;
    case "character":
    case "parenthetical":
      return INDENT.dialogue;
    case "dialogue":
      return INDENT.dialogue; // Continue dialogue on next line
    default:
      return 0;
  }
}

export function transformLine(line: string, to: ElementType): string {
  const trimmed = line.trim();

  switch (to) {
    case "scene":
      return trimmed.length ? trimmed.toUpperCase() : "INT. LOCATION - DAY";

    case "action":
      return trimmed;

    case "character":
      return " ".repeat(INDENT.character) + trimmed.toUpperCase();

    case "parenthetical":
      let inner = trimmed;
      if (!inner.startsWith("(")) inner = "(" + inner;
      if (!inner.endsWith(")")) inner = inner + ")";
      return " ".repeat(INDENT.parenthetical) + inner;

    case "dialogue":
      return " ".repeat(INDENT.dialogue) + trimmed;

    case "transition":
      let t = trimmed.toUpperCase();
      if (t.length && !t.endsWith("TO:") && !t.endsWith(":")) {
        t = t + " TO:";
      }
      if (t.length && !t.endsWith(":")) {
        t = t + ":";
      }
      if (t.length === 0) {
        t = "FADE IN:";
      }
      return " ".repeat(INDENT.transition) + t;

    default:
      return line;
  }
}
