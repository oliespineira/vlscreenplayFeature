import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; sceneId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId, sceneId } = await params;

    await requireProjectOwnerForApi(projectId, user.id);

    // Verify scene belongs to project
    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      select: { projectId: true },
    });

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    if (scene.projectId !== projectId) {
      return NextResponse.json(
        { error: "Scene does not belong to this project" },
        { status: 400 }
      );
    }

    await prisma.scene.delete({
      where: { id: sceneId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting scene:", error);
    if (error instanceof Error && (error.message === "Project not found" || error.message === "Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete scene" },
      { status: 500 }
    );
  }
}
