"use client";

import { useLayoutEffect, useRef } from "react";
import { easeOut, expoOut, reducedMotion } from "@/lib/motion";

// Entrance choreography measured from the reference: title letters rise with a slight
// tilt, then the header stats fade up, then the cards lift in, each group staggered.
export function PageEnter({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || reducedMotion()) return;
    const run = (sel: string, frames: Keyframe[], opts: (i: number) => KeyframeAnimationOptions) =>
      el.querySelectorAll(sel).forEach((n, i) => n.animate(frames, { fill: "backwards", ...opts(i) }));

    run('[data-enter="ch"]', [{ transform: "translateY(1.18em) rotate(6deg)" }, { transform: "none" }], (i) => ({
      duration: 900,
      delay: i * 15,
      easing: expoOut,
    }));
    run('[data-enter="stat"]', [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], (i) => ({
      duration: 600,
      delay: 70 + i * 70,
      easing: easeOut,
    }));
    run('[data-enter="card"]', [{ transform: "translateY(22px) scale(0.975)" }, { transform: "none" }], (i) => ({
      duration: 800,
      delay: 30 + Math.min(i, 8) * 60,
      easing: easeOut,
    }));
  }, []);

  return <div ref={root}>{children}</div>;
}
