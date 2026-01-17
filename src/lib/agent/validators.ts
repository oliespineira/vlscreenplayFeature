export function assertQuestionsOnly(text: string): void {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Response must contain at least one question.");
  }

  // Check that every line ends with '?'
  for (const line of lines) {
    if (!line.endsWith("?")) {
      throw new Error(
        `Every line must be a question ending with '?'. Found: "${line.substring(0, 50)}..."`
      );
    }
  }

  // Check for forbidden phrases (case-insensitive)
  const forbiddenPhrases = [
    "you should",
    "i suggest",
    "try to",
    "consider doing",
    "do this",
    "here is",
    "rewrite",
    "change it to",
  ];

  const lowerText = text.toLowerCase();
  for (const phrase of forbiddenPhrases) {
    if (lowerText.includes(phrase)) {
      throw new Error(
        `Response must only contain questions, not advice. Found forbidden phrase: "${phrase}"`
      );
    }
  }
}

export function assertNonPrescriptiveNonGenerative(output: string): void {
  const lines = output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Response is empty.");
  }

  const lowerOutput = output.toLowerCase();

  // A) Prescriptive language (case-insensitive)
  const prescriptivePhrases = [
    "you should",
    "i suggest",
    "try to",
    "consider",
    "recommend",
    "the best way",
    "rewrite",
    "change this",
    "add a",
    "remove",
    "cut",
    "fix",
    "make it",
    "have him",
    "have her",
    "let him",
    "let her",
  ];

  for (const phrase of prescriptivePhrases) {
    if (lowerOutput.includes(phrase)) {
      throw new Error(`Found prescriptive language: "${phrase}"`);
    }
  }

  // B) Imperative sentence starts (case-insensitive)
  const imperativeStarts = [
    "add ",
    "remove ",
    "cut ",
    "rewrite ",
    "change ",
    "make ",
    "let ",
    "have ",
    "insert ",
    "delete ",
    "replace ",
    "try ",
    "consider ",
  ];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const start of imperativeStarts) {
      if (lowerLine.startsWith(start)) {
        throw new Error(`Found imperative sentence start: "${start}" in line: "${line.substring(0, 50)}"`);
      }
    }
  }

  // C) Screenplay-line generation patterns
  // Check for CHARACTER cue followed by dialogue-like line
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    // Check if current line looks like a CHARACTER cue (ALL CAPS, 2-30 chars, not scene heading, not transition)
    const isCharacterCue =
      /^[A-Z0-9 ()'.-]{2,30}$/.test(currentLine) &&
      !currentLine.toUpperCase().startsWith("INT") &&
      !currentLine.toUpperCase().startsWith("EXT") &&
      !currentLine.toUpperCase().startsWith("I/E") &&
      !currentLine.toUpperCase().endsWith("TO:");

    if (isCharacterCue && nextLine && nextLine.length > 0) {
      throw new Error(
        `Found generated screenplay dialogue pattern (character cue + dialogue): "${currentLine}" followed by "${nextLine.substring(0, 30)}"`
      );
    }
  }

  // Check for dialogue indentation (8+ spaces followed by text)
  for (const line of lines) {
    if (/^\s{8,}\S+/.test(line)) {
      throw new Error(`Found dialogue indentation pattern: "${line.substring(0, 50)}"`);
    }
  }

  // Check for quoted lines (screenplay example lines)
  for (const line of lines) {
    if (/^.*["""].+["""].*$/.test(line)) {
      throw new Error(`Found quoted line (potential screenplay generation): "${line.substring(0, 50)}"`);
    }
  }

  // D) Reject fenced code blocks or screenplay formatting markers
  if (output.includes("```") || output.includes("---") || output.includes("===")) {
    throw new Error("Found code blocks or formatting markers");
  }
}
