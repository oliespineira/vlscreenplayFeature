import { jsonFromLLM } from "@/lib/ai/openai";
import { createSceneBreakdownPrompt, type SceneBreakdownData } from "./sceneBreakdownPrompt";

/**
 * Generates a scene breakdown using OpenAI.
 * Returns structured data about logline, props, characters, locations, wardrobe, and notes.
 */
export async function generateSceneBreakdown(
  sceneText: string
): Promise<SceneBreakdownData> {
  const { system, prompt } = createSceneBreakdownPrompt(sceneText);

  const breakdown = await jsonFromLLM<SceneBreakdownData>({
    system,
    prompt,
    schemaName: "SceneBreakdown",
    validate: (obj): SceneBreakdownData => {
      if (typeof obj !== "object" || obj === null) {
        throw new Error("Invalid breakdown: not an object");
      }

      const data = obj as Record<string, unknown>;

      // Validate required fields
      if (typeof data.scene_logline !== "string") {
        throw new Error("Invalid breakdown: scene_logline must be a string");
      }

      // Validate arrays
      if (!Array.isArray(data.props)) {
        throw new Error("Invalid breakdown: props must be an array");
      }
      if (!Array.isArray(data.characters)) {
        throw new Error("Invalid breakdown: characters must be an array");
      }
      if (!Array.isArray(data.locations)) {
        throw new Error("Invalid breakdown: locations must be an array");
      }
      if (!Array.isArray(data.wardrobe)) {
        throw new Error("Invalid breakdown: wardrobe must be an array");
      }

      // Validate props structure
      for (const prop of data.props) {
        if (typeof prop !== "object" || prop === null) {
          throw new Error("Invalid breakdown: prop must be an object");
        }
        if (typeof (prop as any).name !== "string") {
          throw new Error("Invalid breakdown: prop.name must be a string");
        }
      }

      // Validate characters structure
      for (const char of data.characters) {
        if (typeof char !== "object" || char === null) {
          throw new Error("Invalid breakdown: character must be an object");
        }
        if (typeof (char as any).name !== "string") {
          throw new Error("Invalid breakdown: character.name must be a string");
        }
      }

      // Validate locations structure
      for (const loc of data.locations) {
        if (typeof loc !== "object" || loc === null) {
          throw new Error("Invalid breakdown: location must be an object");
        }
        if (typeof (loc as any).name !== "string") {
          throw new Error("Invalid breakdown: location.name must be a string");
        }
      }

      // Validate wardrobe structure
      for (const item of data.wardrobe) {
        if (typeof item !== "object" || item === null) {
          throw new Error("Invalid breakdown: wardrobe item must be an object");
        }
        if (typeof (item as any).item !== "string") {
          throw new Error("Invalid breakdown: wardrobe.item must be a string");
        }
      }

      // Validate notes (can be null or string)
      if (data.notes !== null && typeof data.notes !== "string") {
        throw new Error("Invalid breakdown: notes must be null or a string");
      }

      return {
        scene_logline: data.scene_logline,
        props: data.props as Array<{ name: string; description: string | null }>,
        characters: data.characters as Array<{ name: string; profile: string | null }>,
        locations: data.locations as Array<{ name: string; details: string | null }>,
        wardrobe: data.wardrobe as Array<{ item: string; who: string | null }>,
        notes: data.notes === null ? null : String(data.notes),
      };
    },
  });

  return breakdown;
}
