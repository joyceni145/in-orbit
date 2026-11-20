"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nebulaSamples, type NebulaImage } from "@/content/nebula";
import { CollectionEmptyState } from "./collection-empty-state";

type NebulaProps = {
  active: boolean;
  query: string;
};

const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function isTypingTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

function NebulaDetailModal({ image, onClose, onDelete }: { image: NebulaImage; onClose: () => void; onDelete: (image: NebulaImage) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmDeleteButtonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  const confirmDeleteRef = useRef(false);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => { confirmDeleteRef.current = confirmDelete; }, [confirmDelete]);
  useEffect(() => {
    if (confirmDelete) window.requestAnimationFrame(() => confirmDeleteButtonRef.current?.focus());
  }, [confirmDelete]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (confirmDeleteRef.current) setConfirmDelete(false);
        else closeRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter(element => element.offsetParent !== null);
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
    <div className="modal-backdrop nebula-detail-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div ref={dialogRef} className="nebula-detail-modal" role="dialog" aria-modal="true" aria-labelledby="nebula-detail-title">
        <header className="nebula-detail-header">
          <div>
            <p>{image.temporary ? "Temporary session image" : "Visual study"}</p>
            <h2 id="nebula-detail-title">{image.alt}</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close image preview">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
          </button>
        </header>
        <div className="nebula-detail-image">
          <Image src={image.src} alt={image.alt} width={image.width} height={image.height} unoptimized />
        </div>
        {confirmDelete && (
          <p className="nebula-delete-message" id="nebula-delete-message" role="status">
            {image.temporary
              ? "Delete this temporary image? It only exists for this session and cannot be restored."
              : "Delete this image from the current session? It will return when the page is refreshed."}
          </p>
        )}
        <footer className="nebula-detail-footer">
          <ul aria-label="Image tags">{image.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          <div className="nebula-detail-actions">
            {confirmDelete ? (
              <>
                <button type="button" onClick={() => setConfirmDelete(false)}>Keep image</button>
                <button ref={confirmDeleteButtonRef} className="nebula-delete-confirm" type="button" onClick={() => onDelete(image)} aria-describedby="nebula-delete-message">Delete</button>
              </>
            ) : (
              <>
                <button className="nebula-delete-trigger" type="button" onClick={() => setConfirmDelete(true)}>Delete image</button>
                <button className="nebula-detail-close" type="button" onClick={onClose}>Close</button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export function Nebula({ active, query }: NebulaProps) {
  const [images, setImages] = useState<NebulaImage[]>(nebulaSamples);
  const [selectedTag, setSelectedTag] = useState("All images");
  const [selectedImage, setSelectedImage] = useState<NebulaImage | null>(null);
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const objectUrlsRef = useRef(new Set<string>());

  const addLocalImage = useCallback(async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setNotice("Choose a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setNotice("That image is larger than 15 MB. Try a smaller file for this prototype.");
      return;
    }

    const src = URL.createObjectURL(file);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const preview = new window.Image();
        preview.onload = () => resolve({ width: preview.naturalWidth, height: preview.naturalHeight });
        preview.onerror = () => reject(new Error("The image could not be previewed."));
        preview.src = src;
      });
      const id = `nebula-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const image: NebulaImage = {
        id,
        src,
        alt: file.name.replace(/\.[^.]+$/, "") || "Pasted image",
        tags: [],
        width: dimensions.width,
        height: dimensions.height,
        createdAt: new Date().toISOString(),
        temporary: true,
      };
      objectUrlsRef.current.add(src);
      setImages(current => [image, ...current]);
      setSelectedTag("All images");
      setPendingTagId(id);
      setTagDraft("");
      setNotice("Added for this session only. Add a tag or keep browsing.");
    } catch {
      URL.revokeObjectURL(src);
      setNotice("That image could not be previewed.");
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const handlePaste = (event: ClipboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const item = Array.from(event.clipboardData?.items ?? []).find(entry => entry.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (!file) {
        setNotice("No image was found on the clipboard.");
        return;
      }
      event.preventDefault();
      void addLocalImage(file);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [active, addLocalImage]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const tags = useMemo(() => ["All images", ...Array.from(new Set(images.flatMap(image => image.tags))).sort((a, b) => a.localeCompare(b))], [images]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleImages = images.filter(image =>
    (selectedTag === "All images" || image.tags.includes(selectedTag)) &&
    (!normalizedQuery || [image.alt, ...image.tags].join(" ").toLowerCase().includes(normalizedQuery))
  );

  const addTag = (id: string) => {
    const tag = tagDraft.trim();
    if (!tag) return;
    setImages(current => current.map(image => image.id === id && !image.tags.some(item => item.toLowerCase() === tag.toLowerCase())
      ? { ...image, tags: [...image.tags, tag] }
      : image));
    setTagDraft("");
    setNotice(`Added the “${tag}” tag for this session.`);
  };

  const deleteImage = (image: NebulaImage) => {
    const remainingImages = images.filter(item => item.id !== image.id);
    setImages(remainingImages);
    if (selectedTag !== "All images" && !remainingImages.some(item => item.tags.includes(selectedTag))) {
      setSelectedTag("All images");
    }
    if (image.src.startsWith("blob:")) {
      URL.revokeObjectURL(image.src);
      objectUrlsRef.current.delete(image.src);
    }
    if (pendingTagId === image.id) {
      setPendingTagId(null);
      setTagDraft("");
    }
    setSelectedImage(null);
    setNotice(`Removed “${image.alt}” from this session.`);
  };

  const hasFiles = (event: React.DragEvent) => event.dataTransfer.types.includes("Files");

  return (
    <section
      className={`nebula${dragActive ? " is-dragging" : ""}`}
      aria-labelledby="nebula-heading"
      hidden={!active}
      onDragEnter={event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        dragDepthRef.current += 1;
        setDragActive(true);
      }}
      onDragOver={event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={event => {
        if (!hasFiles(event)) return;
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (!dragDepthRef.current) setDragActive(false);
      }}
      onDrop={event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        dragDepthRef.current = 0;
        setDragActive(false);
        const file = Array.from(event.dataTransfer.files).find(item => item.type.startsWith("image/"));
        if (!file) {
          setNotice("Choose a PNG, JPG, or WebP image.");
          return;
        }
        void addLocalImage(file);
      }}
    >
      <h2 className="sr-only" id="nebula-heading">Images</h2>
      <div className="nebula-heading-row">
        <div>
          <p>Paste or drop an image anywhere.</p>
          <span>PNG, JPG, or WebP · New images stay in this browser tab.</span>
        </div>
        <p className="nebula-count" role="status" aria-live="polite">{visibleImages.length} {visibleImages.length === 1 ? "image" : "images"}<span> · Prototype only</span></p>
      </div>

      <div className="nebula-filters" role="group" aria-label="Filter images by tag">
        {tags.map(tag => (
          <button key={tag} type="button" aria-pressed={selectedTag === tag} onClick={() => setSelectedTag(tag)}>{tag}</button>
        ))}
      </div>

      {notice && <p className="nebula-notice" role="status">{notice}</p>}

      {visibleImages.length ? (
        <div className="nebula-collage">
          {visibleImages.map(image => (
            <figure className="nebula-item" key={image.id}>
              <button className="nebula-image-button" type="button" onClick={() => setSelectedImage(image)} aria-label={`Enlarge ${image.alt}`}>
                <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 25vw" unoptimized />
                {image.temporary && <span>Temporary</span>}
              </button>
              {image.tags.length > 0 && <ul className="nebula-item-tags" aria-label="Image tags">{image.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
              {pendingTagId === image.id && (
                <form className="nebula-tag-prompt" onSubmit={event => { event.preventDefault(); addTag(image.id); }}>
                  <label>
                    <span className="sr-only">Add a tag to {image.alt}</span>
                    <input value={tagDraft} onChange={event => setTagDraft(event.target.value)} placeholder="Add an optional tag…" autoFocus />
                  </label>
                  <button type="submit" disabled={!tagDraft.trim()}>Add</button>
                  <button type="button" onClick={() => { setPendingTagId(null); setTagDraft(""); }}>Done</button>
                </form>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <CollectionEmptyState
          title={images.length ? "Nothing matches this view." : "No images yet."}
          description={images.length ? "Try another search or tag." : "Paste or drop an image anywhere to begin."}
          headingLevel="h3"
        >
          {images.length > 0 && <button type="button" onClick={() => setSelectedTag("All images")}>Show all images</button>}
        </CollectionEmptyState>
      )}

      {dragActive && (
        <div className="nebula-drop-overlay" aria-hidden="true">
          <CollectionEmptyState title="Drop image here." description="Release to add this image for the current session." headingLevel="h3" />
        </div>
      )}
      {selectedImage && <NebulaDetailModal image={selectedImage} onClose={() => setSelectedImage(null)} onDelete={deleteImage} />}
    </section>
  );
}
