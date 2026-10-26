# Matching motion exactly (interactive reverse engineering)

Static Enrichr data reports "0 animations" for most SPAs: the motion only happens on interaction and is usually
JS-driven (inline style writes every frame). Measure it live.

## 1. Find what moves
Install the recorder in the live page (`scripts/recorder.js`, paste via `evaluate_script`). It:
- starts a MutationObserver (childList + class/style/open/hidden/aria-expanded) to learn which elements appear/change,
- calls your trigger (e.g. `document.querySelector('<create button selector>').click()`),
- samples `getComputedStyle` every animation frame for the touched elements (or a selector you pass):
  opacity, transform (decomposed to scale/x/y), clip-path, filter, visibility,
- returns `{appeared, tracks}` with only the frames where values changed.

Also collect `document.getAnimations()` for CSS animations/transitions (name, duration, delay, easing, keyframes).
If both are empty and the inline `style` changes per frame, it's a JS tween/spring → sample it.

For keys that a native `<dialog>` handles (Escape), use the MCP `press_key`, not a synthetic KeyboardEvent:
arm a rAF sampler in the page first, press the key, then read the samples back.

Always `select_page({ pageId, bringToFront: true })` before sampling. Warm routes first (visit once) so lazy chunk
loading doesn't pollute the timing of page transitions.

## 2. Turn samples into curves
For each property compute progress `p = (value - from) / (to - from)` at each sample time `t` (relative to the first
frame that moved). Overshoot shows as `p > 1`. Encode the samples directly:

```ts
function curve(points: [number, number][]) {           // [ms, progress]
  const total = points[points.length - 1][0];
  return { duration: total, easing: `linear(${points.map(([t, p]) => `${p} ${(t / total * 100).toFixed(1)}%`).join(", ")})` };
}
```
Use `el.animate(keyframes, { duration, easing })`. Sampled curves reproduce JS springs within a few ms; simulated
springs usually don't (they start too slow and wobble too long).

## 3. Measure the rebuild the same way and compare
Run the identical sampler on the rebuild, compare peak value/time and settle time. Reachable tolerances:
peak within ~20 ms, settle within ~10 ms, values within 0.005.

## 4. Things to always check on a new site
- Search/command palette open + rows stagger + trigger icon pop; close (often instant).
- Route change: does the old view exit? letters/stats/cards entrance; tab indicator behaviour and latency.
- Menus/popovers (origin at the trigger), modals, drawers (side + mobile sheet), toast show/hide, card expand.
- Press/hover states: `analysis/interaction-states.json` shows captured `:active` transforms (e.g. scale(0.97,1.04)
  means a squash-and-stretch "jelly" press) — then measure the real dynamics with pointerdown/up.
- Theme switch, checkboxes, meters (often instant — don't add motion the reference doesn't have).
- Tooltips (dock tips fade 180 ms), chart hover crosshair/tooltip.

## 5. Implementation pattern
- `lib/motion.ts`: measured curves + helpers (`revealPanel`, `popIcon`, `pressDown/Up`).
- `app/template.tsx` → `<PageEnter>` that animates `[data-enter=ch|stat|card]` with fill "backwards".
- Overlays animate in `useLayoutEffect` on mount; closing runs the exit animation then unmounts.
- Global `<Press>` listener for squash on `button.rounded-full, a.rounded-full, [data-press]`, excluding tabs.
- Respect `prefers-reduced-motion`.
