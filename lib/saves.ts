import type { Save } from "@/content/saves";

export type SaveRow = {
  id: string;
  title: string;
  url: string;
  notes: string;
  content_type: string;
  source: string | null;
  preview_image_url?: string | null;
  metadata_description?: string | null;
  tags: string[];
  style_tags: string[];
  created_at: string;
};

export type CreateSaveInput = {
  title: string;
  url: string;
  notes: string;
  contentType: Save["type"];
  tags: string[];
  styleTags: string[];
};

export type UpdateSaveInput = CreateSaveInput & {
  id: string;
};

export type CreateSaveResult =
  | { ok: true; save: Save }
  | { ok: false; error: string };

export type DeleteSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export const saveTypes = ["Books", "Articles", "Websites", "Videos", "Tools"] as const;

const artworkByType: Partial<Record<string, Save["artwork"]>> = {
  Books: "book",
  Articles: "type",
  Websites: "orbits",
  Videos: "landscape",
  Tools: "diagram",
};

export function isSaveType(value: unknown): value is Save["type"] {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 48;
}

export function artworkForType(type: Save["type"]): Save["artwork"] {
  return artworkByType[type] ?? "orbits";
}

export function normalizeWebAddress(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

export function sourceFromUrl(url: URL) {
  return url.hostname.replace(/^www\./, "");
}

export function saveFromRow(row: SaveRow): Save {
  const type = isSaveType(row.content_type) ? row.content_type.trim() : "Websites";

  return {
    id: row.id,
    title: row.title,
    type,
    source: row.source ?? sourceFromUrl(new URL(row.url)),
    description: row.notes,
    metadataDescription: row.metadata_description || undefined,
    previewImageUrl: row.preview_image_url || undefined,
    tags: row.tags,
    styleTags: row.style_tags.length ? row.style_tags : undefined,
    savedAt: row.created_at,
    artwork: artworkForType(type),
    url: row.url,
  };
}
