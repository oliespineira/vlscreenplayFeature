import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function POST(
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

    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : null;
    const thumbUrl = typeof body.thumbUrl === "string" ? body.thumbUrl.trim() : undefined;
    const source = typeof body.source === "string" ? body.source : "upload";
    const attribution = typeof body.attribution === "string" ? body.attribution : "";
    const pinned = typeof body.pinned === "boolean" ? body.pinned : false;
    const position = typeof body.position === "number" ? body.position : 0;

    if (!url || url.length === 0) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    await prisma.sceneImage.create({
      data: {
        sceneId,
        url,
        thumbUrl: thumbUrl || "",
        source,
        attribution,
        pinned,
        position,
      },
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
    console.error("Error adding scene image:", error);
    if (error instanceof Error && (error.message === "Project not found" || error.message === "Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to add scene image" },
      { status: 500 }
    );
  }
}
