import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/requireUser";
import { assertProjectOwnerOrThrow } from "@/lib/auth/ownership";
import { jsonFromLLM } from "@/lib/ai/openai";
import { LookbookDraftSchema } from "@/lib/domain/visual/schemas";
import { lookbookPrompt } from "@/lib/domain/visual/prompts";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();

    const projectId: string = body.projectId;
    if (!projectId) {
      return NextResponse.json({ error: "MISSING_PROJECT_ID" }, { status: 400 });
    }

    await assertProjectOwnerOrThrow({ projectId, userId });

    // MVP: accept inputs from client until wired to your Script Helper outputs
    const logline: string | null = body.logline ?? null;
    const themes: string[] = body.themes ?? [];
    const toneKeywords: string[] = body.toneKeywords ?? [];
    const locations: string[] = body.locations ?? [];
    const keyScenes: { id: string; summary: string }[] = body.keyScenes ?? [];
    const knobs = body.knobs ?? {};

    const prompt = lookbookPrompt({
      logline,
      themes,
      toneKeywords,
      locations,
      keyScenes,
      knobs,
    });

    const parsed = await jsonFromLLM({
      system:
        "You are DION’s Visual Development Agent. Output strict JSON only. Be cohesive and indie-feasible.",
      prompt,
      schemaName: "LookbookDraft",
      validate: (obj) => LookbookDraftSchema.parse(obj),
    });

    const created = await prisma.lookbookDraft.create({
      data: {
        projectId,
        scriptId: body.scriptId ?? null,
        logline,
        genreTags: parsed.genre_tags,
        timePeriod: parsed.time_period ?? null,
        toneKeywords: parsed.tone_keywords,
        lensLanguage: parsed.lens_language,
        lightingMotifs: parsed.lighting_motifs,
        palette: parsed.palette,
        compositionRules: parsed.composition_rules,
        cameraMovementRules: parsed.camera_movement_rules,
        referencesSeed: parsed.references_seed,
        knobs,
        source: { themes, toneKeywords, locations, keyScenes },
      },
    });

    return NextResponse.json({ lookbook: created });
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    const status =
      msg === "UNAUTHENTICATED"
        ? 401
        : msg === "FORBIDDEN_OR_NOT_FOUND"
        ? 403
        : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}

