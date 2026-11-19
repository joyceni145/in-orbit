"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Save } from "@/content/saves";
import type { CreateSaveResult } from "@/lib/saves";

type AddSaveModalProps = {
  availableTags: string[];
  availableStyleTags: string[];
  initialSave?: Save;
  onSave: (save: Save, tags: string[], styleTags: string[]) => Promise<CreateSaveResult>;
  onClose: () => void;
};

function parseWebAddress(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function TagPicker({ availableTags, selectedTags, onChange, onCreate, optionsId, addLabel = "Add tag", searchLabel = "Search or create tags", searchPlaceholder = "Search tags…" }: {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  onCreate: (tag: string) => void;
  optionsId: string;
  addLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filteredTags = availableTags.filter(tag => tag.toLowerCase().includes(query.trim().toLowerCase()));
  const normalizedQuery = query.trim();
  const canCreate = normalizedQuery.length > 0 && !availableTags.some(tag => tag.toLowerCase() === normalizedQuery.toLowerCase());

  useEffect(() => {
    if (!open) return;

    const closeWhenOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", closeWhenOutside);
    window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, [open]);

  const toggleTag = (tag: string) => {
    onChange(selectedTags.includes(tag) ? selectedTags.filter(item => item !== tag) : [...selectedTags, tag]);
  };

  const createTag = () => {
    if (!canCreate) return;
    onCreate(normalizedQuery);
    onChange([...selectedTags, normalizedQuery]);
    setQuery("");
  };

  return (
    <div className="tag-picker" ref={rootRef}>
      <div className="selected-tags">
        {selectedTags.map(tag => (
          <span className="selected-tag" key={tag}>
            {tag}
            <button type="button" onClick={() => toggleTag(tag)} aria-label={`Remove ${tag} tag`}>×</button>
          </span>
        ))}
        <button
          ref={triggerRef}
          className="add-tag-trigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={optionsId}
          onClick={() => setOpen(current => !current)}
        >
          <span aria-hidden="true">＋</span> {addLabel}
        </button>
      </div>

      {open && (
        <div className="tag-popover" onKeyDown={event => {
          if (event.key === "Escape") {
            event.stopPropagation();
            setOpen(false);
            setQuery("");
            window.requestAnimationFrame(() => triggerRef.current?.focus());
          }
        }}>
          <label className="tag-search">
            <span className="sr-only">{searchLabel}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>
            <input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder={searchPlaceholder} />
          </label>
          <div id={optionsId} className="tag-options" role="listbox" aria-label={searchLabel} aria-multiselectable="true">
            {filteredTags.map(tag => {
              const selected = selectedTags.includes(tag);
              return (
                <button key={tag} type="button" role="option" aria-selected={selected} onClick={() => toggleTag(tag)}>
                  <span>{tag}</span>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7" /></svg>
                </button>
              );
            })}
            {!filteredTags.length && !canCreate && <p className="tag-empty">No matching tags</p>}
          </div>
          {canCreate && (
            <button className="create-tag" type="button" onClick={createTag}>
              <span aria-hidden="true">＋</span> Create “{normalizedQuery}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AddSaveModal({ availableTags, availableStyleTags, initialSave, onSave, onClose }: AddSaveModalProps) {
  const editing = Boolean(initialSave);
  const [title, setTitle] = useState(initialSave?.title ?? "");
  const [url, setUrl] = useState(initialSave?.url ?? "");
  const [notes, setNotes] = useState(initialSave?.description ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSave?.tags ?? []);
  const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>(initialSave?.styleTags ?? []);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newStyleTags, setNewStyleTags] = useState<string[]>([]);
  const [urlTouched, setUrlTouched] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const dirtyRef = useRef(false);
  const discardRef = useRef(false);
  const submittingRef = useRef(false);
  const closeRef = useRef(onClose);
  const parsedUrl = useMemo(() => parseWebAddress(url), [url]);
  const isPortfolio = selectedTags.some(tag => tag.toLowerCase() === "portfolio");
  const isDirty = editing
    ? title !== initialSave?.title || url !== initialSave?.url || notes !== initialSave?.description || JSON.stringify(selectedTags) !== JSON.stringify(initialSave?.tags ?? []) || JSON.stringify(selectedStyleTags) !== JSON.stringify(initialSave?.styleTags ?? [])
    : Boolean(title.trim() || url.trim() || notes.trim() || selectedTags.length || selectedStyleTags.length);
  const allTags = useMemo(() => Array.from(new Set([...availableTags, ...newTags])).sort((a, b) => a.localeCompare(b)), [availableTags, newTags]);
  const allStyleTags = useMemo(() => Array.from(new Set([...availableStyleTags, ...newStyleTags])).sort((a, b) => a.localeCompare(b)), [availableStyleTags, newStyleTags]);
  const suggestedTitle = parsedUrl?.hostname.replace(/^www\./, "") ?? "";

  useEffect(() => { dirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { discardRef.current = showDiscard; }, [showDiscard]);
  useEffect(() => { submittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  const finishClose = () => onClose();
  const requestClose = () => {
    if (isSubmitting) return;
    if (isDirty) {
      setShowDiscard(true);
      return;
    }
    finishClose();
  };

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => urlInputRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (submittingRef.current) return;
        if (event.target instanceof Element && event.target.closest(".tag-popover")) return;
        event.preventDefault();
        if (discardRef.current) setShowDiscard(false);
        else if (dirtyRef.current) setShowDiscard(true);
        else closeRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(element => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUrlTouched(true);
    if (!parsedUrl || isSubmitting) return;

    setSubmitError("");
    setIsSubmitting(true);
    let result: CreateSaveResult;
    try {
      result = await onSave({
        id: initialSave?.id ?? `save-${Date.now()}`,
        title: title.trim() || suggestedTitle,
        type: "Websites",
        source: suggestedTitle,
        description: notes.trim(),
        tags: selectedTags,
        styleTags: isPortfolio && selectedStyleTags.length ? selectedStyleTags : undefined,
        savedAt: initialSave?.savedAt ?? new Date().toISOString(),
        artwork: initialSave?.artwork ?? "orbits",
        url: parsedUrl.toString(),
      }, newTags, isPortfolio ? newStyleTags : []);
    } catch {
      setSubmitError("This save could not be added. Check your connection and try again.");
      setIsSubmitting(false);
      return;
    }

    if (!result.ok) {
      setSubmitError(result.error);
      setIsSubmitting(false);
      return;
    }

    finishClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) requestClose();
    }}>
      <div ref={dialogRef} className="add-save-modal" role="dialog" aria-modal="true" aria-labelledby="add-save-title" aria-describedby="add-save-description">
        <header className="modal-header">
          <div>
            <h2 id="add-save-title">{editing ? "Edit save" : "Add save"}</h2>
            <p id="add-save-description">{editing ? "Update the details you want to return to." : "Keep a link, an idea, or a useful find in your orbit."}</p>
          </div>
          <button className="modal-close" type="button" onClick={finishClose} aria-label="Close add save modal" disabled={isSubmitting}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <div className="form-fields">
            <label className="form-field">
              <span>Title <small>Optional</small></span>
              <input value={title} onChange={event => setTitle(event.target.value)} placeholder={suggestedTitle || "Give it a title"} />
            </label>

            <label className="form-field">
              <span>URL</span>
              <input
                ref={urlInputRef}
                type="url"
                inputMode="url"
                required
                value={url}
                aria-invalid={urlTouched && !parsedUrl}
                aria-describedby={urlTouched && !parsedUrl ? "url-error" : undefined}
                onBlur={() => setUrlTouched(true)}
                onChange={event => setUrl(event.target.value)}
                placeholder="https://example.com"
              />
              {urlTouched && !parsedUrl && <small id="url-error" className="field-error">Enter a valid web address.</small>}
            </label>

            <label className="form-field">
              <span>Description / notes <small>Optional</small></span>
              <textarea rows={4} value={notes} onChange={event => setNotes(event.target.value)} placeholder="What makes this worth keeping?" />
            </label>

            <fieldset className="form-field tag-field">
              <legend>Tags <small>Optional</small></legend>
              <TagPicker
                availableTags={allTags}
                selectedTags={selectedTags}
                onChange={tags => {
                  setSelectedTags(tags);
                  if (!tags.some(tag => tag.toLowerCase() === "portfolio")) setSelectedStyleTags([]);
                }}
                onCreate={tag => setNewTags(current => [...current, tag])}
                optionsId="tag-options"
              />
            </fieldset>

            {isPortfolio && (
              <fieldset className="form-field tag-field portfolio-style-field">
                <legend>Portfolio style <small>Optional</small></legend>
                <p className="field-help">Describe the visual qualities you want to find again.</p>
                <TagPicker
                  availableTags={allStyleTags}
                  selectedTags={selectedStyleTags}
                  onChange={setSelectedStyleTags}
                  onCreate={tag => setNewStyleTags(current => [...current, tag])}
                  optionsId="portfolio-style-options"
                  addLabel="Add style"
                  searchLabel="Search or create portfolio styles"
                  searchPlaceholder="Search styles…"
                />
              </fieldset>
            )}
          </div>

          {showDiscard && (
            <div className="discard-confirmation" role="alert">
              <div><strong>Discard this save?</strong><span>Your entries will be cleared.</span></div>
              <div>
                <button type="button" onClick={() => setShowDiscard(false)}>Keep editing</button>
                <button className="discard-button" type="button" onClick={finishClose}>Discard</button>
              </div>
            </div>
          )}

          {submitError && <p className="submit-error" role="alert">{submitError}</p>}

          <footer className="modal-actions">
            <button className="secondary-action" type="button" onClick={requestClose} disabled={isSubmitting}>Cancel</button>
            <button className="primary-action" type="submit" disabled={!parsedUrl || isSubmitting}>
              <span>{isSubmitting ? "Saving…" : editing ? "Update save" : "Send into orbit"}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path className="cta-star" d="m17.4 2.8 1.2 3.4 3.6.2-2.8 2.2.9 3.5-2.9-2-2.9 2 .9-3.5-2.8-2.2 3.5-.2 1.3-3.4Z" />
                <path className="cta-trail" d="M3.1 14.3c3.1-3.4 6.2-5.4 9.2-6.1" />
                <path className="cta-trail" d="M4.1 18.1c2.5-3.3 5-5.4 7.5-6.4" />
                <path className="cta-trail" d="M8.2 20.4c1.2-2.6 2.6-4.3 4-5.2" />
              </svg>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
