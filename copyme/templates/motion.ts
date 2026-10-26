// Motion helpers for a rebuild. Replace the example curves with ones measured on the reference
// (see references/motion-capture.md): sample the live animation every frame, convert to progress,
// and paste the [ms, progress] pairs into curve(). Progress above 1 is overshoot.

export function curve(points: [number, number][]) {
  const total = points[points.length - 1][0];
  const stops = points.map(([t, p]) => `${+p.toFixed(3)} ${+((t / total) * 100).toFixed(1)}%`);
  return { easing: `linear(${stops.join(", ")})`, duration: total };
}

// EXAMPLES ONLY — shapes typical of "glass" UIs. Measure the real site and overwrite.
export const panelSpring = curve([
  [0, 0], [10, 0.3], [35, 0.55], [70, 0.74], [110, 0.88], [150, 1], [200, 1.05], [240, 1.07], [300, 1.05], [360, 1.02], [420, 1],
]);
export const modalRise = curve([[0, 0], [60, 0.3], [100, 0.72], [150, 0.92], [200, 1.01], [260, 1.05], [320, 1.06], [380, 1.03], [440, 1.005], [480, 1]]);
export const toastPop = curve([[0, 0], [30, 0.55], [55, 0.95], [120, 1.15], [170, 1.08], [235, 1], [285, 0.98], [385, 0.996], [480, 1.002], [560, 1]]);
export const rowRise = curve([[0, 0], [20, 0.25], [75, 0.55], [125, 0.72], [210, 0.89], [320, 0.98], [400, 1]]);
export const iconSpring = curve([[0, 0], [20, 0.5], [80, 0.92], [150, 1.15], [245, 1.25], [350, 1.15], [460, 1.02], [520, 1]]);

export const easeOut = "cubic-bezier(0.2, 0.8, 0.2, 1)";
export const easeIn = "cubic-bezier(0.55, 0, 0.8, 0.2)";
export const expoOut = "cubic-bezier(0.16, 1, 0.3, 1)";

export const reducedMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Floating panel open: scale up from 0.86 while a top-down clip reveals it. */
export function revealPanel(el: HTMLElement | null, origin = "50% 0", radius = 28) {
  if (!el || reducedMotion()) return;
  el.style.transformOrigin = origin;
  el.animate(
    [
      { transform: "scale(0.86)", clipPath: `inset(0% 0% 100% 0% round ${radius}px)` },
      { transform: "scale(1)", clipPath: `inset(-60px -60px -60px -60px round ${radius}px)` },
    ],
    { duration: panelSpring.duration, easing: panelSpring.easing },
  );
}

/** Small scale "pop" on an icon when its button is pressed. */
export function popIcon(el: Element | null | undefined, from = 0.72) {
  if (!el || reducedMotion()) return;
  el.animate([{ transform: `scale(${from})` }, { transform: "scale(1)" }], { duration: iconSpring.duration, easing: iconSpring.easing });
}

/** Squash-and-stretch press: squash on pointer-down, wobble back on release. Tune to the measured values. */
const squash = { transform: "scale(1.06, 0.92)" };
export function pressDown(el: HTMLElement) {
  if (reducedMotion()) return;
  el.getAnimations().forEach((a) => a.id === "press" && a.cancel());
  const a = el.animate([{ transform: "scale(1, 1)" }, squash], { duration: 90, easing: easeOut, fill: "forwards" });
  a.id = "press";
}
export function pressUp(el: HTMLElement) {
  if (reducedMotion()) return;
  el.getAnimations().forEach((a) => a.id === "press" && a.cancel());
  const a = el.animate(
    [
      { ...squash, offset: 0 },
      { transform: "scale(0.967, 1.047)", offset: 0.25 },
      { transform: "scale(1.011, 0.984)", offset: 0.5 },
      { transform: "scale(0.996, 1.005)", offset: 0.78 },
      { transform: "scale(1, 1)", offset: 1 },
    ],
    { duration: 400, easing: "ease-in-out" },
  );
  a.id = "press";
}
