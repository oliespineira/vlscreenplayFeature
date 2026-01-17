import { NextResponse } from "next/server";
import { requireScriptOwner } from "@/lib/auth/ownership";
import { ensureUser } from "@/lib/auth/ensureUser";
import { getOrCreateWriterProfile, getOrCreateThread, getRecentMessages } from "@/lib/agent/storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get("scriptId");

    if (!scriptId) {
      return NextResponse.json({ error: "scriptId is required" }, { status: 400 });
    }

    // Enforce ownership
    await requireScriptOwner(scriptId);

    // Get current user
    const user = await ensureUser();

    // Get or create profile
    const profile = await getOrCreateWriterProfile(user.id);

    // Get or create thread
    const thread = await getOrCreateThread(scriptId, user.id);

    // Get recent messages
    const messages = await getRecentMessages(thread.id, 50);

    return NextResponse.json({
      threadId: thread.id,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
      writerProfile: {
        tone: profile.tone,
        focus: profile.focus,
        avoidTheme: profile.avoidTheme,
        avoidSymbolism: profile.avoidSymbolism,
      },
    });
  } catch (error) {
    console.error("Thread fetch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
