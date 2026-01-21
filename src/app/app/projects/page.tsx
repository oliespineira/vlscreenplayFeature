import { prisma } from "@/lib/db/prisma";
import { ensureUser } from "@/lib/auth/ensureUser";
import Link from "next/link";
import { RenameProjectButton } from "@/components/projects/RenameProjectButton";

async function createProject() {
  "use server";

  const user = await ensureUser();

  const project = await prisma.project.create({
    data: {
      title: "New Project",
      ownerId: user.id,
    },
  });
}

export default async function ProjectsPage() {
  const user = await ensureUser();

  const projects = await prisma.project.findMany({
    where: {
      ownerId: user.id,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black uppercase tracking-widest text-yellow-500 sm:text-4xl">
            Projects
          </h1>
          <div className="flex items-center gap-4">
            <form action={createProject}>
              <button
                type="submit"
                className="rounded bg-yellow-500 px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-yellow-400 active:scale-95"
              >
                New Project
              </button>
            </form>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-black/50 p-12 text-center backdrop-blur-sm">
            <p className="mb-4 text-lg text-gray-400">No projects yet.</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <form action={createProject} className="inline-block">
                <button
                  type="submit"
                  className="rounded bg-yellow-500 px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-yellow-400 active:scale-95"
                >
                  Create Your First Project
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm transition-all hover:border-yellow-500 hover:bg-black/70"
              >
                <Link href={`/app/projects/${project.id}`} className="block">
                  <h2 className="mb-2 text-xl font-bold uppercase tracking-widest text-white group-hover:text-yellow-500">
                    {project.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <div className="mt-4 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                  <RenameProjectButton
                    projectId={project.id}
                    initialTitle={project.title}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
