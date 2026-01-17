import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ensureUser } from "./ensureUser";

export async function requireProjectOwner(projectId: string) {
  const user = await ensureUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.ownerId !== user.id) {
    notFound();
  }

  return project;
}

export async function requireScriptOwner(scriptId: string) {
  const user = await ensureUser();

  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { project: true },
  });

  if (!script || script.project.ownerId !== user.id) {
    notFound();
  }

  return script;
}
