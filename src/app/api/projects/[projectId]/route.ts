import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { ScriptAnalysisSchema } from "@/lib/domain/scriptAnalysis";

type RouteParams = {
  params: Promise<{ projectId: string }>;
};

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 50_000;
const MAX_SCRIPT_TEXT_LENGTH = 5_000_000; // characters

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;

    await requireProjectOwnerForApi(projectId, user.id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        scriptText: true,
        scriptAnalysis: true,
        headerImageUrl: true,
        creative: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;

    await requireProjectOwnerForApi(projectId, user.id);

    const body = await request.json();
    const titleRaw = typeof body.title === "string" ? body.title : undefined;
    const descriptionRaw =
      typeof body.description === "string" ? body.description : undefined;
    const scriptTextRaw =
      typeof body.scriptText === "string" ? body.scriptText : undefined;
    const headerImageUrlRaw =
      typeof body.headerImageUrl === "string" ? body.headerImageUrl : undefined;
    const creativeRaw =
      typeof body.creative === "string" ? body.creative : undefined;

    const hasScriptAnalysis = Object.prototype.hasOwnProperty.call(
      body,
      "scriptAnalysis",
    );
    const scriptAnalysisRaw = hasScriptAnalysis ? body.scriptAnalysis : undefined;

    if (
      titleRaw === undefined &&
      descriptionRaw === undefined &&
      scriptTextRaw === undefined &&
      headerImageUrlRaw === undefined &&
      creativeRaw === undefined &&
      !hasScriptAnalysis
    ) {
      return NextResponse.json(
        { error: "No fields provided" },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};

    if (titleRaw !== undefined) {
      const title = titleRaw.trim();
      if (!title) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 },
        );
      }

      if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json(
          { error: "Title is too long" },
          { status: 400 },
        );
      }

      data.title = title;
    }

    if (descriptionRaw !== undefined) {
      const description = descriptionRaw.trim();
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        return NextResponse.json(
          { error: "Description is too long" },
          { status: 400 },
        );
      }
      data.description = description;
    }

    if (scriptTextRaw !== undefined) {
      const scriptText = scriptTextRaw;
      if (scriptText.length > MAX_SCRIPT_TEXT_LENGTH) {
        return NextResponse.json(
          { error: "Script text is too long" },
          { status: 400 },
        );
      }
      data.scriptText = scriptText;
    }

    if (headerImageUrlRaw !== undefined) {
      data.headerImageUrl = headerImageUrlRaw || null;
    }

    if (creativeRaw !== undefined) {
      const creative = creativeRaw.trim();
      if (creative.length > 200) {
        return NextResponse.json(
          { error: "Creative name is too long" },
          { status: 400 },
        );
      }
      data.creative = creative || null;
    }

    if (hasScriptAnalysis) {
      if (scriptAnalysisRaw === null) {
        data.scriptAnalysis = null;
      } else {
        try {
          data.scriptAnalysis = ScriptAnalysisSchema.parse(scriptAnalysisRaw);
        } catch (e) {
          return NextResponse.json(
            { error: "Invalid scriptAnalysis payload" },
            { status: 400 },
          );
        }
      }
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data,
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

