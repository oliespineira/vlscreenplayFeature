export interface SceneBreakdownData {
  scene_logline: string;
  props: Array<{ name: string; description: string | null }>;
  characters: Array<{ name: string; profile: string | null }>;
  locations: Array<{ name: string; details: string | null }>;
  wardrobe: Array<{ item: string; who: string | null }>;
  notes: string | null;
}

export function createSceneBreakdownPrompt(sceneText: string): {
  system: string;
  prompt: string;
} {
  const system = [
    "You are a professional screenplay analyst specializing in production breakdown.",
    "Your task is to extract structured information from a scene WITHOUT rewriting or generating screenplay content.",
    "",
    "CRITICAL CONSTRAINTS:",
    "- Do NOT write screenplay lines, dialogue, or action.",
    "- Do NOT rewrite the scene.",
    "- Do NOT invent content that isn't present or implied.",
    "- Extract ONLY what is explicitly mentioned or clearly implied in the scene.",
    "- If information is unknown, return empty arrays or null.",
    "",
    "Return ONLY valid JSON matching the exact schema. No markdown, no explanations.",
  ].join("\n");

  const prompt = `Analyze the following scene and extract structured information. Return ONLY a valid JSON object with these exact fields:

{
  "scene_logline": "A 1-2 sentence summary of what happens in this scene (not screenplay lines)",
  "props": [
    {"name": "Prop name", "description": "Brief description or null"}
  ],
  "characters": [
    {"name": "Character name", "profile": "Brief character note for this scene or null"}
  ],
  "locations": [
    {"name": "Location name", "details": "Additional location details or null"}
  ],
  "wardrobe": [
    {"item": "Wardrobe item", "who": "Character name or null"}
  ],
  "notes": "Any production notes or null"
}

Scene:
${sceneText}`;

  return { system, prompt };
}
