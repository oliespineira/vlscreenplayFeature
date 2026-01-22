import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;

    await requireProjectOwnerForApi(projectId, user.id);

    const body = await request.json();
    const sceneIds = Array.isArray(body.sceneIds) ? body.sceneIds : null;

    if (!sceneIds || sceneIds.length === 0) {
      return NextResponse.json(
        { error: "sceneIds array is required" },
        { status: 400 }
      );
    }

    // Verify all scenes belong to this project
    const scenes = await prisma.scene.findMany({
      where: {
        id: { in: sceneIds },
        projectId,
      },
      select: { id: true },
    });

    if (scenes.length !== sceneIds.length) {
      return NextResponse.json(
        { error: "Some scenes not found or don't belong to this project" },
        { status: 400 }
      );
    }

    // Update sequenceIndex for each scene based on array order
    await prisma.$transaction(
      sceneIds.map((sceneId: string, index: number) =>
        prisma.scene.update({
          where: { id: sceneId },
          data: { sequenceIndex: index },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error reordering scenes:", error);
    if (error instanceof Error && (error.message === "Project not found" || error.message === "Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to reorder scenes" },
      { status: 500 }
    );
  }
}
