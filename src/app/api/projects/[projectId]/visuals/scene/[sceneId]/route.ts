import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; sceneId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId, sceneId } = await params;
    await requireProjectOwnerForApi(projectId, user.id);

    const visualElements = await prisma.visualElement.findMany({
      where: {
        projectId,
        sceneId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(visualElements);
  } catch (error) {
    console.error("Error fetching visual elements:", error);
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch visual elements" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; sceneId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId, sceneId } = await params;
    await requireProjectOwnerForApi(projectId, user.id);

    const formData = await request.formData();
    const url = formData.get("url") as string | null;
    const note = formData.get("note") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const visualElement = await prisma.visualElement.create({
      data: {
        projectId,
        sceneId,
        userId: user.id,
        url: url.trim(),
        note: note?.trim() || null,
        tags: tags?.trim() || null,
      },
    });

    return NextResponse.json(visualElement, { status: 201 });
  } catch (error) {
    console.error("Error creating visual element:", error);
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create visual element" },
      { status: 500 }
    );
  }
}
