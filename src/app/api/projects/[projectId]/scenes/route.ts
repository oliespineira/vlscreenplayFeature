import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;

    await requireProjectOwnerForApi(projectId, user.id);

    const scenes = await prisma.scene.findMany({
      where: { projectId },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: [
        { sequenceIndex: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(scenes);
  } catch (error) {
    console.error("Error fetching scenes:", error);
    if (error instanceof Error && (error.message === "Project not found" || error.message === "Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch scenes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;

    await requireProjectOwnerForApi(projectId, user.id);

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : null;

    if (!title || title.length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title is too long" },
        { status: 400 }
      );
    }

    // Get max sequenceIndex and add 1
    const maxScene = await prisma.scene.findFirst({
      where: { projectId },
      orderBy: { sequenceIndex: "desc" },
      select: { sequenceIndex: true },
    });

    const sequenceIndex = (maxScene?.sequenceIndex ?? -1) + 1;

    const scene = await prisma.scene.create({
      data: {
        projectId,
        title,
        sequenceIndex,
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(scene);
  } catch (error) {
    console.error("Error creating scene:", error);
    if (error instanceof Error && (error.message === "Project not found" || error.message === "Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create scene" },
      { status: 500 }
    );
  }
}
