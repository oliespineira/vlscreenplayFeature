import { z } from "zod";

export const ScriptAnalysisCharacterSchema = z.object({
  name: z.string(),
  description: z.string(),
  role: z.string().optional().nullable(),
});

export const ScriptAnalysisLookSchema = z.object({
  aesthetic: z.string(),
  color_palette: z.array(z.string()).default([]),
  visual_references: z.array(z.string()).default([]),
});

export const ScriptAnalysisSceneCharacterSchema = z.object({
  name: z.string(),
  role: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const ScriptAnalysisSceneSchema = z.object({
  title: z.string(),
  description: z.string(),
  tone: z.string(),
  sequence_index: z.number().int(),
  tags: z.array(z.string()).default([]),
  characters: z.array(ScriptAnalysisSceneCharacterSchema).default([]),
});

export const ScriptAnalysisSchema = z.object({
  main_theme: z.string(),
  characters: z.array(ScriptAnalysisCharacterSchema).default([]),
  tone: z.string(),
  logline: z.string(),
  theme_analysis: z.string(),
  look: ScriptAnalysisLookSchema.optional().nullable(),
  scenes: z.array(ScriptAnalysisSceneSchema).default([]),
  scenes_created: z.number().int().optional().nullable(),
  scene_creation_error: z.string().optional().nullable(),
});

export type ScriptAnalysis = z.infer<typeof ScriptAnalysisSchema>;

