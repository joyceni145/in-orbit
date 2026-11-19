export type NebulaImage = {
  id: string;
  src: string;
  alt: string;
  tags: string[];
  width: number;
  height: number;
  createdAt: string;
  temporary?: boolean;
};

// Fictional visual studies for layout exploration. Pasted images are added ahead of these in memory only.
export const nebulaSamples: NebulaImage[] = [
  { id: "afterglow", src: "/nebula/afterglow.svg", alt: "Soft amber light drifting through a dark blue field", tags: ["Color", "Atmosphere"], width: 900, height: 1200, createdAt: "2026-11-12" },
  { id: "editorial-grid", src: "/nebula/editorial-grid.svg", alt: "Cream editorial grid with small black type studies", tags: ["Editorial", "Typography"], width: 1200, height: 820, createdAt: "2026-11-11" },
  { id: "folded-light", src: "/nebula/folded-light.svg", alt: "Layered translucent shapes in warm yellow and violet", tags: ["Material", "Color"], width: 900, height: 1320, createdAt: "2026-11-10" },
  { id: "quiet-interface", src: "/nebula/quiet-interface.svg", alt: "Minimal interface study on a graphite surface", tags: ["Interface", "Minimal"], width: 1100, height: 900, createdAt: "2026-11-09" },
  { id: "night-window", src: "/nebula/night-window.svg", alt: "Abstract night window with a distant amber horizon", tags: ["Atmosphere", "Architecture"], width: 1200, height: 920, createdAt: "2026-11-08" },
  { id: "soft-type", src: "/nebula/soft-type.svg", alt: "Expressive serif letterforms floating on soft grey", tags: ["Typography", "Editorial"], width: 900, height: 1120, createdAt: "2026-11-07" },
];
