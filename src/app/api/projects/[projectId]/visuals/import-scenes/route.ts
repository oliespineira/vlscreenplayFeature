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
    const { scriptId } = body;

    if (!scriptId || typeof scriptId !== "string") {
      return NextResponse.json(
        { error: "scriptId is required" },
        { status: 400 }
      );
    }

    // Verify script belongs to project
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (script.project.ownerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (script.projectId !== projectId) {
      return NextResponse.json(
        { error: "Script does not belong to this project" },
        { status: 400 }
      );
    }

    // Get all breakdowns for this script
    const breakdowns = await prisma.sceneBreakdown.findMany({
      where: {
        projectId,
        scriptId,
      },
      orderBy: {
        sceneIndex: "asc",
      },
    });

    if (breakdowns.length === 0) {
      return NextResponse.json(
        { error: "No breakdowns found for this script. Generate breakdown first." },
        { status: 400 }
      );
    }

    // Get max sequenceIndex
    const maxScene = await prisma.scene.findFirst({
      where: { projectId },
      orderBy: { sequenceIndex: "desc" },
      select: { sequenceIndex: true },
    });

    let nextSequenceIndex = (maxScene?.sequenceIndex ?? -1) + 1;

    // Create scenes from breakdowns
    const createdScenes = await prisma.$transaction(
      breakdowns.map((breakdown) => {
        // Use logline as title if available, otherwise use slugline
        const title = breakdown.logline
          ? breakdown.logline.length > 200
            ? breakdown.logline.substring(0, 197) + "..."
            : breakdown.logline
          : breakdown.slugline.length > 200
            ? breakdown.slugline.substring(0, 197) + "..."
            : breakdown.slugline;

        // Build description from breakdown data
        const descriptionParts: string[] = [];
        if (breakdown.logline && breakdown.logline !== title) {
          descriptionParts.push(breakdown.logline);
        }
        if (breakdown.characters && Array.isArray(breakdown.characters)) {
          const charNames = breakdown.characters
            .map((c: any) => c.name)
            .filter(Boolean);
          if (charNames.length > 0) {
            descriptionParts.push(`Characters: ${charNames.join(", ")}`);
          }
        }
        if (breakdown.locations && Array.isArray(breakdown.locations)) {
          const locNames = breakdown.locations
            .map((l: any) => l.name)
            .filter(Boolean);
          if (locNames.length > 0) {
            descriptionParts.push(`Locations: ${locNames.join(", ")}`);
          }
        }
        if (breakdown.notes) {
          descriptionParts.push(breakdown.notes);
        }
        const description = descriptionParts.join("\n\n");

        // Build tags from breakdown data
        const tags: string[] = [];
        if (breakdown.props && Array.isArray(breakdown.props)) {
          breakdown.props.forEach((p: any) => {
            if (p.name) tags.push(p.name);
          });
        }
        if (breakdown.locations && Array.isArray(breakdown.locations)) {
          breakdown.locations.forEach((l: any) => {
            if (l.name) tags.push(l.name);
          });
        }

        const scene = prisma.scene.create({
          data: {
            projectId,
            title,
            description,
            tone: "", // Could extract from breakdown if needed
            tags: tags.slice(0, 10), // Limit tags
            status: "in_progress",
            sequenceIndex: nextSequenceIndex++,
          },
        });

        return scene;
      })
    );

    return NextResponse.json({
      ok: true,
      created: createdScenes.length,
      scenes: createdScenes,
    });
  } catch (error) {
    console.error("Error importing scenes:", error);
    if (error instanceof Error && (error.message === "Project not found" || error.message === "Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to import scenes" },
      { status: 500 }
    );
  }
}
