"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);

  // Extract projectId from pathname
  useEffect(() => {
    const match = pathname.match(/\/app\/projects\/([^/]+)/);
    if (match) {
      const id = match[1];
      setProjectId(id);
      // Fetch project title
      fetch(`/api/projects/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.title) {
            setProjectTitle(data.title);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    } else {
      setProjectId(null);
      setProjectTitle(null);
    }
  }, [pathname]);

  // Determine active panel
  const getActivePanel = () => {
    if (pathname.includes("/visuals")) return "visualise";
    if (pathname.includes("/export")) return "export";
    if (pathname.includes("/editor") || (pathname.includes("/scripts") && !pathname.includes("/visuals"))) return "writing";
    return null;
  };

  const activePanel = getActivePanel();

  const handlePanelClick = (panel: string) => {
    if (!projectId) {
      router.push("/app/projects");
      return;
    }

    switch (panel) {
      case "writing":
        // Try to find a script for this project
        fetch(`/api/projects/${projectId}/scripts`)
          .then((res) => res.json())
          .then((scripts) => {
            if (Array.isArray(scripts) && scripts.length > 0) {
              router.push(`/app/projects/${projectId}/scripts/${scripts[0].id}/editor`);
            } else {
              router.push(`/app/projects/${projectId}`);
            }
          })
          .catch(() => {
            router.push(`/app/projects/${projectId}`);
          });
        break;
      case "visualise":
        router.push(`/app/projects/${projectId}/visuals`);
        break;
      case "export":
        router.push(`/app/projects/${projectId}/export`);
        break;
    }
  };

  // Only show navigation panels when a project is selected
  if (!projectId) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-black/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: Brand / Logo */}
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="text-xl font-black uppercase tracking-widest text-yellow-500 transition-opacity hover:opacity-70"
              >
                DION
              </Link>
            </div>

            {/* Right: User / Actions */}
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-black/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand / Logo + Project Switcher */}
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="text-xl font-black uppercase tracking-widest text-yellow-500 transition-opacity hover:opacity-70"
            >
              DION
            </Link>
            {projectTitle && (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-xs text-gray-500">/</span>
                <span className="text-sm font-medium uppercase tracking-wider text-gray-300">
                  {projectTitle}
                </span>
              </div>
            )}
          </div>

          {/* Center: Main panels */}
          <nav className="flex gap-2 mx-auto">
            <button
              onClick={() => handlePanelClick("writing")}
              aria-pressed={activePanel === "writing"}
              className={`relative px-4 py-2 text-sm font-medium uppercase tracking-widest transition-colors ${
                activePanel === "writing"
                  ? "text-pink-400"
                  : "text-gray-400 hover:text-pink-400"
              }`}
            >
              Writing
              {activePanel === "writing" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-pink-400" />
              )}
            </button>
            <button
              onClick={() => handlePanelClick("visualise")}
              aria-pressed={activePanel === "visualise"}
              className={`relative px-4 py-2 text-sm font-medium uppercase tracking-widest transition-colors ${
                activePanel === "visualise"
                  ? "text-pink-400"
                  : "text-gray-400 hover:text-pink-400"
              }`}
            >
              Visualising
              {activePanel === "visualise" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-pink-400" />
              )}
            </button>
            <button
              onClick={() => handlePanelClick("export")}
              aria-pressed={activePanel === "export"}
              className={`relative px-4 py-2 text-sm font-medium uppercase tracking-widest transition-colors ${
                activePanel === "export"
                  ? "text-pink-400"
                  : "text-gray-400 hover:text-pink-400"
              }`}
            >
              Exporting
              {activePanel === "export" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-pink-400" />
              )}
            </button>
          </nav>

          {/* Right: User / Actions */}
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
