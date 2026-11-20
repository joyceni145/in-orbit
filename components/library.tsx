"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSave, deleteSave, updateSave } from "@/app/actions/saves";
import { categories, saves, type Category, type Save } from "@/content/saves";
import type { CreateSaveResult } from "@/lib/saves";
import { AddSaveModal } from "./add-save-modal";
import { CollectionEmptyState } from "./collection-empty-state";
import { DeleteSaveDialog } from "./delete-save-dialog";
import { Nebula } from "./nebula";
import { SaveCard } from "./save-card";
import { SaveDetailModal } from "./save-detail-modal";
import { SaveGrid } from "./save-grid";
import { SelectMenu } from "./select-menu";

type SortOrder = "newest" | "title";
type LibraryView = "library" | "nebula";
type LibraryLayout = "gallery" | "list";

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "title", label: "Title A–Z" },
] as const;

const starterTags = ["Portfolio"];
const starterPortfolioStyles = ["Editorial", "Experimental", "Minimal", "Modern & clean", "Playful", "Warm & tactile"];

type LibraryProps = {
  saves: Save[];
  persistenceEnabled: boolean;
  loadError?: string;
};

export function Library({ saves: persistedSaves, persistenceEnabled, loadError }: LibraryProps) {
  const [view, setView] = useState<LibraryView>("library");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All saves");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [layout, setLayout] = useState<LibraryLayout>("gallery");
  const [librarySaves, setLibrarySaves] = useState<Save[]>(persistedSaves.length ? persistedSaves : saves);
  const [showingSamples, setShowingSamples] = useState(!persistedSaves.length);
  const [syncError, setSyncError] = useState(loadError);
  const [sessionTags, setSessionTags] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const storedTags = window.sessionStorage.getItem("in-orbit-tags");
      return storedTags ? JSON.parse(storedTags) : [];
    } catch {
      return [];
    }
  });
  const [sessionStyleTags, setSessionStyleTags] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const storedTags = window.sessionStorage.getItem("in-orbit-portfolio-styles");
      return storedTags ? JSON.parse(storedTags) : [];
    } catch {
      return [];
    }
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingSave, setEditingSave] = useState<Save | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Save | null>(null);
  const [detailSave, setDetailSave] = useState<Save | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [launchSequence, setLaunchSequence] = useState<number | null>(null);
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = librarySaves
    .filter(save => (category === "All saves" || save.type === category) &&
      [save.title, save.description, save.metadataDescription ?? "", save.source, ...save.tags, ...(save.styleTags ?? [])].join(" ").toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : b.savedAt.localeCompare(a.savedAt));
  const availableTags = useMemo(() => Array.from(new Set([...starterTags, ...librarySaves.flatMap(save => save.tags), ...sessionTags])).sort((a, b) => a.localeCompare(b)), [librarySaves, sessionTags]);
  const availableStyleTags = useMemo(() => Array.from(new Set([...starterPortfolioStyles, ...librarySaves.flatMap(save => save.styleTags ?? []), ...sessionStyleTags])).sort((a, b) => a.localeCompare(b)), [librarySaves, sessionStyleTags]);
  const libraryIsEmpty = !showingSamples && librarySaves.length === 0;

  useEffect(() => () => {
    if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
  }, []);

  const addSave = async (save: Save, createdTags: string[], createdStyleTags: string[]): Promise<CreateSaveResult> => {
    const result = persistenceEnabled
      ? await createSave({
        title: save.title,
        url: save.url ?? "",
        notes: save.description,
        contentType: save.type,
        tags: save.tags,
        styleTags: save.styleTags ?? [],
      })
      : { ok: true as const, save };

    if (!result.ok) return result;

    const saved = result.save;
    setLibrarySaves(current => showingSamples ? [saved] : [saved, ...current]);
    setShowingSamples(false);
    setSyncError(undefined);
    if (createdTags.length) {
      setSessionTags(current => {
        const next = Array.from(new Set([...current, ...createdTags]));
        try { window.sessionStorage.setItem("in-orbit-tags", JSON.stringify(next)); } catch { /* Keep the tags in memory. */ }
        return next;
      });
    }
    if (createdStyleTags.length) {
      setSessionStyleTags(current => {
        const next = Array.from(new Set([...current, ...createdStyleTags]));
        try { window.sessionStorage.setItem("in-orbit-portfolio-styles", JSON.stringify(next)); } catch { /* Keep the styles in memory. */ }
        return next;
      });
    }
    setCategory("All saves");
    setSort("newest");
    setQuery("");
    setAnnouncement(persistenceEnabled ? `${saved.title} was saved.` : `${saved.title} was added for this session.`);
    setLaunchSequence(Date.now());
    if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
    launchTimerRef.current = setTimeout(() => setLaunchSequence(null), 1400);
    return result;
  };

  const editSave = async (save: Save, createdTags: string[], createdStyleTags: string[]): Promise<CreateSaveResult> => {
    const result = await updateSave({
      id: save.id,
      title: save.title,
      url: save.url ?? "",
      notes: save.description,
      contentType: save.type,
      tags: save.tags,
      styleTags: save.styleTags ?? [],
    });

    if (!result.ok) return result;

    const updated = result.save;
    setLibrarySaves(current => current.map(item => item.id === updated.id ? updated : item));
    setDetailSave(current => current?.id === updated.id ? updated : current);
    if (createdTags.length) {
      setSessionTags(current => {
        const next = Array.from(new Set([...current, ...createdTags]));
        try { window.sessionStorage.setItem("in-orbit-tags", JSON.stringify(next)); } catch { /* Keep the tags in memory. */ }
        return next;
      });
    }
    if (createdStyleTags.length) {
      setSessionStyleTags(current => {
        const next = Array.from(new Set([...current, ...createdStyleTags]));
        try { window.sessionStorage.setItem("in-orbit-portfolio-styles", JSON.stringify(next)); } catch { /* Keep the styles in memory. */ }
        return next;
      });
    }
    setAnnouncement(`${updated.title} was updated.`);
    setEditingSave(null);
    return result;
  };

  const removeSave = async (save: Save) => {
    const result = await deleteSave(save.id);
    if (!result.ok) return result;

    setLibrarySaves(current => current.filter(item => item.id !== result.id));
    setDetailSave(current => current?.id === result.id ? null : current);
    setDeleteCandidate(null);
    setAnnouncement(`${save.title} was removed.`);
    return result;
  };

  return (
    <section id="library" aria-labelledby="library-heading" className="library">
      <header className="library-header">
        <div className="title-orbit">
          <h1 id="library-heading">In Orbit</h1>
        </div>
        <p>Things I read, save, revisit, and keep coming back to.</p>
        <div className="view-switcher" role="group" aria-label="Choose a library view">
          <button type="button" aria-pressed={view === "library"} onClick={() => { setView("library"); setQuery(""); }}>Library</button>
          <button type="button" aria-pressed={view === "nebula"} onClick={() => { setView("nebula"); setQuery(""); setDetailSave(null); }}>Images</button>
        </div>
        <label className="search">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
          <span className="sr-only">{view === "library" ? "Search the library" : "Search images and tags"}</span>
          <input type="search" placeholder={view === "library" ? "What would you like to find?" : "Search images and tags"} value={query} onChange={event => setQuery(event.target.value)} />
          {query && <button className="clear-search" type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
        </label>
      </header>

      <div className="library-view" hidden={view !== "library"}>
        <div className="library-controls">
          <div className="categories" role="group" aria-label="Filter by content type">
            {categories.map(item => (
              <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>
              {item}<span>{item === "All saves" ? librarySaves.length : librarySaves.filter(save => save.type === item).length}</span>
              </button>
            ))}
          </div>
          <div className="toolbar">
            <p className="result-count" role="status" aria-live="polite">
              {visible.length} {visible.length === 1 ? "save" : "saves"}<span> · {syncError ? "Sync unavailable" : showingSamples ? "Sample content" : persistenceEnabled ? "Private library" : "Temporary session"}</span>
            </p>
            <div className="layout-switcher" role="group" aria-label="Choose save layout">
              <button type="button" aria-pressed={layout === "gallery"} onClick={() => setLayout("gallery")}>
                <svg viewBox="0 0 18 18" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="11" y="2" width="5" height="5" rx="1"/><rect x="2" y="11" width="5" height="5" rx="1"/><rect x="11" y="11" width="5" height="5" rx="1"/></svg>
                Gallery
              </button>
              <button type="button" aria-pressed={layout === "list"} onClick={() => setLayout("list")}>
                <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 4h12M3 9h12M3 14h12"/></svg>
                List
              </button>
            </div>
            <SelectMenu label="Sort saves" value={sort} options={sortOptions} onChange={setSort} />
            <button className="add-save" type="button" onClick={() => setAddModalOpen(true)}>
              <span aria-hidden="true">＋</span> Add save
            </button>
          </div>
        </div>

        {syncError && <p className="library-sync-error" role="alert">{syncError}</p>}

        {visible.length ? (
          <SaveGrid layout={layout}>
            {visible.map(save => (
              <SaveCard
                key={save.id}
                save={save}
                onOpenDetails={setDetailSave}
                onEdit={!showingSamples && persistenceEnabled ? setEditingSave : undefined}
                onDelete={!showingSamples && persistenceEnabled ? setDeleteCandidate : undefined}
              />
            ))}
          </SaveGrid>
        ) : (
          <CollectionEmptyState
            title={libraryIsEmpty ? "Nothing saved yet." : "Nothing in this orbit yet."}
            description={libraryIsEmpty ? "Add your first link when you find something worth returning to." : "Try another word or browse all saves."}
          >
            <button onClick={() => {
              if (libraryIsEmpty) {
                setAddModalOpen(true);
                return;
              }
              setQuery("");
              setCategory("All saves");
            }}>
              {libraryIsEmpty ? "Add save" : "Clear filters"}
            </button>
          </CollectionEmptyState>
        )}
      </div>
      <Nebula active={view === "nebula"} query={query} />
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {launchSequence && (
        <div key={launchSequence} className="save-launch" aria-hidden="true">
          <span className="save-launch-tail" />
          <span className="save-launch-star">✦</span>
          <i /><i /><i />
        </div>
      )}
      {addModalOpen && <AddSaveModal availableTags={availableTags} availableStyleTags={availableStyleTags} onSave={addSave} onClose={() => setAddModalOpen(false)} />}
      {editingSave && <AddSaveModal initialSave={editingSave} availableTags={availableTags} availableStyleTags={availableStyleTags} onSave={editSave} onClose={() => setEditingSave(null)} />}
      {deleteCandidate && <DeleteSaveDialog save={deleteCandidate} onConfirm={() => removeSave(deleteCandidate)} onClose={() => setDeleteCandidate(null)} />}
      {detailSave && <SaveDetailModal save={detailSave} onClose={() => setDetailSave(null)} />}
    </section>
  );
}
