import { z } from "zod";

export const LookbookDraftSchema = z.object({
  genre_tags: z.array(z.string()).default([]),
  tone_keywords: z.array(z.string()).default([]),
  time_period: z.string().optional().nullable(),
  lens_language: z.string(),
  camera_movement_rules: z.array(z.string()).default([]),
  lighting_motifs: z.array(z.string()).default([]),
  palette: z
    .array(z.object({ name: z.string(), description: z.string() }))
    .min(3)
    .max(10),
  composition_rules: z.array(z.string()).default([]),
  references_seed: z.array(
    z.object({
      type: z.enum(["film", "photo", "painting", "other"]),
      title: z.string(),
      why: z.string(),
    })
  ),
});

export const VisualBibleSchema = z.object({
  one_page_summary: z.string(),
  do_list: z.array(z.string()).default([]),
  dont_list: z.array(z.string()).default([]),
  style_rules: z.object({
    lens: z.string(),
    lighting: z.string(),
    color: z.string(),
    blocking: z.string(),
    production_design: z.string(),
  }),
  shot_design_principles: z.array(z.string()).default([]),
  scene_overrides: z
    .array(
      z.object({
        scene_id: z.string(),
        override_reason: z.string(),
        changes: z.record(z.string(), z.string()),
      })
    )
    .default([]),
  rule_sources: z.record(z.string(), z.array(z.number())).optional(),
});

export const StoryboardPromptSetSchema = z.object({
  scene_id: z.string(),
  continuity_header: z.string(),
  beats: z
    .array(
      z.object({
        frame: z.number().int().min(1),
        shot_size: z.enum(["WS", "MS", "CU", "ECU", "OTS", "POV"]),
        angle: z.enum(["eye", "high", "low", "dutch", "top"]),
        movement: z.enum(["static", "pan", "tilt", "dolly", "handheld", "crane"]),
        blocking: z.string(),
        lighting: z.string(),
        art_direction: z.string(),
        palette_callout: z.string(),
        prompt: z.string(),
        negative_prompt: z.string().optional().default(""),
      })
    )
    .min(4)
    .max(16),
});

