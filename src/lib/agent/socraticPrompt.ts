import type { CursorContext } from "@/lib/scripts/editorContext";

export type WriterProfile = {
  tone: string;
  focus: string;
  avoidTheme: boolean;
  avoidSymbolism: boolean;
  notes: string;
};

export function buildSocraticMessages(input: {
  mode: "selection" | "scene" | "stuck" | "profile";
  selectionText?: string;
  sceneText: string;
  sceneSlugline?: string;
  scriptTitle?: string;
  userMessage?: string;
  cursorContext?: CursorContext;
  writerProfile?: WriterProfile;
  conversation?: Array<{ role: "user" | "assistant"; content: string }>;
  style?: "socratic" | "director";
}): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const style = input.style || "director";
  const context = input.cursorContext;
  const elementType = context?.elementType;
  const activeCharacter = context?.activeCharacter;
  const scenePosition = context?.scenePosition;

  // Build context-specific guidance
  let elementGuidance = "";
  if (elementType === "dialogue") {
    elementGuidance = `Focus on: subtext, power shifts, what each character wants in this exchange, voice consistency, emotional escalation, what's being said vs what's meant.`;
    if (activeCharacter) {
      elementGuidance += ` The active character is ${activeCharacter}.`;
    }
  } else if (elementType === "character") {
    elementGuidance = `Focus on: motivation, character choice, contradictions, what the character wants entering this beat, why this character at this moment.`;
  } else if (elementType === "action") {
    elementGuidance = `Focus on: visual clarity, causality, pacing, escalation, reversals, what the audience sees and feels.`;
  } else if (elementType === "scene") {
    elementGuidance = `Focus on: why this location/time, what changes in this scene, tone promise, setup/payoff, scene function.`;
  } else if (elementType === "transition") {
    elementGuidance = `Focus on: momentum, whether the cut is motivated, what the audience should feel next, pacing.`;
  } else if (elementType === "parenthetical") {
    elementGuidance = `Focus on: playable intent, whether it adds subtext or explains too much, if it's necessary.`;
  }

  let positionGuidance = "";
  if (scenePosition === "early") {
    positionGuidance = `This is early in the scene. Ask about setup, intent, stakes, orientation, what's being established.`;
  } else if (scenePosition === "middle") {
    positionGuidance = `This is in the middle of the scene. Ask about escalation, tactic shifts, rising tension.`;
  } else if (scenePosition === "late") {
    positionGuidance = `This is late in the scene. Ask about the turn, consequences, hook into next scene, what changes.`;
  }

  const profile = input.writerProfile;
  const conversation = input.conversation || [];
  const hasRecentConversation = conversation.length > 0;

  // Determine question count based on conversation state
  const questionCount = hasRecentConversation ? "2-4" : "5-7";

  // Build tone-specific guidance
  let toneGuidance = "";
  if (profile?.tone === "gentle") {
    toneGuidance =
      "Use warmer, more curious phrasing. Be less confrontational. Frame questions as invitations to explore, not challenges.";
  } else if (profile?.tone === "rigorous") {
    toneGuidance =
      "Use more direct, diagnostic questions. Still be respectful, but cut to the core issues. Be precise and specific.";
  }

  // Build focus-specific guidance
  let focusGuidance = "";
  if (profile?.focus === "character") {
    focusGuidance = "Prioritize character lenses: motivations, relationships, voice, wants/needs.";
  } else if (profile?.focus === "pacing") {
    focusGuidance = "Prioritize pacing lenses: rhythm, tension, flow, escalation.";
  } else if (profile?.focus === "dialogue") {
    focusGuidance = "Prioritize dialogue lenses: subtext, voice, power dynamics, what's unsaid.";
  } else if (profile?.focus === "theme") {
    focusGuidance = "Prioritize theme lenses: deeper meaning, what the story is really about.";
  }

  // Build avoid flags guidance
  let avoidGuidance = "";
  if (profile?.avoidTheme) {
    avoidGuidance += "Do NOT ask about theme or deeper meaning. Focus on craft, character, and story mechanics.\n";
  }
  if (profile?.avoidSymbolism) {
    avoidGuidance +=
      "Prefer 'meaning to the character' over 'symbolize' or symbolic interpretation. Focus on concrete story elements.\n";
  }

  // Build notes context
  let notesContext = "";
  if (profile?.notes && profile.notes.trim().length > 0) {
    notesContext = `\n\nWhat the writer has told you they care about:\n${profile.notes.slice(-500)}\n`;
  }

  let systemPrompt = "";

  if (style === "socratic") {
    // Socratic mode: questions-only
    systemPrompt = `You are a Socratic writing coach. Your ONLY job is to ask thoughtful questions that help the writer discover their own answers.

CRITICAL RULES:
- Output ONLY questions. Never give advice, solutions, or suggestions.
- Every line must be a question ending with '?'.
- Ask ${questionCount} questions maximum.${hasRecentConversation ? " The writer just responded, so ask fewer follow-up questions that build on their answer." : ""}
- Do NOT rewrite their text. Do NOT suggest changes. Do NOT say "you should" or "try to".
- Start by clarifying the author's intent if anything is unclear.
${elementGuidance ? `- Current element type: ${elementType}. ${elementGuidance}\n` : ""}${positionGuidance ? `- Scene position: ${positionGuidance}\n` : ""}${toneGuidance ? `- Tone: ${toneGuidance}\n` : ""}${focusGuidance ? `- Focus: ${focusGuidance}\n` : ""}${avoidGuidance ? `- Avoid: ${avoidGuidance}` : ""}- Focus your questions on these lenses:
  * Character: motivations, relationships, voice
  * Pacing: rhythm, tension, flow
  * Stakes: what's at risk, consequences
  * Scene turning point: what changes in this moment
  * Subtext: what's beneath the surface
  * Structure: how this fits the larger narrative${profile?.focus === "balanced" ? "" : ` (but prioritize ${profile?.focus} as noted above)`}

Your questions should be neutral, curious, and help the writer think deeper about their work.${activeCharacter ? ` When relevant, reference ${activeCharacter} by name, but do not assume facts about them.` : ""}${notesContext}`;
  } else {
    // Director mode: observations + hypotheses + questions
    systemPrompt = `You are a writing coach in "Director Mode." You provide grounded observations, tentative interpretations, and thoughtful questions.

CRITICAL RULES - NEVER VIOLATE:
- NEVER write screenplay lines (no dialogue, no action lines, no character cues).
- NEVER provide examples of lines, even if asked. If asked to rewrite or generate lines, politely refuse and pivot to reflective observations and questions.
- NEVER prescribe changes ("you should", "try to", "add", "remove", "rewrite", imperatives).
- NEVER quote lines as examples (no quotation marks around proposed lines).

OUTPUT STRUCTURE (follow this exactly):
1. "What I'm seeing:" (2-4 sentences)
   - Only refer to details present in the provided scene/selection text.
   - Use observational language: "I'm seeing", "It reads like", "It seems", "There's a sense", "This moment", "The scene".
   - No invented events, no new lines, no rewrites.

2. "What it might be doing:" (1-2 sentences)
   - Frame as hypotheses using "might/could/reads like", never as facts about author intent.
   - Tentative language only.

3. "Questions:" (3-6 questions)
   - Context-aware (dialogue/action/scene heading etc. if cursorContext is provided).
   - No leading suggestions like "Have you considered..."
   - Avoid prescriptions.

4. Optional closing: A single question like "Does that match what you're aiming for?"

${elementGuidance ? `- Current element type: ${elementType}. ${elementGuidance}\n` : ""}${positionGuidance ? `- Scene position: ${positionGuidance}\n` : ""}${toneGuidance ? `- Tone: ${toneGuidance}\n` : ""}${focusGuidance ? `- Focus: ${focusGuidance}\n` : ""}${avoidGuidance ? `- Avoid: ${avoidGuidance}` : ""}${activeCharacter ? `- Active character: ${activeCharacter}\n` : ""}${notesContext}`;
  }

  let userPrompt = "";

  if (input.mode === "selection") {
    userPrompt = `The writer has selected this text from their screenplay "${input.scriptTitle || "Untitled"}":\n\n${input.selectionText}\n\n`;
    if (elementType) {
      userPrompt += `The selection is from a ${elementType} element.\n\n`;
    }
    if (input.sceneText) {
      userPrompt += `Context from the current scene:\n\n${input.sceneText}\n\n`;
    }
    if (activeCharacter) {
      userPrompt += `The active character in this context is ${activeCharacter}.\n\n`;
    }
    userPrompt += "Ask questions about this selection to help them explore it deeper.";
  } else if (input.mode === "scene") {
    userPrompt = `The writer is working on this scene from "${input.scriptTitle || "Untitled"}":\n\n`;
    if (input.sceneSlugline) {
      userPrompt += `Scene: ${input.sceneSlugline}\n\n`;
    }
    userPrompt += `${input.sceneText}\n\n`;
    if (elementType && elementType !== "scene" && elementType !== "action") {
      userPrompt += `The cursor is currently in a ${elementType} element.\n\n`;
    }
    if (activeCharacter) {
      userPrompt += `The active character in this context is ${activeCharacter}.\n\n`;
    }
    userPrompt += "Ask questions about this scene to help them explore it deeper.";
  } else if (input.mode === "profile") {
    // Personalization mode
    userPrompt = `The writer wants to personalize their coaching experience. `;
    if (input.userMessage) {
      userPrompt += `They said: "${input.userMessage}"\n\n`;
    }
    userPrompt += `Ask them questions about their writing style, what kind of feedback helps them, and how they prefer to be coached. `;
    userPrompt += `These are meta-questions about the coaching relationship itself. `;
    userPrompt += `Still output ONLY questions. Help them discover what kind of questions and tone work best for them.`;
  } else {
    // stuck mode
    userPrompt = `The writer is feeling stuck. They're working on this scene:\n\n`;
    if (input.sceneSlugline) {
      userPrompt += `Scene: ${input.sceneSlugline}\n\n`;
    }
    userPrompt += `${input.sceneText}\n\n`;
    if (elementType) {
      userPrompt += `They're currently working on a ${elementType} element.\n\n`;
    }
    userPrompt += "Ask questions to help them discover what they need to move forward.";
  }

  if (input.userMessage) {
    const lowerUserMessage = input.userMessage.toLowerCase();
    const isRewriteRequest =
      lowerUserMessage.includes("rewrite") ||
      lowerUserMessage.includes("give me a line") ||
      lowerUserMessage.includes("write a line") ||
      lowerUserMessage.includes("show me") ||
      lowerUserMessage.includes("example");

    if (style === "director" && isRewriteRequest) {
      userPrompt += `\n\nIMPORTANT: The writer asked for a rewrite or example line. Do NOT write any screenplay lines. Instead, acknowledge you won't write lines, then provide only reflective observations and questions.`;
    } else {
      userPrompt += `\n\nWriter's additional question or note: ${input.userMessage}`;
    }
  }

  // Build messages array with conversation history
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history (recent messages)
  if (conversation.length > 0) {
    for (const msg of conversation) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
  }

  // Add current user prompt
  messages.push({ role: "user", content: userPrompt });

  return messages;
}
