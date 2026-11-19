import "server-only";

import type { Save } from "@/content/saves";
import { saveFromRow, type SaveRow } from "@/lib/saves";
import { isSupabaseConfigured } from "./config";
import { createClient } from "./server";

const saveColumns = "id, title, url, notes, content_type, source, preview_image_url, metadata_description, tags, style_tags, created_at";
const legacySaveColumns = "id, title, url, notes, content_type, source, tags, style_tags, created_at";

export type SavedLibraryData = {
  saves: Save[];
  persistenceEnabled: boolean;
  loadError?: string;
};

export async function getSavedLibraryData(): Promise<SavedLibraryData> {
  if (!isSupabaseConfigured()) return { saves: [], persistenceEnabled: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saves")
    .select(saveColumns)
    .order("created_at", { ascending: false });

  if (error) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("saves")
      .select(legacySaveColumns)
      .order("created_at", { ascending: false });

    if (legacyError) {
      return {
        saves: [],
        persistenceEnabled: true,
        loadError: "Saved items could not be loaded. Showing sample content for now.",
      };
    }

    return {
      saves: ((legacyData ?? []) as SaveRow[]).map(saveFromRow),
      persistenceEnabled: true,
    };
  }

  return {
    saves: ((data ?? []) as SaveRow[]).map(saveFromRow),
    persistenceEnabled: true,
  };
}
