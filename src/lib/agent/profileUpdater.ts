import type { WriterProfile } from "@prisma/client";

export function updateProfileFromUserText(
  profile: WriterProfile,
  userText: string,
): Partial<WriterProfile> {
  const lowerText = userText.toLowerCase();
  const updates: Partial<WriterProfile> = {};

  // Tone detection
  if (lowerText.includes("gentle") || lowerText.includes("kind") || lowerText.includes("soft")) {
    updates.tone = "gentle";
  } else if (
    lowerText.includes("rigorous") ||
    lowerText.includes("tough") ||
    lowerText.includes("strict")
  ) {
    updates.tone = "rigorous";
  }

  // Focus detection
  if (lowerText.includes("character")) {
    updates.focus = "character";
  } else if (lowerText.includes("pacing")) {
    updates.focus = "pacing";
  } else if (lowerText.includes("dialogue")) {
    updates.focus = "dialogue";
  } else if (lowerText.includes("theme")) {
    updates.focus = "theme";
  }

  // Avoid flags
  if (lowerText.includes("don't ask about theme") || lowerText.includes("avoid theme")) {
    updates.avoidTheme = true;
  }
  if (
    lowerText.includes("avoid symbolism") ||
    lowerText.includes("don't overanalyze symbols")
  ) {
    updates.avoidSymbolism = true;
  }

  // Update notes (append compact line, keep last ~1500 chars)
  const timestamp = new Date().toISOString().split("T")[0];
  const newNote = `[${timestamp}] ${userText.trim()}\n`;
  const updatedNotes = (profile.notes + newNote).slice(-1500);
  updates.notes = updatedNotes;

  return updates;
}
