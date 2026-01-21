import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { jsonFromLLM } from "@/lib/ai/openai";
import { ScriptAnalysisSchema } from "@/lib/domain/scriptAnalysis";
import { docxToText } from "@/lib/importers/docxToText";
import { pdfToText } from "@/lib/importers/pdfToText";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15mb
const MIN_TEXT_LENGTH = 40;
const MAX_ANALYSIS_CHARS = 18_000;

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

async function extractTextFromUpload(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();

  if (name.endsWith(".pdf")) return pdfToText(file);
  if (name.endsWith(".docx")) return docxToText(file);
  if (name.endsWith(".txt")) return file.text();

  throw new Error("UNSUPPORTED_FILE_TYPE");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;

    await requireProjectOwnerForApi(projectId, user.id);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set on server" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 15MB" },
        { status: 400 },
      );
    }

    let fullText: string;
    try {
      fullText = normalizeNewlines(await extractTextFromUpload(file));
    } catch (e) {
      if (e instanceof Error && e.message === "UNSUPPORTED_FILE_TYPE") {
        return NextResponse.json(
          { error: "Unsupported file type. Use .pdf, .docx or .txt" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "File processing failed" },
        { status: 400 },
      );
    }

    if (!fullText || fullText.trim().length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        { error: "File seems empty or unreadable" },
        { status: 400 },
      );
    }

    const analysisText =
      fullText.length > MAX_ANALYSIS_CHARS
        ? `${fullText.slice(0, MAX_ANALYSIS_CHARS)}\n\n[script truncated for analysis]`
        : fullText;

    const system = [
      "You are a professional screenplay analyst and film industry expert.",
      "Analyze the provided script and extract structured insights that can populate a film dossier or pitch deck.",
      "Be concise but specific. Use complete sentences where needed.",
      "Focus on elements that would be valuable for pitching to investors, producers, or distributors.",
      "For the logline, create a compelling one-line summary that captures the story's essence, main character, central conflict, and stakes without revealing plot twists or endings.",
    ].join(" ");

    const prompt = `
Read the following script and return ONLY a valid JSON object with these exact fields. Do not include any text before or after the JSON. Each field should contain only the requested content, not nested JSON:

{
  "main_theme": "The central theme or message",
  "characters": [
    {"name": "Character Name", "description": "Character description", "role": "Character role"}
  ],
  "tone": "The overall mood and style",
  "logline": "A compelling one-line summary that captures the story's essence without spoilers",
  "theme_analysis": "Deeper exploration of themes, symbolism, narrative structure",
  "look": {
    "aesthetic": "Visual style description",
    "color_palette": ["Color 1", "Color 2", "Color 3"],
    "visual_references": ["Reference 1", "Reference 2"]
  },
  "scenes": [
    {
      "title": "Scene Title",
      "description": "What happens in this scene",
      "tone": "Scene-specific tone/mood",
      "sequence_index": 1,
      "tags": ["tag1", "tag2"],
      "characters": [
        {"name": "Character Name", "role": "Character role", "description": "What they do in this scene"}
      ]
    }
  ]
}

IMPORTANT SCENE EXTRACTION GUIDELINES:
- Extract 8-15 key scenes that represent the major story beats
- Give each scene a compelling, descriptive title (e.g., "The Discovery", "First Confrontation", "The Betrayal")
- Write clear descriptions of what happens in each scene
- Assign appropriate tones for each scene (can differ from overall script tone)
- Number scenes sequentially starting from 1
- Add relevant tags like "action", "dialogue", "climax", "setup", "resolution", etc.
- Focus on scenes that advance the plot, develop characters, or create emotional impact
- For each scene, identify ALL characters that appear in that specific scene
- For scene characters, include their name, role (protagonist, antagonist, supporting, etc.), and what they do in that scene
- Only include characters who actually appear or are mentioned in the scene

Script:
${analysisText}
`;

    const analysis = await jsonFromLLM({
      system,
      prompt,
      schemaName: "ScriptAnalysis",
      validate: (obj) => ScriptAnalysisSchema.parse(obj),
    });

    const analysisWithMeta = {
      ...analysis,
      scenes_created: analysis.scenes?.length ?? 0,
      scene_creation_error: null,
    };

    await prisma.project.update({
      where: { id: projectId },
      data: {
        scriptText: fullText,
        scriptAnalysis: analysisWithMeta,
      },
    });

    return NextResponse.json(analysisWithMeta);
  } catch (error) {
    console.error("Analyze script error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

