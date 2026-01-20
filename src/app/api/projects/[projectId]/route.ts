import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";

type RouteParams = {
  params: Promise<{ projectId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;

    await requireProjectOwnerForApi(projectId, user.id);

    const body = await request.json();
    const titleRaw = typeof body.title === "string" ? body.title : "";
    const title = titleRaw.trim();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title is too long" },
        { status: 400 },
      );
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { title },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project title:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

