"use client";

interface Props {
  name: string;
  description: string | null;
}

interface Character {
  name: string;
  profile: string | null;
}

interface Location {
  name: string;
  details: string | null;
}

interface WardrobeItem {
  item: string;
  who: string | null;
}

interface SceneBreakdown {
  id: string;
  logline: string | null;
  props: Array<Props> | null;
  characters: Array<Character> | null;
  locations: Array<Location> | null;
  wardrobe: Array<WardrobeItem> | null;
  notes: string | null;
  updatedAt: string;
}

interface SceneBreakdownCardProps {
  sceneIndex: number;
  slugline: string;
  breakdown: SceneBreakdown | null;
}

export function SceneBreakdownCard({
  sceneIndex,
  slugline,
  breakdown,
}: SceneBreakdownCardProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-black/50 p-6 backdrop-blur-sm">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wider text-white">
            Scene {sceneIndex}
          </h3>
        </div>
        <p className="text-sm text-gray-400">{slugline}</p>
      </div>

      {breakdown ? (
        <div className="space-y-4">
          {breakdown.logline && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-400">
                Logline
              </h4>
              <p className="text-sm text-gray-300">{breakdown.logline}</p>
            </div>
          )}

          {breakdown.characters && breakdown.characters.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-400">
                Characters
              </h4>
              <ul className="space-y-1">
                {breakdown.characters.map((char, idx) => (
                  <li key={idx} className="text-sm text-gray-300">
                    <span className="font-medium">{char.name}</span>
                    {char.profile && (
                      <span className="ml-2 text-gray-400">— {char.profile}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {breakdown.props && breakdown.props.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-400">
                Props
              </h4>
              <ul className="space-y-1">
                {breakdown.props.map((prop, idx) => (
                  <li key={idx} className="text-sm text-gray-300">
                    <span className="font-medium">{prop.name}</span>
                    {prop.description && (
                      <span className="ml-2 text-gray-400">— {prop.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {breakdown.locations && breakdown.locations.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-400">
                Locations
              </h4>
              <ul className="space-y-1">
                {breakdown.locations.map((loc, idx) => (
                  <li key={idx} className="text-sm text-gray-300">
                    <span className="font-medium">{loc.name}</span>
                    {loc.details && (
                      <span className="ml-2 text-gray-400">— {loc.details}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {breakdown.wardrobe && breakdown.wardrobe.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-400">
                Wardrobe
              </h4>
              <ul className="space-y-1">
                {breakdown.wardrobe.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-300">
                    <span className="font-medium">{item.item}</span>
                    {item.who && (
                      <span className="ml-2 text-gray-400">— {item.who}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {breakdown.notes && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-400">
                Notes
              </h4>
              <p className="text-sm text-gray-300">{breakdown.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No breakdown generated yet</p>
      )}
    </div>
  );
}
