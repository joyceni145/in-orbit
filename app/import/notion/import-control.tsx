"use client";

import { useActionState } from "react";
import {
  importReadyNotionPreview,
  refreshImportedNotionMetadata,
  type NotionImportState,
} from "./actions";

const initialNotionImportState: NotionImportState = {
  status: "idle",
  message: "",
  imported: 0,
};

export function NotionImportControl({ readyCount, importedCount }: { readyCount: number; importedCount: number }) {
  const [importState, importAction, importing] = useActionState(
    importReadyNotionPreview,
    initialNotionImportState,
  );
  const [metadataState, metadataAction, fetchingMetadata] = useActionState(
    refreshImportedNotionMetadata,
    initialNotionImportState,
  );
  const activeMessage = metadataState.message || importState.message;
  const activeStatus = metadataState.message ? metadataState.status : importState.status;

  return (
    <div className="import-action-panel">
      <div>
        <p className="import-action-title">Approved test batch</p>
        <p>Only bookmarks that are still marked Ready will be added. The Notion source is not changed.</p>
      </div>
      <div className="import-action-buttons">
        <form action={metadataAction}>
          <button className="import-secondary-action" type="submit" disabled={fetchingMetadata || importedCount === 0}>
            {fetchingMetadata ? "Fetching previews…" : `Fetch previews for ${importedCount} imported`}
          </button>
        </form>
        <form action={importAction}>
          <button type="submit" disabled={importing || readyCount === 0}>
            {importing ? "Importing…" : readyCount > 0 ? `Import ${readyCount} ready bookmarks` : "Nothing ready to import"}
          </button>
        </form>
      </div>
      {activeMessage && (
        <p className={`import-action-message import-action-message-${activeStatus}`} role="status" aria-live="polite">
          {activeMessage}
        </p>
      )}
    </div>
  );
}
