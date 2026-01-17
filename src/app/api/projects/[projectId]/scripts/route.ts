import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireProjectOwner } from "@/lib/auth/ownership";

const DEFAULT_FOUNTAIN = "Title: Untitled Script\n\nINT. ROOM - DAY\n\nA blank page.\n";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await requireProjectOwner(projectId);

  const scripts = await prisma.script.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(scripts);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await requireProjectOwner(projectId);

  const body = await request.json();
  const title = body.title || "Untitled Script";

  const script = await prisma.script.create({
    data: {
      title,
      projectId,
      fountain: DEFAULT_FOUNTAIN,
    },
  });

  return NextResponse.json(script, { status: 201 });
}
