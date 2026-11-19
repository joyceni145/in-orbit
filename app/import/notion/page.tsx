import Link from "next/link";
import { CelestialBackground } from "@/components/celestial-background";
import { CursorTrail } from "@/components/cursor-trail";
import { getNotionImportPreview, type NotionPreviewStatus } from "@/lib/notion-import";
import { NotionImportControl } from "./import-control";

const statusLabels: Record<NotionPreviewStatus, string> = {
  ready: "Ready",
  already_imported: "Already imported",
  needs_review: "Needs review",
};

export default async function NotionImportPreviewPage() {
  const { records, error } = await getNotionImportPreview();
  const counts = {
    ready: records.filter(record => record.status === "ready").length,
    alreadyImported: records.filter(record => record.status === "already_imported").length,
    needsReview: records.filter(record => record.status === "needs_review").length,
  };

  return (
    <>
      <CelestialBackground fullField />
      <CursorTrail />
      <main className="import-preview-page">
        <Link className="import-back-link" href="/">← Library</Link>
        <header className="import-preview-header">
          <div>
            <p className="import-eyebrow">Notion migration</p>
            <h1>Import preview</h1>
            <p>Review how this approved test batch maps into In Orbit, then import only the records that remain safe.</p>
          </div>
          <span className="read-only-badge">Test batch · Notion stays unchanged</span>
        </header>

        {error ? (
          <section className="import-preview-error" role="alert">
            <span aria-hidden="true">✦</span>
            <h2>Preview unavailable</h2>
            <p>{error}</p>
          </section>
        ) : (
          <>
            <section className="import-summary" aria-label="Preview summary">
              <div><strong>{records.length}</strong><span>Sample records</span></div>
              <div><strong>{counts.ready}</strong><span>Ready</span></div>
              <div><strong>{counts.alreadyImported}</strong><span>Already imported</span></div>
              <div><strong>{counts.needsReview}</strong><span>Needs review</span></div>
            </section>

            <NotionImportControl readyCount={counts.ready} importedCount={counts.alreadyImported} />

            <section className="import-records" aria-labelledby="preview-records-title">
              <div className="import-records-heading">
                <div>
                  <h2 id="preview-records-title">Mapped bookmarks</h2>
                  <p>Titles use the website domain until metadata enrichment is added.</p>
                </div>
                <a href="https://app.notion.com/p/1f34ade79c3f80ff8cf7eb7a795e1e4d" target="_blank" rel="noreferrer">View source database ↗</a>
              </div>

              <ol className="import-record-list">
                {records.map(record => (
                  <li key={record.externalId || record.notionUrl} className="import-record">
                    <div className="import-record-main">
                      <span className={`import-status import-status-${record.status}`}>{statusLabels[record.status]}</span>
                      <div>
                        <h3>{record.title}</h3>
                        <a href={record.url || record.notionUrl} target="_blank" rel="noreferrer">{record.url || "No valid URL"}</a>
                      </div>
                    </div>
                    <dl className="import-record-map">
                      <div><dt>Format</dt><dd>{record.contentType.slice(0, -1)}</dd></div>
                      <div><dt>Categories</dt><dd>{record.categories.join(", ") || "None"}</dd></div>
                      <div><dt>Tags</dt><dd>{record.tags.join(", ") || "None"}</dd></div>
                      <div><dt>Portfolio style</dt><dd>{record.styleTags.join(", ") || "None"}</dd></div>
                      <div><dt>Level</dt><dd>{record.portfolioLevel ?? "None"}</dd></div>
                      <div><dt>Favourite</dt><dd>{record.isFavorite ? "Yes" : "No"}</dd></div>
                    </dl>
                    {record.notes && <p className="import-record-notes">{record.notes}</p>}
                    <div className="import-record-footer">
                      <span>{record.statusReason}</span>
                      <code>{record.externalId}</code>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </main>
    </>
  );
}
