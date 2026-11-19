"use client";

import { useEffect, useRef } from "react";
import type { Save } from "@/content/saves";

type SaveDetailModalProps = {
  save: Save;
  onClose: () => void;
};

export function SaveDetailModal({ save, onClose }: SaveDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
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

  return (
    <div className="modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div ref={dialogRef} className="save-detail-modal" role="dialog" aria-modal="true" aria-labelledby="save-detail-title">
        <header className="detail-modal-header">
          <div>
            <p>{save.source} · {save.type.slice(0, -1)}</p>
            <h2 id="save-detail-title">{save.title}</h2>
          </div>
          <button ref={closeButtonRef} className="detail-modal-close" type="button" onClick={onClose} aria-label="Close save details">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
          </button>
        </header>

        <div className="detail-notes">
          <span>Notes</span>
          <p>{save.description}</p>
        </div>

        <div className="detail-taxonomy">
          <div>
            <span>Tags</span>
            <ul className="tags" aria-label="Tags">{save.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          </div>
          {save.styleTags?.length ? (
            <div>
              <span>Portfolio style</span>
              <ul className="tags" aria-label="Portfolio styles">{save.styleTags.map(tag => <li key={tag}>{tag}</li>)}</ul>
            </div>
          ) : null}
        </div>

        <footer className="detail-modal-actions">
          <button type="button" onClick={onClose}>Close</button>
          {save.url && (
            <a href={save.url} target="_blank" rel="noreferrer">
              View original
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" /></svg>
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}
