"use client";

import { useEffect } from "react";

// Moves the soft highlight on whichever glass surface is under the pointer.
export function Glint() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    const reset = (el: HTMLElement | null) => {
      el?.style.removeProperty("--gx");
      el?.style.removeProperty("--gy");
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(".glass") ?? null;
      if (el !== current) {
        reset(current);
        current = el;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--gx", `${e.clientX - r.left}px`);
      el.style.setProperty("--gy", `${e.clientY - r.top}px`);
    };
    const onLeave = () => {
      reset(current);
      current = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
