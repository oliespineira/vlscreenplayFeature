import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function ensureUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  let user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkUserId: userId,
      },
    });
  }

  return user;
}
