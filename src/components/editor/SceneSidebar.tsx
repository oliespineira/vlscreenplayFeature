import type { Scene } from "@/lib/scripts/fountainParser";

interface SceneSidebarProps {
  scenes: Scene[];
  activeSceneIndex?: number;
  onSelectScene: (scene: Scene) => void;
}

export function SceneSidebar({
  scenes,
  activeSceneIndex,
  onSelectScene,
}: SceneSidebarProps) {
  return (
    <div className="flex h-full w-[280px] flex-col border-r border-white/20 bg-black/50">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-white">Scenes</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {scenes.length === 0 ? (
          <div className="p-4 text-sm text-white/60">No scenes found</div>
        ) : (
          <div className="p-2">
            {scenes.map((scene) => {
              const isActive = scene.index === activeSceneIndex;
              return (
                <button
                  key={scene.index}
                  onClick={() => onSelectScene(scene)}
                  className={`mb-1 w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-blue-600/30 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="font-medium">
                    {scene.index}. {scene.slugline}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
