export function lookbookPrompt(input: {
  logline?: string | null;
  themes: string[];
  toneKeywords: string[];
  locations: string[];
  keyScenes: { id: string; summary: string }[];
  knobs?: { stylized?: number; movement?: number; contrast?: number };
}) {
  return `
You are DION’s Visual Development Agent.
Your task is to create a cohesive, indie-feasible lookbook proposal.

INPUT:
- Logline: ${input.logline ?? ""}
- Themes: ${JSON.stringify(input.themes)}
- Tone keywords: ${JSON.stringify(input.toneKeywords)}
- Key locations: ${JSON.stringify(input.locations)}
- Key scenes (summaries): ${JSON.stringify(input.keyScenes)}
- Control knobs (0..1): ${JSON.stringify(input.knobs ?? {})}

OUTPUT RULES:
- Return valid JSON only
- No markdown
- No commentary
- No extra keys

JSON SCHEMA:
{
  "genre_tags": [],
  "tone_keywords": [],
  "time_period": "string|null",
  "lens_language": "string",
  "camera_movement_rules": [],
  "lighting_motifs": [],
  "palette": [{"name":"string","description":"string"}],
  "composition_rules": [],
  "references_seed": [{"type":"film|photo|painting|other","title":"string","why":"string"}]
}
`.trim();
}

export function visualBiblePrompt(input: {
  lookbookJson: unknown;
  inspirationsJson: unknown;
}) {
  return `
Create a Visual Bible that enforces visual cohesion across all scenes.

INPUT:
- LookbookDraft JSON: ${JSON.stringify(input.lookbookJson)}
- InspirationBoard JSON: ${JSON.stringify(input.inspirationsJson)}

OUTPUT RULES:
- Return valid JSON only
- No markdown
- No commentary
- No extra keys

JSON SCHEMA:
{
  "one_page_summary": "string",
  "do_list": [],
  "dont_list": [],
  "style_rules": {
    "lens": "string",
    "lighting": "string",
    "color": "string",
    "blocking": "string",
    "production_design": "string"
  },
  "shot_design_principles": [],
  "scene_overrides": [
    {
      "scene_id":"string",
      "override_reason":"string",
      "changes":{"lighting":"...","lens":"...","color":"..."}
    }
  ],
  "rule_sources": { "rule_key": [0,1,2] }
}
`.trim();
}

export function storyboardPrompt(input: {
  bibleJson: unknown;
  scene: { id: string; summary: string; emotion?: string; beats?: string[] };
  cohesionLock: boolean;
  framesPerScene: number;
}) {
  return `
Generate a storyboard prompt pack for visual preproduction.

CONSTRAINTS:
- Filmable, coherent frames only
- No dialogue or screenplay text
- If cohesion_lock is true, prompts must comply with the Visual Bible

INPUT:
- cohesion_lock: ${input.cohesionLock}
- frames_per_scene: ${input.framesPerScene}
- VisualBible JSON: ${JSON.stringify(input.bibleJson)}
- Scene summary: ${JSON.stringify(input.scene)}

OUTPUT RULES:
- Return valid JSON only
- No markdown
- No commentary
- No extra keys

JSON SCHEMA:
{
  "scene_id": "string",
  "continuity_header": "string",
  "beats": [
    {
      "frame": 1,
      "shot_size": "WS|MS|CU|ECU|OTS|POV",
      "angle": "eye|high|low|dutch|top",
      "movement": "static|pan|tilt|dolly|handheld|crane",
      "blocking": "string",
      "lighting": "string",
      "art_direction": "string",
      "palette_callout": "string",
      "prompt": "string",
      "negative_prompt": "string"
    }
  ]
}
`.trim();
}

