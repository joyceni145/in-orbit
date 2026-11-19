"use client";

import { useEffect, useRef, useState } from "react";
import type { Save } from "@/content/saves";
import type { DeleteSaveResult } from "@/lib/saves";

type DeleteSaveDialogProps = {
  save: Save;
  onConfirm: () => Promise<DeleteSaveResult>;
  onClose: () => void;
};

export function DeleteSaveDialog({ save, onConfirm, onClose }: DeleteSaveDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deletingRef = useRef(false);
  const closeRef = useRef(onClose);

  useEffect(() => { deletingRef.current = isDeleting; }, [isDeleting]);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => cancelRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deletingRef.current) {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
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

  const confirmDelete = async () => {
    if (isDeleting) return;
    setError("");
    setIsDeleting(true);

    try {
      const result = await onConfirm();
      if (result.ok) return;
      setError(result.error);
    } catch {
      setError("This save could not be deleted. Check your connection and try again.");
    }

    setIsDeleting(false);
  };

  return (
    <div className="modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !isDeleting) onClose();
    }}>
      <div ref={dialogRef} className="delete-save-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-save-title" aria-describedby="delete-save-description">
        <p className="auth-mark" aria-hidden="true">✦</p>
        <h2 id="delete-save-title">Remove this save?</h2>
        <p id="delete-save-description"><strong>{save.title}</strong> will be permanently removed from your private library.</p>
        {error && <p className="delete-save-error" role="alert">{error}</p>}
        <div className="delete-save-actions">
          <button ref={cancelRef} type="button" onClick={onClose} disabled={isDeleting}>Keep save</button>
          <button className="delete-confirm-action" type="button" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? "Removing…" : "Remove save"}</button>
        </div>
      </div>
    </div>
  );
}
