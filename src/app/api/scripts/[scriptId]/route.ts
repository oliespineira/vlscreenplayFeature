import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireScriptOwner } from "@/lib/auth/ownership";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  const script = await requireScriptOwner(scriptId);

  return NextResponse.json({
    id: script.id,
    title: script.title,
    fountain: script.fountain,
    updatedAt: script.updatedAt,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  await requireScriptOwner(scriptId);

  const body = await request.json();
  const { fountain, title } = body;

  const updateData: { fountain?: string; title?: string } = {};
  if (fountain !== undefined) updateData.fountain = fountain;
  if (title !== undefined) updateData.title = title;

  const script = await prisma.script.update({
    where: { id: scriptId },
    data: updateData,
    select: {
      id: true,
      title: true,
      fountain: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(script);
}
