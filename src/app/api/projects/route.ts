import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureUser } from "@/lib/auth/ensureUser";

export async function GET() {
  const user = await ensureUser();

  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const user = await ensureUser();

  const body = await request.json();
  const title = body.title || "Untitled Project";

  const project = await prisma.project.create({
    data: {
      title,
      ownerId: user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
