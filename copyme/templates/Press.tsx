"use client";

import { useEffect } from "react";
import { pressDown, pressUp } from "@/lib/motion";

// Pill and round buttons squash when pressed and wobble back on release, like the reference.
// Tabs (they ride under the lens) and list rows are left alone.
const target = (e: Event) => {
  const el = (e.target as Element | null)?.closest?.<HTMLElement>("button.rounded-full, a.rounded-full, [data-press]");
  if (!el || el.closest("nav[data-main-nav]") || el.hasAttribute("disabled")) return null;
  return el;
};

export function Press() {
  useEffect(() => {
    let held: HTMLElement | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      held = target(e);
      if (held) pressDown(held);
    };
    const up = () => {
      if (held) pressUp(held);
      held = null;
    };
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointercancel", up, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
    };
  }, []);
  return null;
}
