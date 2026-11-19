import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LinkMetadata } from "@/lib/link-metadata";
import { createClient } from "@/lib/supabase/server";

type NotionSourceRow = {
  url: string;
  createdTime: string;
  Link: string | null;
  Description: string | null;
  Type: string | null;
  Tags: string | null;
  Level: string | null;
  "Files & media": string | null;
};

type ExistingSaveReference = {
  external_source: string | null;
  external_id: string | null;
  url: string;
};

export type NotionImportRow = {
  owner_id: string;
  title: string;
  url: string;
  notes: string;
  content_type: NotionPreviewRecord["contentType"];
  source: string;
  preview_image_url: string | null;
  metadata_description: string | null;
  metadata_fetched_at: string | null;
  tags: string[];
  style_tags: string[];
  external_source: "notion";
  external_id: string;
  imported_at: string;
  categories: string[];
  portfolio_level: string | null;
  is_favorite: boolean;
  created_at: string;
};

export type NotionPreviewStatus = "ready" | "already_imported" | "needs_review";

export type NotionPreviewRecord = {
  externalId: string;
  notionUrl: string;
  url: string;
  title: string;
  titleSource: "domain fallback";
  notes: string;
  contentType: "Articles" | "Websites" | "Videos" | "Tools";
  categories: string[];
  tags: string[];
  styleTags: string[];
  portfolioLevel: string | null;
  isFavorite: boolean;
  createdAt: string;
  status: NotionPreviewStatus;
  statusReason: string;
};

const portfolioStyleTags = new Set(["Creative", "Playful", "Modern & Clean", "Dark UI", "Interaction Design"]);

function parseList(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function extractNotionId(value: string) {
  const compact = value.match(/([0-9a-f]{32})(?:[?#/]|$)/i)?.[1];
  if (!compact) return "";
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`.toLowerCase();
}

function extractWebAddress(value: string | null) {
  if (!value) return null;
  const markdownTarget = value.match(/^\[[^\]]*\]\((https?:\/\/[^)]+)\)$/i)?.[1];
  try {
    const url = new URL(markdownTarget ?? value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function inferContentType(categories: string[], tags: string[]): NotionPreviewRecord["contentType"] {
  if (tags.includes("Video")) return "Videos";
  if (tags.includes("Article")) return "Articles";
  if (categories.includes("Tools")) return "Tools";
  return "Websites";
}

function mapSourceRow(row: NotionSourceRow) {
  const externalId = extractNotionId(row.url);
  const webAddress = extractWebAddress(row.Link);
  const categories = parseList(row.Type);
  const sourceTags = parseList(row.Tags);
  const isPortfolio = categories.includes("Portfolio");
  const styleTags = isPortfolio ? sourceTags.filter(tag => portfolioStyleTags.has(tag)) : [];
  const tags = sourceTags.filter(tag => tag !== "Favourite" && !styleTags.includes(tag));

  return {
    externalId,
    notionUrl: row.url,
    url: webAddress?.toString() ?? "",
    title: webAddress?.hostname.replace(/^www\./, "") ?? "Untitled save",
    titleSource: "domain fallback" as const,
    notes: row.Description?.trim() ?? "",
    contentType: inferContentType(categories, sourceTags),
    categories,
    tags,
    styleTags,
    portfolioLevel: row.Level,
    isFavorite: sourceTags.includes("Favourite"),
    createdAt: new Date(row.createdTime).toISOString(),
  };
}

export function notionRecordToInsert(record: NotionPreviewRecord, ownerId: string, metadata?: LinkMetadata | null): NotionImportRow {
  return {
    owner_id: ownerId,
    title: metadata?.title || record.title,
    url: record.url,
    notes: record.notes,
    content_type: record.contentType,
    source: new URL(record.url).hostname.replace(/^www\./, ""),
    preview_image_url: metadata?.imageUrl || null,
    metadata_description: metadata?.description || null,
    metadata_fetched_at: metadata?.fetchedAt || null,
    tags: record.tags,
    style_tags: record.styleTags,
    external_source: "notion",
    external_id: record.externalId,
    imported_at: new Date().toISOString(),
    categories: record.categories,
    portfolio_level: record.portfolioLevel,
    is_favorite: record.isFavorite,
    created_at: record.createdAt,
  };
}

export async function getNotionImportPreview() {
  const sourcePath = path.join(process.cwd(), "imports", "notion-preview.json");
  let sourceRows: NotionSourceRow[] = [];

  try {
    sourceRows = JSON.parse(await readFile(sourcePath, "utf8")) as NotionSourceRow[];
  } catch {
    return { records: [], error: "The local Notion preview file is unavailable." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saves")
    .select("external_source, external_id, url");

  if (error) return { records: [], error: "Existing saves could not be checked. Nothing has been imported." };

  const existing = (data ?? []) as ExistingSaveReference[];
  const seenExternalIds = new Set<string>();
  const seenUrls = new Set<string>();
  const records: NotionPreviewRecord[] = sourceRows.map(row => {
    const mapped = mapSourceRow(row);
    const sourceMatch = existing.some(save => save.external_source === "notion" && save.external_id === mapped.externalId);
    const urlMatch = existing.some(save => save.url === mapped.url);
    const duplicateSourceId = Boolean(mapped.externalId && seenExternalIds.has(mapped.externalId));
    const duplicateUrl = Boolean(mapped.url && seenUrls.has(mapped.url));

    if (mapped.externalId) seenExternalIds.add(mapped.externalId);
    if (mapped.url) seenUrls.add(mapped.url);

    if (!mapped.externalId || !mapped.url) {
      return { ...mapped, status: "needs_review" as const, statusReason: !mapped.url ? "Missing or invalid link" : "Missing Notion Source ID" };
    }
    if (duplicateSourceId) return { ...mapped, status: "needs_review" as const, statusReason: "Duplicate Notion Source ID in this batch" };
    if (duplicateUrl) return { ...mapped, status: "needs_review" as const, statusReason: "Duplicate URL in this batch; compare notes before importing" };
    if (sourceMatch) return { ...mapped, status: "already_imported" as const, statusReason: "Notion page already exists in In Orbit" };
    if (urlMatch) return { ...mapped, status: "needs_review" as const, statusReason: "URL already exists; compare notes before importing" };
    return { ...mapped, status: "ready" as const, statusReason: "Ready for a test import" };
  });

  return { records, error: null };
}
