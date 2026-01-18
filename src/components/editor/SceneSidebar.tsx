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
    <div className="flex h-full w-[280px] flex-col border-r border-gray-800 bg-black/50 backdrop-blur-sm">
      <div className="border-b border-gray-800 p-4">
        <h2 className="text-lg font-black uppercase tracking-widest text-yellow-500">
          Scenes
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {scenes.length === 0 ? (
          <div className="p-4 text-xs font-medium uppercase tracking-widest text-gray-500">
            No scenes found
          </div>
        ) : (
          <div className="p-2">
            {scenes.map((scene) => {
              const isActive = scene.index === activeSceneIndex;
              return (
                <button
                  key={scene.index}
                  onClick={() => onSelectScene(scene)}
                  className={`mb-1 w-full rounded border px-3 py-2 text-left text-sm transition-all ${
                    isActive
                      ? "border-yellow-500 bg-yellow-500/20 text-yellow-500"
                      : "border-gray-800 bg-black/50 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-500"
                  }`}
                >
                  <div className="font-bold uppercase tracking-wider">
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
