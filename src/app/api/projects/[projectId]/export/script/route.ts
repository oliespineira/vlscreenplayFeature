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

    // Get the most recent script
    const scripts = await prisma.script.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      take: 1,
    });

    if (scripts.length === 0) {
      return NextResponse.json(
        { error: "No script found for this project" },
        { status: 404 }
      );
    }

    const script = scripts[0];

    // TODO: Implement script export
    // This should:
    // - Convert fountain to PDF or formatted document
    // - Or return fountain file for download
    // For now, return the fountain text as a downloadable file

    return new NextResponse(script.fountain, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${script.title.replace(/[^a-z0-9]/gi, "_")}.fountain"`,
      },
    });
  } catch (error) {
    console.error("Error exporting script:", error);
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to export script" },
      { status: 500 }
    );
  }
}
