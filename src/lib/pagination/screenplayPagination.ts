export type ElementType = "scene" | "action" | "character" | "parenthetical" | "dialogue" | "transition" | "other";

/**
 * Detects the element type of a screenplay line
 */
export function detectElementType(line: string, previousType?: ElementType): ElementType {
  const trimmed = line.trim();
  
  // Empty line
  if (trimmed === "") {
    return "other";
  }
  
  // Scene heading
  if (/^\s*(INT\.|EXT\.|INT\/EXT\.|EST\.)/i.test(trimmed)) {
    return "scene";
  }
  
  // Transition (e.g., "CUT TO:", "FADE IN:", etc.)
  if (/^\s*([A-Z ]+TO:)\s*$/.test(trimmed) || /^\s*(FADE IN|FADE OUT|DISSOLVE TO|SMASH CUT|MATCH CUT)/i.test(trimmed)) {
    return "transition";
  }
  
  // Parenthetical
  if (/^\s*\(.*\)\s*$/.test(trimmed)) {
    return "parenthetical";
  }
  
  // Character name (all caps, reasonable length, not scene/transition)
  if (/^\s*[A-Z0-9 ()'.-]{2,30}\s*$/.test(trimmed) && trimmed.length <= 30) {
    // Check it's not a scene or transition
    if (!/^\s*(INT\.|EXT\.|INT\/EXT\.|EST\.)/i.test(trimmed) && 
        !/^\s*([A-Z ]+TO:)\s*$/.test(trimmed)) {
      return "character";
    }
  }
  
  // Dialogue (if previous line was character or parenthetical)
  if (previousType === "character" || previousType === "parenthetical") {
    if (trimmed.length > 0 && !/^\s*(INT\.|EXT\.|INT\/EXT\.|EST\.)/i.test(trimmed)) {
      return "dialogue";
    }
  }
  
  // Default to action
  return "action";
}

/**
 * Estimates how many wrapped lines a screenplay line will take
 * Based on standard screenplay formatting widths
 */
export function estimateWrappedLines(textLine: string, type: ElementType): number {
  const trimmed = textLine.trim();
  
  // Empty lines count as 1 rendered line (spacing)
  if (trimmed === "") {
    return 1;
  }
  
  // Character names are typically 1 line
  if (type === "character") {
    return 1;
  }
  
  // Max characters per line for each element type
  const maxChars: Record<ElementType, number> = {
    action: 62,
    dialogue: 38,
    parenthetical: 28,
    character: 30,
    scene: 60,
    transition: 22,
    other: 62,
  };
  
  const maxCharsForType = maxChars[type] || 62;
  const visibleLines = Math.max(1, Math.ceil(trimmed.length / maxCharsForType));
  
  return visibleLines;
}

export type PageBreak = { 
  pageNumber: number; 
  atModelLine: number;
};

/**
 * Computes page breaks for a screenplay script
 * Returns an array of page breaks indicating where each new page starts
 */
export function computePageBreaks(scriptText: string, linesPerPage: number = 55): PageBreak[] {
  const lines = scriptText.split("\n");
  const breaks: PageBreak[] = [];
  
  let renderedLineCounter = 0;
  let previousNonEmptyType: ElementType | undefined = undefined;
  let pageNumber = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const elementType = detectElementType(line, previousNonEmptyType);
    
    // Update previous type if not empty
    if (elementType !== "other") {
      previousNonEmptyType = elementType;
    }
    
    const wrappedLines = estimateWrappedLines(line, elementType);
    renderedLineCounter += wrappedLines;
    
    // Check if we've crossed a page boundary
    if (renderedLineCounter >= linesPerPage * pageNumber) {
      pageNumber++;
      // Record break at the NEXT line (or current line if it's the start of a new page)
      const breakLine = i + 1;
      if (breakLine <= lines.length) {
        breaks.push({
          pageNumber,
          atModelLine: breakLine,
        });
      }
    }
  }
  
  return breaks;
}

/**
 * Gets the current page number based on cursor line and page breaks
 */
export function getCurrentPage(cursorLine: number, breaks: PageBreak[]): number {
  if (breaks.length === 0) {
    return 1;
  }
  
  // Find the last break before or at the cursor line
  for (let i = breaks.length - 1; i >= 0; i--) {
    if (breaks[i].atModelLine <= cursorLine) {
      return breaks[i].pageNumber;
    }
  }
  
  return 1;
}

/**
 * Gets the total number of pages
 */
export function getTotalPages(scriptText: string, breaks: PageBreak[], linesPerPage: number = 55): number {
  if (breaks.length === 0) {
    // Estimate based on total rendered lines
    const lines = scriptText.split("\n");
    let renderedLineCounter = 0;
    let previousNonEmptyType: ElementType | undefined = undefined;
    
    for (const line of lines) {
      const elementType = detectElementType(line, previousNonEmptyType);
      if (elementType !== "other") {
        previousNonEmptyType = elementType;
      }
      renderedLineCounter += estimateWrappedLines(line, elementType);
    }
    
    return Math.max(1, Math.ceil(renderedLineCounter / linesPerPage));
  }
  
  // Total pages = last page number + remaining pages after last break
  const lastBreak = breaks[breaks.length - 1];
  const allLines = scriptText.split("\n");
  const remainingLines = allLines.slice(lastBreak.atModelLine - 1);
  let remainingRenderedLines = 0;
  let previousNonEmptyType: ElementType | undefined = undefined;
  
  for (const line of remainingLines) {
    const elementType = detectElementType(line, previousNonEmptyType);
    if (elementType !== "other") {
      previousNonEmptyType = elementType;
    }
    remainingRenderedLines += estimateWrappedLines(line, elementType);
  }
  
  // Calculate how many pages the remaining content takes
  const remainingPages = Math.ceil(remainingRenderedLines / linesPerPage);
  // Last break is at pageNumber, so total is pageNumber + remainingPages - 1
  // But if remainingPages is 0, we still have at least the last break's page
  return Math.max(lastBreak.pageNumber, lastBreak.pageNumber + remainingPages - 1);
}
