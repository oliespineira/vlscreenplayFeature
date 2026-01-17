import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ensureUser } from "@/lib/auth/ensureUser";
import Link from "next/link";

async function createProject() {
  "use server";

  const user = await ensureUser();

  const project = await prisma.project.create({
    data: {
      title: "Untitled Project",
      ownerId: user.id,
    },
  });

  redirect(`/app/projects/${project.id}`);
}

export default async function ProjectsPage() {
  const user = await ensureUser();

  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
          <form action={createProject}>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              New Project
            </button>
          </form>
        </div>

        {projects.length === 0 ? (
          <p className="text-white/70">No projects yet. Create your first project!</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <h2 className="text-xl font-semibold">{project.title}</h2>
                <p className="mt-1 text-sm text-white/60">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
