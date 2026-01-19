import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { ensureUser } from "@/lib/auth/ensureUser";

const MAX_CONTENT_LENGTH = 2 * 1024 * 1024; // 2MB characters

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    // Authenticate and verify ownership
    const user = await ensureUser();
    await requireProjectOwnerForApi(projectId, user.id);

    const body = await request.json();
    const { title, content, sourceType } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Normalize line endings to \n
    const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Create script
    const script = await prisma.script.create({
      data: {
        title: title.trim() || "Untitled Script",
        projectId,
        fountain: normalizedContent,
      },
    });

    return NextResponse.json(
      { scriptId: script.id, title: script.title },
      { status: 201 }
    );
  } catch (error) {
    console.error("Import script error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
