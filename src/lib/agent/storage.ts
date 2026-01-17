import { prisma } from "@/lib/db/prisma";

export async function getOrCreateWriterProfile(userId: string) {
  let profile = await prisma.writerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.writerProfile.create({
      data: {
        userId,
        tone: "neutral",
        focus: "balanced",
        avoidTheme: false,
        avoidSymbolism: false,
        notes: "",
      },
    });
  }

  return profile;
}

export async function getOrCreateThread(scriptId: string, userId: string) {
  let thread = await prisma.agentThread.findUnique({
    where: {
      scriptId_userId: {
        scriptId,
        userId,
      },
    },
  });

  if (!thread) {
    thread = await prisma.agentThread.create({
      data: {
        scriptId,
        userId,
      },
    });
  }

  return thread;
}

export async function appendMessage(
  threadId: string,
  role: "user" | "assistant",
  content: string,
) {
  return await prisma.agentMessage.create({
    data: {
      threadId,
      role,
      content,
    },
  });
}

export async function getRecentMessages(threadId: string, limit = 12) {
  return await prisma.agentMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}
