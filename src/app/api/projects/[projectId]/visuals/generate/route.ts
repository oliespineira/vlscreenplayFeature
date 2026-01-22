import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import { splitScenes } from "@/lib/screenplay/splitScenes";
import { generateSceneBreakdown } from "@/lib/visuals/generateSceneBreakdown";

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

    // Verify script belongs to project and user
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

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Create or update VisualisationRun
    const run = await prisma.visualisationRun.upsert({
      where: {
        projectId_scriptId: {
          projectId,
          scriptId,
        },
      },
      create: {
        projectId,
        scriptId,
        status: "running",
      },
      update: {
        status: "running",
        updatedAt: new Date(),
      },
    });

    try {
      // Split script into scenes
      const scenes = splitScenes(script.fountain);

      if (scenes.length === 0) {
        await prisma.visualisationRun.update({
          where: { id: run.id },
          data: { status: "error" },
        });
        return NextResponse.json(
          { error: "No scenes found in script" },
          { status: 400 }
        );
      }

      // Process scenes sequentially (safe for serverless)
      for (const scene of scenes) {
        try {
          // Generate breakdown
          const breakdown = await generateSceneBreakdown(scene.text);

          // Upsert SceneBreakdown
          await prisma.sceneBreakdown.upsert({
            where: {
              projectId_scriptId_sceneIndex: {
                projectId,
                scriptId,
                sceneIndex: scene.index,
              },
            },
            create: {
              projectId,
              scriptId,
              sceneIndex: scene.index,
              slugline: scene.slugline,
              sceneText: scene.text,
              logline: breakdown.scene_logline || null,
              props: breakdown.props || null,
              characters: breakdown.characters || null,
              locations: breakdown.locations || null,
              wardrobe: breakdown.wardrobe || null,
              notes: breakdown.notes || null,
            },
            update: {
              slugline: scene.slugline,
              sceneText: scene.text,
              logline: breakdown.scene_logline || null,
              props: breakdown.props || null,
              characters: breakdown.characters || null,
              locations: breakdown.locations || null,
              wardrobe: breakdown.wardrobe || null,
              notes: breakdown.notes || null,
            },
          });
        } catch (error) {
          console.error(`Error processing scene ${scene.index}:`, error);
          // Continue with other scenes even if one fails
        }
      }

      // Update run status to done
      await prisma.visualisationRun.update({
        where: { id: run.id },
        data: { status: "done" },
      });

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("Error generating breakdown:", error);
      await prisma.visualisationRun.update({
        where: { id: run.id },
        data: { status: "error" },
      });
      return NextResponse.json(
        { error: "Failed to generate breakdown" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof Error) {
      if (error.message === "Project not found" || error.message === "Access denied") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
