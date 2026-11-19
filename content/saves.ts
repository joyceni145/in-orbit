export const categories = ["All saves", "Books", "Articles", "Websites", "Videos", "Tools"] as const;
export type Category = (typeof categories)[number];
export type Save = {
  id: string;
  title: string;
  type: Exclude<Category, "All saves">;
  source: string;
  description: string;
  metadataDescription?: string;
  previewImageUrl?: string;
  tags: string[];
  styleTags?: string[];
  savedAt: string;
  artwork: "book" | "orbits" | "type" | "landscape" | "diagram" | "moon";
  url?: string;
};

// Fictional examples for layout exploration. These are not imported Notion records.
export const saves: Save[] = [
  { id: "attention", title: "The art of paying attention", type: "Books", source: "A book to return to", description: "A little reminder to notice what is already here.", tags: ["Mindful living", "Creativity"], savedAt: "2026-11-12", artwork: "book", url: "https://example.com/the-art-of-paying-attention" },
  { id: "small-web", title: "A softer corner of the internet", type: "Websites", source: "An independent web journal", description: "A reference I keep returning to for its playful navigation, gentle pacing, and the way small interactions make the site feel personal without competing with the work. I especially want to remember how confidently it uses whitespace and type.", tags: ["Portfolio", "Design"], styleTags: ["Playful", "Editorial"], savedAt: "2026-11-11", artwork: "orbits", url: "https://example.com/a-softer-corner-of-the-internet" },
  { id: "ordinary", title: "Finding wonder in the ordinary", type: "Articles", source: "Notes on everyday life", description: "On collecting moments instead of waiting for something extraordinary.", tags: ["Reflection", "Inspiration"], savedAt: "2026-11-10", artwork: "type", url: "https://example.com/finding-wonder-in-the-ordinary" },
  { id: "slow", title: "The long way home", type: "Videos", source: "A short film", description: "An unhurried journey through places that make you feel small, in a good way.", tags: ["Travel", "Slow living"], savedAt: "2026-11-09", artwork: "landscape", url: "https://example.com/the-long-way-home" },
  { id: "connections", title: "Ideas are better connected", type: "Tools", source: "A tool for thinking", description: "An open space for following a thought and seeing where it leads.", tags: ["Tools", "Learning"], savedAt: "2026-11-08", artwork: "diagram", url: "https://example.com/ideas-are-better-connected" },
  { id: "night", title: "A field guide to looking up", type: "Articles", source: "From a curious observer", description: "A few things to look for the next time the sky is clear.", tags: ["Nature", "Curiosity"], savedAt: "2026-11-07", artwork: "moon", url: "https://example.com/a-field-guide-to-looking-up" },
];
