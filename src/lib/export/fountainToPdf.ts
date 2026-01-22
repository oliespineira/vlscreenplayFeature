import PDFDocument from "pdfkit";
import { classifyLine, type ElementType } from "@/lib/scripts/fountainSmart";

// Standard screenplay measurements (in points, 72 points = 1 inch)
const PAGE_WIDTH = 612; // 8.5 inches
const PAGE_HEIGHT = 792; // 11 inches
const MARGIN_LEFT = 72; // 1 inch
const MARGIN_RIGHT = 72; // 1 inch
const MARGIN_TOP = 72; // 1 inch
const MARGIN_BOTTOM = 72; // 1 inch

// Indentation positions (from left margin)
const SCENE_LEFT = 0; // Flush left
const ACTION_LEFT = 0; // Flush left
const CHARACTER_LEFT = 216; // ~3 inches (4.2" from page edge)
const PARENTHETICAL_LEFT = 180; // ~2.5 inches (3.7" from page edge)
const DIALOGUE_LEFT = 108; // ~1.5 inches (2.5" from page edge)
const DIALOGUE_RIGHT = 108; // ~1.5 inches (2.5" from page edge)
const TRANSITION_RIGHT = 0; // Right-aligned

const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

export async function fountainToPdf(fountain: string, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margins: {
        top: MARGIN_TOP,
        bottom: MARGIN_BOTTOM,
        left: MARGIN_LEFT,
        right: MARGIN_RIGHT,
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);

    // Font settings
    const FONT_SIZE = 12;
    const LINE_HEIGHT = 14;
    const SCENE_FONT_SIZE = 12;
    const CHARACTER_FONT_SIZE = 12;
    const DIALOGUE_FONT_SIZE = 12;
    const ACTION_FONT_SIZE = 12;

    let y = MARGIN_TOP;
    let pageNumber = 1;

  // Helper to add new page
  const newPage = () => {
    doc.addPage();
    y = MARGIN_TOP;
    pageNumber++;
    // Add page number at bottom
    doc
      .fontSize(10)
      .fillColor("black")
      .text(
        String(pageNumber),
        PAGE_WIDTH / 2 - 10,
        PAGE_HEIGHT - MARGIN_BOTTOM + 20,
        { align: "center" }
      );
  };

  // Helper to check if we need a new page
  const checkPageBreak = (lines: number = 1) => {
    if (y + lines * LINE_HEIGHT > PAGE_HEIGHT - MARGIN_BOTTOM) {
      newPage();
    }
  };

  // Add title page
  doc.fontSize(24).fillColor("black").text(title, MARGIN_LEFT, MARGIN_TOP + 200, {
    width: CONTENT_WIDTH,
    align: "center",
  });
  newPage();

  // Parse and render Fountain content
  const lines = fountain.split("\n");
  let previousType: ElementType = "action";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      y += LINE_HEIGHT * 0.5; // Small spacing for empty lines
      checkPageBreak();
      continue;
    }

    // Classify the line
    const elementType = classifyLine(line);

    checkPageBreak(2);

    switch (elementType) {
      case "scene": {
        // Scene heading - UPPERCASE, centered or left-aligned
        y += LINE_HEIGHT; // Extra space before scene
        checkPageBreak();
        doc
          .fontSize(SCENE_FONT_SIZE)
          .font("Helvetica-Bold")
          .fillColor("black")
          .text(trimmed.toUpperCase(), MARGIN_LEFT + SCENE_LEFT, y, {
            width: CONTENT_WIDTH - SCENE_LEFT,
          });
        y += LINE_HEIGHT * 1.5;
        previousType = "scene";
        break;
      }

      case "action": {
        // Action - flush left, regular font
        doc
          .fontSize(ACTION_FONT_SIZE)
          .font("Helvetica")
          .fillColor("black")
          .text(trimmed, MARGIN_LEFT + ACTION_LEFT, y, {
            width: CONTENT_WIDTH - ACTION_LEFT,
          });
        y += LINE_HEIGHT;
        previousType = "action";
        break;
      }

      case "character": {
        // Character name - UPPERCASE, indented
        y += LINE_HEIGHT * 0.5; // Space before character
        checkPageBreak();
        doc
          .fontSize(CHARACTER_FONT_SIZE)
          .font("Helvetica-Bold")
          .fillColor("black")
          .text(trimmed.toUpperCase(), MARGIN_LEFT + CHARACTER_LEFT, y, {
            width: CONTENT_WIDTH - CHARACTER_LEFT,
          });
        y += LINE_HEIGHT;
        previousType = "character";
        break;
      }

      case "parenthetical": {
        // Parenthetical - indented, italic
        const parentheticalText = trimmed.startsWith("(") && trimmed.endsWith(")")
          ? trimmed
          : `(${trimmed})`;
        doc
          .fontSize(ACTION_FONT_SIZE)
          .font("Helvetica-Oblique")
          .fillColor("black")
          .text(parentheticalText, MARGIN_LEFT + PARENTHETICAL_LEFT, y, {
            width: CONTENT_WIDTH - PARENTHETICAL_LEFT - DIALOGUE_RIGHT,
          });
        y += LINE_HEIGHT;
        previousType = "parenthetical";
        break;
      }

      case "dialogue": {
        // Dialogue - indented, regular font
        doc
          .fontSize(DIALOGUE_FONT_SIZE)
          .font("Helvetica")
          .fillColor("black")
          .text(trimmed, MARGIN_LEFT + DIALOGUE_LEFT, y, {
            width: CONTENT_WIDTH - DIALOGUE_LEFT - DIALOGUE_RIGHT,
          });
        y += LINE_HEIGHT;
        previousType = "dialogue";
        break;
      }

      case "transition": {
        // Transition - right-aligned, UPPERCASE
        const transitionText = trimmed.toUpperCase();
        doc
          .fontSize(ACTION_FONT_SIZE)
          .font("Helvetica")
          .fillColor("black")
          .text(transitionText, MARGIN_LEFT, y, {
            width: CONTENT_WIDTH,
            align: "right",
          });
        y += LINE_HEIGHT * 1.5;
        previousType = "transition";
        break;
      }

      default: {
        // Default to action
        doc
          .fontSize(ACTION_FONT_SIZE)
          .font("Helvetica")
          .fillColor("black")
          .text(trimmed, MARGIN_LEFT + ACTION_LEFT, y, {
            width: CONTENT_WIDTH - ACTION_LEFT,
          });
        y += LINE_HEIGHT;
        previousType = "action";
      }
    }
  }

    doc.end();
  });
}
