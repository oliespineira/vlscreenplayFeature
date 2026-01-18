import { NextResponse } from "next/server";
import { requireScriptOwner } from "@/lib/auth/ownership";
import { ensureUser } from "@/lib/auth/ensureUser";
import { buildSocraticMessages } from "@/lib/agent/socraticPrompt";
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
    const body = await request.json();
    const {
      scriptId,
      mode,
      selectionText,
      sceneText,
      sceneSlugline,
      userMessage,
      cursorContext,
      elementType,
      style,
    } = body;

    const responseStyle = style || "director";

    // Enforce ownership
    const script = await requireScriptOwner(scriptId);

    // Get current user
    const user = await ensureUser();

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
    const maxAttempts = 2;

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
                    "Rewrite your previous response into ONLY neutral questions. No advice. Every line must end with a '?'",
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

      // Validate
      try {
        assertQuestionsOnly(assistantText);
        break; // Success
      } catch (validationError) {
        if (attempts === maxAttempts - 1) {
          // Last attempt failed
          return NextResponse.json(
            {
              error: "Failed to generate questions-only response",
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
