import { detectIntentForLine, transformLine, type ElementType } from "@/lib/scripts/fountainSmart";

/**
 * Converts plain text to Fountain screenplay format
 * Attempts to detect scene headings, characters, dialogue, and action
 */
export function textToFountain(text: string): string {
  const lines = text.split("\n");
  const formattedLines: string[] = [];
  let currentElement: ElementType = "action";
  let inDialogueBlock = false;
  let previousLineWasCharacter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines but preserve them
    if (trimmed.length === 0) {
      formattedLines.push("");
      inDialogueBlock = false;
      previousLineWasCharacter = false;
      continue;
    }

    // Detect what type of line this should be
    const detectedType = detectIntentForLine(trimmed);

    // Smart formatting logic
    if (detectedType === "scene") {
      // Scene heading - uppercase and flush left
      formattedLines.push(transformLine(trimmed, "scene"));
      currentElement = "scene";
      inDialogueBlock = false;
      previousLineWasCharacter = false;
    } else if (detectedType === "character") {
      // Character name - uppercase, indented
      formattedLines.push(transformLine(trimmed, "character"));
      currentElement = "character";
      inDialogueBlock = true;
      previousLineWasCharacter = true;
    } else if (detectedType === "transition") {
      // Transition - uppercase, indented
      formattedLines.push(transformLine(trimmed, "transition"));
      currentElement = "transition";
      inDialogueBlock = false;
      previousLineWasCharacter = false;
    } else if (detectedType === "parenthetical") {
      // Parenthetical - indented
      formattedLines.push(transformLine(trimmed, "parenthetical"));
      currentElement = "parenthetical";
      inDialogueBlock = true;
      previousLineWasCharacter = false;
    } else {
      // Action or dialogue - need to determine based on context
      if (previousLineWasCharacter || (inDialogueBlock && currentElement === "dialogue")) {
        // If we just had a character name, or we're in a dialogue block, this is likely dialogue
        // Check if it looks like dialogue (not all caps, reasonable length, or contains quotes)
        const isAllCaps = trimmed === trimmed.toUpperCase();
        const hasQuotes = trimmed.includes('"') || trimmed.includes("'");
        const isLongEnough = trimmed.length > 10;
        const isMixedCase = trimmed !== trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase();
        
        if (hasQuotes || (isMixedCase && isLongEnough) || (!isAllCaps && trimmed.length > 5)) {
          formattedLines.push(transformLine(trimmed, "dialogue"));
          currentElement = "dialogue";
          inDialogueBlock = true;
          previousLineWasCharacter = false;
        } else {
          // Short or all-caps line after character might be action
          formattedLines.push(transformLine(trimmed, "action"));
          currentElement = "action";
          inDialogueBlock = false;
          previousLineWasCharacter = false;
        }
      } else {
        // Action line - flush left
        formattedLines.push(transformLine(trimmed, "action"));
        currentElement = "action";
        inDialogueBlock = false;
        previousLineWasCharacter = false;
      }
    }
  }

  return formattedLines.join("\n");
}
