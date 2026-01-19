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

/**
 * API-safe version that throws an error instead of calling notFound()
 * Use this in API routes to return proper JSON error responses
 */
export async function requireScriptOwnerForApi(scriptId: string, userId: string) {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { project: true },
  });

  if (!script) {
    throw new Error("Script not found");
  }

  if (script.project.ownerId !== userId) {
    throw new Error("Access denied");
  }

  return script;
}

/**
 * API-safe version of requireProjectOwner that throws an error instead of calling notFound()
 * Use this in API routes to return proper JSON error responses
 */
export async function requireProjectOwnerForApi(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.ownerId !== userId) {
    throw new Error("Access denied");
  }

  return project;
}
