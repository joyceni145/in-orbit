"use client";

import { useEffect, useRef } from "react";

type TrailPoint = {
  x: number;
  y: number;
  createdAt: number;
};

const TRAIL_LIFETIME = 440;
const MAX_POINTS = 72;

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reducedMotion.matches || !finePointer.matches) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let points: TrailPoint[] = [];
    let frame = 0;
    let previous: { x: number; y: number } | null = null;

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const addPoint = (event: PointerEvent) => {
      const next = { x: event.clientX, y: event.clientY };
      const now = performance.now();

      if (!previous) {
        points.push({ ...next, createdAt: now });
        previous = next;
        return;
      }

      const distance = Math.hypot(next.x - previous.x, next.y - previous.y);
      if (distance < 1.5) return;

      const steps = Math.min(8, Math.max(1, Math.ceil(distance / 7)));
      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps;
        points.push({
          x: previous.x + (next.x - previous.x) * progress,
          y: previous.y + (next.y - previous.y) * progress,
          createdAt: now,
        });
      }

      points = points.slice(-MAX_POINTS);
      previous = next;
    };

    const resetPointer = () => {
      previous = null;
    };

    const drawSegment = (start: TrailPoint, end: TrailPoint, life: number, glow: boolean) => {
      const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
      if (glow) {
        gradient.addColorStop(0, `rgba(255, 246, 174, ${life * .18})`);
        gradient.addColorStop(1, `rgba(255, 205, 73, ${life * .34})`);
        context.lineWidth = 9 * life + 2;
        context.shadowColor = "rgba(255, 220, 92, 0.58)";
        context.shadowBlur = 14;
      } else {
        gradient.addColorStop(0, `rgba(255, 250, 196, ${life * .88})`);
        gradient.addColorStop(1, `rgba(255, 215, 91, ${life * .82})`);
        context.lineWidth = 1.8 * life + .6;
        context.shadowColor = "rgba(255, 226, 114, 0.72)";
        context.shadowBlur = 6;
      }

      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.strokeStyle = gradient;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      points = points.filter(point => now - point.createdAt < TRAIL_LIFETIME);

      for (const glow of [true, false]) {
        for (let index = 1; index < points.length; index += 1) {
          const end = points[index];
          const life = Math.max(0, 1 - (now - end.createdAt) / TRAIL_LIFETIME);
          drawSegment(points[index - 1], end, life, glow);
        }
      }

      frame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", addPoint, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.documentElement.addEventListener("mouseleave", resetPointer);
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", addPoint);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("mouseleave", resetPointer);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />;
}
