"use server";

import { revalidatePath } from "next/cache";
import { fetchLinkMetadata, type LinkMetadata } from "@/lib/link-metadata";
import { getNotionImportPreview, notionRecordToInsert } from "@/lib/notion-import";
import { createClient } from "@/lib/supabase/server";

export type NotionImportState = {
  status: "idle" | "success" | "error";
  message: string;
  imported: number;
};

async function fetchMetadataInBatches(urls: string[]) {
  const results = new Map<string, LinkMetadata | null>();
  const queue = [...urls];
  const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (queue.length) {
      const url = queue.shift();
      if (!url) return;
      results.set(url, await fetchLinkMetadata(new URL(url)));
    }
  });
  await Promise.all(workers);
  return results;
}

export async function importReadyNotionPreview(
  previousState: NotionImportState,
): Promise<NotionImportState> {
  void previousState;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : authData.user;

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again before importing.",
      imported: 0,
    };
  }

  const preview = await getNotionImportPreview();
  if (preview.error) {
    return { status: "error", message: preview.error, imported: 0 };
  }

  const ready = preview.records.filter(record => record.status === "ready");
  if (!ready.length) {
    return {
      status: "success",
      message: "There are no new ready bookmarks to import.",
      imported: 0,
    };
  }

  const metadata = await fetchMetadataInBatches(ready.map(record => record.url));
  const rows = ready.map(record => notionRecordToInsert(record, user.id, metadata.get(record.url)));
  const { data, error } = await supabase
    .from("saves")
    .insert(rows)
    .select("external_id");

  if (error) {
    return {
      status: "error",
      message: "Nothing was imported. The batch could not be saved safely; review the preview and try again.",
      imported: 0,
    };
  }

  const imported = data?.length ?? 0;
  revalidatePath("/");
  revalidatePath("/import/notion");

  return {
    status: "success",
    message: `${imported} ${imported === 1 ? "bookmark was" : "bookmarks were"} imported into your library.`,
    imported,
  };
}

export async function refreshImportedNotionMetadata(
  previousState: NotionImportState,
): Promise<NotionImportState> {
  void previousState;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : authData.user;

  if (!user) return { status: "error", message: "Your session has expired. Sign in again before fetching previews.", imported: 0 };

  const preview = await getNotionImportPreview();
  if (preview.error) return { status: "error", message: preview.error, imported: 0 };
  const importedRecords = preview.records.filter(record => record.status === "already_imported");
  if (!importedRecords.length) return { status: "success", message: "There are no imported bookmarks to refresh.", imported: 0 };

  const externalIds = importedRecords.map(record => record.externalId);
  const { data: savedRows, error: loadError } = await supabase
    .from("saves")
    .select("id, title, external_id")
    .eq("owner_id", user.id)
    .eq("external_source", "notion")
    .in("external_id", externalIds);

  if (loadError) return { status: "error", message: "The imported bookmarks could not be checked.", imported: 0 };

  const metadata = await fetchMetadataInBatches(importedRecords.map(record => record.url));
  let refreshed = 0;
  for (const record of importedRecords) {
    const saved = savedRows?.find(row => row.external_id === record.externalId);
    const details = metadata.get(record.url);
    if (!saved || !details) continue;

    const values: Record<string, string | null> = {
      preview_image_url: details.imageUrl || null,
      metadata_description: details.description || null,
      metadata_fetched_at: details.fetchedAt,
    };
    if (saved.title === record.title && details.title) values.title = details.title;

    const { error } = await supabase
      .from("saves")
      .update(values)
      .eq("id", saved.id)
      .eq("owner_id", user.id);
    if (!error) refreshed += 1;
  }

  revalidatePath("/");
  revalidatePath("/import/notion");
  return {
    status: refreshed ? "success" : "error",
    message: refreshed
      ? `Metadata and previews were refreshed for ${refreshed} ${refreshed === 1 ? "bookmark" : "bookmarks"}.`
      : "No metadata could be fetched. Some websites block automated previews, so the existing saves were left unchanged.",
    imported: refreshed,
  };
}
