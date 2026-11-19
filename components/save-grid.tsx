"use client";

import { useEffect, useRef, type ReactNode } from "react";

type SaveGridProps = {
  children: ReactNode;
  layout: "gallery" | "list";
};

export function SaveGrid({ children, layout }: SaveGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || layout !== "gallery") return;

    let active = true;
    let frame: number | null = null;
    const observedItems = new Set<HTMLElement>();

    const measureItem = (item: HTMLElement) => {
      const gap = Number.parseFloat(window.getComputedStyle(item).marginBottom) || 0;
      const height = item.getBoundingClientRect().height;
      item.style.gridRowEnd = `span ${Math.ceil(height + gap)}`;
    };

    const measureAll = () => {
      frame = null;
      const items = Array.from(grid.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
      items.forEach(measureItem);
      grid.dataset.masonryReady = "true";
    };

    const scheduleMeasure = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureAll);
    };

    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => measureItem(entry.target as HTMLElement));
    });

    const observeItems = () => {
      observedItems.forEach(item => {
        if (grid.contains(item)) return;
        resizeObserver.unobserve(item);
        observedItems.delete(item);
      });
      Array.from(grid.children).forEach(child => {
        if (!(child instanceof HTMLElement) || observedItems.has(child)) return;
        observedItems.add(child);
        resizeObserver.observe(child);
      });
      scheduleMeasure();
    };

    const mutationObserver = new MutationObserver(observeItems);
    mutationObserver.observe(grid, { childList: true });
    observeItems();
    document.fonts.ready.then(() => {
      if (active) scheduleMeasure();
    });

    return () => {
      active = false;
      if (frame !== null) window.cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      delete grid.dataset.masonryReady;
      observedItems.forEach(item => item.style.removeProperty("grid-row-end"));
    };
  }, [layout]);

  return (
    <div ref={gridRef} className={`save-grid save-grid-${layout}`}>
      {children}
    </div>
  );
}
