import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; sceneId: string; imageId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId, sceneId, imageId } = await params;

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

    // Verify image belongs to scene
    const image = await prisma.sceneImage.findUnique({
      where: { id: imageId },
      select: { sceneId: true },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.sceneId !== sceneId) {
      return NextResponse.json(
        { error: "Image does not belong to this scene" },
        { status: 400 }
      );
    }

    await prisma.sceneImage.delete({
      where: { id: imageId },
    });

    // Return updated scene with images
    const updatedScene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(updatedScene);
  } catch (error) {
    console.error("Error deleting scene image:", error);
    if (error instanceof Error && (error.message === "Project not found" || error.message === "Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete scene image" },
      { status: 500 }
    );
  }
}
