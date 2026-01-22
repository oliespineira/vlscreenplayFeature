import { NextResponse } from "next/server";
import { requireProjectOwner } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import { splitScenes } from "@/lib/screenplay/splitScenes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await requireProjectOwner(projectId);

    const url = new URL(request.url);
    const scriptId = url.searchParams.get("scriptId");

    if (!scriptId) {
      return NextResponse.json(
        { error: "scriptId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify script belongs to project
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      include: { project: { select: { id: true } } },
    });

    if (!script || script.projectId !== projectId) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Get existing breakdowns
    const breakdowns = await prisma.sceneBreakdown.findMany({
      where: {
        projectId,
        scriptId,
      },
      orderBy: {
        sceneIndex: "asc",
      },
    });

    // Split script into scenes (for scenes without breakdowns)
    const allScenes = splitScenes(script.fountain);

    // Merge breakdowns with scene data
    const scenes = allScenes.map((scene) => {
      const breakdown = breakdowns.find(
        (b) => b.sceneIndex === scene.index
      );

      return {
        index: scene.index,
        slugline: scene.slugline,
        sceneText: scene.text,
        breakdown: breakdown
          ? {
              id: breakdown.id,
              logline: breakdown.logline,
              props: breakdown.props,
              characters: breakdown.characters,
              locations: breakdown.locations,
              wardrobe: breakdown.wardrobe,
              notes: breakdown.notes,
              updatedAt: breakdown.updatedAt,
            }
          : null,
      };
    });

    // Get run status
    const run = await prisma.visualisationRun.findUnique({
      where: {
        projectId_scriptId: {
          projectId,
          scriptId,
        },
      },
    });

    return NextResponse.json({
      scriptId,
      scriptTitle: script.title,
      status: run?.status || "idle",
      scenes,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
