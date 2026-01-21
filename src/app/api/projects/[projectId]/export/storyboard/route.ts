import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;
    await requireProjectOwnerForApi(projectId, user.id);

    const body = await request.json();
    const scriptId = body.scriptId;

    if (!scriptId || typeof scriptId !== "string") {
      return NextResponse.json(
        { error: "scriptId is required" },
        { status: 400 }
      );
    }

    // Verify script belongs to project
    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        projectId,
      },
    });

    if (!script) {
      return NextResponse.json(
        { error: "Script not found or does not belong to this project" },
        { status: 404 }
      );
    }

    // TODO: Implement storyboard export
    // This should generate a PDF with:
    // - Scene cards with visual elements
    // - Scene text/excerpts
    // - Layout similar to a traditional storyboard

    return NextResponse.json({
      message: "Storyboard export not yet implemented. Generate storyboard from Visual Elements.",
      downloadUrl: null,
    });
  } catch (error) {
    console.error("Error exporting storyboard:", error);
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to export storyboard" },
      { status: 500 }
    );
  }
}
