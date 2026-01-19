import { NextResponse } from "next/server";
import { requireScriptOwnerForApi } from "@/lib/auth/ownership";
import { ensureUser } from "@/lib/auth/ensureUser";
import { buildSocraticMessages, isReflectionFirstUserMessage } from "@/lib/agent/socraticPrompt";
import { assertQuestionsOnly, assertNonPrescriptiveNonGenerative } from "@/lib/agent/validators";
import {
  getOrCreateWriterProfile,
  getOrCreateThread,
  appendMessage,
  getRecentMessages,
} from "@/lib/agent/storage";
import { updateProfileFromUserText } from "@/lib/agent/profileUpdater";
import { prisma } from "@/lib/db/prisma";
import type { CursorContext } from "@/lib/scripts/editorContext";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const {
      scriptId,
      mode,
      intent,
      selectionText,
      sceneText,
      sceneSlugline,
      userMessage,
      cursorContext,
      elementType,
      style,
    } = body;

    if (!scriptId) {
      return NextResponse.json(
        { error: "scriptId is required" },
        { status: 400 }
      );
    }

    const responseStyle = style || "director";

    // Get current user first
    let user;
    try {
      user = await ensureUser();
    } catch (error) {
      console.error("Auth error in agent/ask:", error);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Enforce ownership (with proper error handling)
    let script;
    try {
      script = await requireScriptOwnerForApi(scriptId, user.id);
    } catch (error) {
      console.error("Script ownership error:", error);
      const errorMessage = error instanceof Error ? error.message : "Script not found or access denied";
      const statusCode = errorMessage.includes("Access denied") ? 403 : 404;
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    // Get or create writer profile
    let profile = await getOrCreateWriterProfile(user.id);

    // Get or create thread
    const thread = await getOrCreateThread(scriptId, user.id);

    // If userMessage exists, store it and update profile
    if (userMessage && userMessage.trim().length > 0) {
      await appendMessage(thread.id, "user", userMessage.trim());

      // Update profile based on user text
      const profileUpdates = updateProfileFromUserText(profile, userMessage.trim());
      if (Object.keys(profileUpdates).length > 0) {
        profile = await prisma.writerProfile.update({
          where: { id: profile.id },
          data: profileUpdates,
        });
      }
    }

    // Get recent conversation history
    const recentMessages = await getRecentMessages(thread.id, 12);
    const conversation = recentMessages.map((msg: Awaited<ReturnType<typeof getRecentMessages>>[number]) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Build messages with profile and conversation
    const messages = buildSocraticMessages({
      mode: mode || "scene",
      intent: intent as "discuss_scene" | "discuss_selection" | undefined,
      selectionText,
      sceneText,
      sceneSlugline,
      scriptTitle: script.title,
      userMessage: userMessage?.trim() || undefined,
      cursorContext: cursorContext as CursorContext | undefined,
      writerProfile: {
        tone: profile.tone,
        focus: profile.focus,
        avoidTheme: profile.avoidTheme,
        avoidSymbolism: profile.avoidSymbolism,
        notes: profile.notes,
      },
      conversation,
      style: responseStyle,
    });

    // Call OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    let assistantText = "";
    let attempts = 0;
    const maxAttempts = 3; // Increased to 3 to allow for reflection-first retry and discuss intent retry
    const isReflectionFirstExpected = responseStyle === "director" && isReflectionFirstUserMessage(userMessage?.trim());
    const isDiscussIntent = intent === "discuss_scene" || intent === "discuss_selection";

    // Helper to check if output starts with a question
    const startsWithQuestion = (text: string): boolean => {
      const trimmed = text.trim();
      const questionStarters = ["what", "how", "why", "do", "is", "are", "can", "should", "would", "could", "does", "did", "will"];
      const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase();
      return questionStarters.includes(firstWord || "") || trimmed.startsWith("?");
    };

    // Helper to check if output has a "Quick read" section or starts with non-question sentences
    const hasQuickReadSection = (text: string): boolean => {
      const lower = text.toLowerCase();
      // Check if it has "Quick read:" section
      if (lower.includes("quick read:")) {
        return true;
      }
      // Check if it starts with non-question sentences (at least 2 sentences before first question)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length >= 2) {
        const firstSentence = sentences[0].trim().toLowerCase();
        const questionStarters = ["what", "how", "why", "do", "is", "are", "can", "should", "would", "could", "does", "did", "will"];
        const firstWord = firstSentence.split(/\s+/)[0];
        return !questionStarters.includes(firstWord || "");
      }
      return false;
    };

    while (attempts < maxAttempts) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: attempts === 1
            ? [
                ...messages,
                {
                  role: "assistant" as const,
                  content: assistantText,
                },
                {
                  role: "user" as const,
                  content:
                    responseStyle === "socratic"
                      ? "Rewrite your previous response into ONLY neutral questions. No advice. Every line must end with a '?'"
                      : "Rewrite your previous response following the Director Mode structure: observations first, then tentative interpretations, then questions. No screenplay lines, no prescriptions, no advice.",
                },
              ]
            : attempts === 2 && isReflectionFirstExpected && startsWithQuestion(assistantText)
            ? [
                ...messages,
                {
                  role: "assistant" as const,
                  content: assistantText,
                },
                {
                  role: "user" as const,
                  content:
                    "Rewrite your response in Director Mode with reflection-first: Start with 1-2 grounded reflective sentences (no certainty), then 3-5 questions. No advice. No screenplay lines. No examples.",
                },
              ]
            : attempts >= 1 && isDiscussIntent && responseStyle === "director" && assistantText && (!hasQuickReadSection(assistantText) || startsWithQuestion(assistantText))
            ? [
                ...messages,
                {
                  role: "assistant" as const,
                  content: assistantText,
                },
                {
                  role: "user" as const,
                  content:
                    "Rewrite with format: Quick read (2-4 sentences, not questions) then Questions (3-6). No advice. No screenplay lines.",
                },
              ]
            : messages,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: `OpenAI API error: ${error}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      assistantText = data.choices[0]?.message?.content || "";

      // Validate based on style
      try {
        if (responseStyle === "socratic") {
          assertQuestionsOnly(assistantText);
        } else {
          assertNonPrescriptiveNonGenerative(assistantText);
        }

        // Post-processing check: if reflection-first was expected but output starts with question, retry
        if (isReflectionFirstExpected && startsWithQuestion(assistantText) && attempts < maxAttempts - 1) {
          attempts++;
          continue; // Retry with reflection-first instruction
        }

        // Post-processing check: if discuss intent but no Quick read section, retry
        if (isDiscussIntent && responseStyle === "director" && (!hasQuickReadSection(assistantText) || startsWithQuestion(assistantText)) && attempts < maxAttempts - 1) {
          attempts++;
          continue; // Retry with Quick read format instruction
        }

        break; // Success
      } catch (validationError) {
        if (attempts === maxAttempts - 1) {
          // Last attempt failed
          return NextResponse.json(
            {
              error: responseStyle === "socratic" 
                ? "Failed to generate questions-only response"
                : "Failed to generate valid director mode response",
              details: validationError instanceof Error ? validationError.message : String(validationError),
            },
            { status: 500 }
          );
        }
        // Retry
        attempts++;
      }
    }

    // Store assistant response
    await appendMessage(thread.id, "assistant", assistantText);

    return NextResponse.json({
      threadId: thread.id,
      questions: assistantText,
      writerProfile: {
        tone: profile.tone,
        focus: profile.focus,
        avoidTheme: profile.avoidTheme,
        avoidSymbolism: profile.avoidSymbolism,
      },
    });
  } catch (error) {
    console.error("Agent ask error:", error);
    // Ensure we always return JSON, never HTML
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
