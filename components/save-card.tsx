"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { Save } from "@/content/saves";

const cardTypeLabels: Record<string, string> = {
  Books: "Book",
  Articles: "Article",
  Websites: "Website",
  Videos: "Video",
  Tools: "Tool",
  Portfolio: "Portfolio",
};

type SaveCardProps = {
  save: Save;
  onOpenDetails: (save: Save) => void;
  onEdit?: (save: Save) => void;
  onDelete?: (save: Save) => void;
};

function SaveActionsMenu({ save, onEdit, onDelete }: { save: Save; onEdit: (save: Save) => void; onDelete: (save: Save) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus());
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const moveFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    if (!items.length) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div className="save-actions" ref={rootRef}>
      <button
        ref={triggerRef}
        className="save-actions-trigger"
        type="button"
        aria-label={`Manage ${save.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="10" r="1.25"/><circle cx="10" cy="10" r="1.25"/><circle cx="16" cy="10" r="1.25"/></svg>
      </button>
      {open && (
        <div ref={menuRef} className="save-actions-menu" role="menu" aria-label={`Actions for ${save.title}`} onKeyDown={moveFocus}>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(save); }}>Edit save</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onDelete(save); }}>Delete save</button>
        </div>
      )}
    </div>
  );
}

export function SaveCard({ save, onOpenDetails, onEdit, onDelete }: SaveCardProps) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);

  useEffect(() => {
    const description = descriptionRef.current;
    if (!description) return;

    const checkTruncation = () => {
      setDescriptionTruncated(description.scrollHeight > description.clientHeight + 1);
    };

    let active = true;
    const frame = window.requestAnimationFrame(checkTruncation);
    document.fonts.ready.then(() => {
      if (active) checkTruncation();
    });
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(description);
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [save.description, save.metadataDescription]);

  const displayDescription = save.description || save.metadataDescription || "";
  const opensDetails = (Boolean(save.description) && descriptionTruncated) || !save.url;
  const visibleTags = [...save.tags, ...(save.styleTags ?? [])];
  const actionLabel = opensDetails ? `Read notes for ${save.title}` : `Open ${save.title} in a new tab`;
  const typeLabel = cardTypeLabels[save.type] ?? save.type;

  return (
    <article className="save-card">
      {onEdit && onDelete && <SaveActionsMenu save={save} onEdit={onEdit} onDelete={onDelete} />}
      <div className={`artwork artwork-${save.artwork}${save.previewImageUrl ? " artwork-has-image" : ""}`} aria-hidden="true">
        {save.previewImageUrl ? (
          <img className="artwork-image" src={save.previewImageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <>
            {save.artwork === "book" && <div className="book-cover"><span>A field guide</span><strong>Attention</strong><i /></div>}
            {save.artwork === "orbits" && <div className="orbital-preview"><i /><i /><i /></div>}
            {save.artwork === "type" && <div className="paper-preview"><i /><i /><i /><span /></div>}
            {save.artwork === "landscape" && <><i /><i /></>}
            {save.artwork === "diagram" && <div className="diagram"><i /><i /><i /><i /><i /></div>}
            {save.artwork === "moon" && <i />}
          </>
        )}
      </div>
      <div className="card-content">
        <span className="type-tag">{typeLabel}</span>
        <h2>{save.title}</h2>
        {displayDescription && <p ref={descriptionRef}>{displayDescription}</p>}
        {opensDetails && save.description && <span className="card-note-cue" aria-hidden="true">View full notes</span>}
        {visibleTags.length ? <ul className="tags" aria-label="Tags">{visibleTags.map(tag => <li key={tag}>{tag}</li>)}</ul> : null}
      </div>

      {opensDetails ? (
        <button className="card-open-target" type="button" onClick={() => onOpenDetails(save)} aria-label={actionLabel} />
      ) : (
        <a className="card-open-target" href={save.url} target="_blank" rel="noreferrer" aria-label={actionLabel} />
      )}
    </article>
  );
}
