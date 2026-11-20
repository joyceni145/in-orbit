"use server";

import { revalidatePath } from "next/cache";
import { fetchLinkMetadata } from "@/lib/link-metadata";
import { isSaveType, normalizeWebAddress, saveFromRow, sourceFromUrl, type CreateSaveInput, type CreateSaveResult, type DeleteSaveResult, type SaveRow, type UpdateSaveInput } from "@/lib/saves";
import { createClient } from "@/lib/supabase/server";

const saveColumns = "id, title, url, notes, content_type, source, preview_image_url, metadata_description, tags, style_tags, created_at";
const legacySaveColumns = "id, title, url, notes, content_type, source, tags, style_tags, created_at";

function metadataColumnsAreMissing(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "PGRST204" || error?.code === "42703" || message.includes("metadata_description") || message.includes("metadata_fetched_at");
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value
    .filter((tag): tag is string => typeof tag === "string")
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map(tag => tag.slice(0, 48))));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateSaveInput(input: CreateSaveInput) {
  if (!input || typeof input !== "object") return null;

  const url = normalizeWebAddress(typeof input.url === "string" ? input.url : "");
  if (!url || !isSaveType(input.contentType)) return null;

  const tags = cleanTags(input.tags);
  const contentType = input.contentType.trim();
  const supportsPortfolioStyles = contentType.toLowerCase() === "portfolio" || tags.some(tag => tag.toLowerCase() === "portfolio");
  return {
    title: typeof input.title === "string" ? input.title.trim().slice(0, 240) : "",
    url,
    notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 12_000) : "",
    contentType,
    tags,
    styleTags: supportsPortfolioStyles ? cleanTags(input.styleTags) : [],
  };
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function createSave(input: CreateSaveInput): Promise<CreateSaveResult> {
  const values = validateSaveInput(input);
  if (!values) return { ok: false, error: "Enter a valid web address." };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return { ok: false, error: "Your session has expired. Sign in again before saving." };
  }

  const source = sourceFromUrl(values.url);
  const metadata = await fetchLinkMetadata(values.url);

  const baseValues = {
    owner_id: user.id,
    title: values.title || metadata?.title || source,
    url: values.url.toString(),
    notes: values.notes,
    content_type: values.contentType,
    source,
    tags: values.tags,
    style_tags: values.styleTags,
  };
  let { data, error } = await supabase
    .from("saves")
    .insert({
      ...baseValues,
      preview_image_url: metadata?.imageUrl || null,
      metadata_description: metadata?.description || null,
      metadata_fetched_at: metadata?.fetchedAt || null,
    })
    .select(saveColumns)
    .single();

  if (metadataColumnsAreMissing(error)) {
    const fallback = await supabase.from("saves").insert(baseValues).select(legacySaveColumns).single();
    data = fallback.data ? { ...fallback.data, preview_image_url: null, metadata_description: null } : null;
    error = fallback.error;
  }

  if (error || !data) {
    return { ok: false, error: "This save could not be added. Check your connection and try again." };
  }

  revalidatePath("/");
  return { ok: true, save: saveFromRow(data as SaveRow) };
}

export async function updateSave(input: UpdateSaveInput): Promise<CreateSaveResult> {
  if (!isUuid(input?.id)) return { ok: false, error: "This save could not be identified." };

  const values = validateSaveInput(input);
  if (!values) return { ok: false, error: "Enter a valid web address." };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again before updating." };

  const source = sourceFromUrl(values.url);
  const metadata = await fetchLinkMetadata(values.url);
  const baseValues = {
    title: values.title || source,
    url: values.url.toString(),
    notes: values.notes,
    content_type: values.contentType,
    source,
    tags: values.tags,
    style_tags: values.styleTags,
  };
  let { data, error } = await supabase
    .from("saves")
    .update({
      ...baseValues,
      preview_image_url: metadata?.imageUrl || null,
      metadata_description: metadata?.description || null,
      metadata_fetched_at: metadata?.fetchedAt || null,
    })
    .eq("id", input.id)
    .eq("owner_id", user.id)
    .select(saveColumns)
    .single();

  if (metadataColumnsAreMissing(error)) {
    const fallback = await supabase
      .from("saves")
      .update(baseValues)
      .eq("id", input.id)
      .eq("owner_id", user.id)
      .select(legacySaveColumns)
      .single();
    data = fallback.data ? { ...fallback.data, preview_image_url: null, metadata_description: null } : null;
    error = fallback.error;
  }

  if (error || !data) {
    return { ok: false, error: "This save could not be updated. Check your connection and try again." };
  }

  revalidatePath("/");
  return { ok: true, save: saveFromRow(data as SaveRow) };
}

export async function deleteSave(id: string): Promise<DeleteSaveResult> {
  if (!isUuid(id)) return { ok: false, error: "This save could not be identified." };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again before deleting." };

  const { data, error } = await supabase
    .from("saves")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "This save could not be deleted. Check your connection and try again." };
  }

  revalidatePath("/");
  return { ok: true, id: data.id as string };
}
