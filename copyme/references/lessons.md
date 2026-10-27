# Lessons from real runs — traps that cost time

## Next.js / Tailwind v4
- **Font not applied:** put the `next/font` variable class on `<html>`, not `<body>`; `@theme` variables resolve at `:root`.
- **Custom text sizes** in `@theme` need a matching `--text-<name>--line-height`, or line heights come out wrong.
- **"Attempted to call X() from the server"** during build: a server component imported a helper from a
  `"use client"` module. Make that component a client component too.
- **`useSearchParams`** in a page → wrap the page in `<Suspense>`, or the static build fails.
- **Hydration mismatch** when code sets inline styles on elements inside Suspense boundaries before they hydrate.
  Start such enhancements after `load` + a short delay.
- **Deep links repeated on the same route** (`/inbox?next=1` twice) don't re-run effects. Add a changing value
  (`?next=${Date.now()}`).
- Overlays rendered from a provider capture stale closures → keep shared state in a store.
- Tailwind v4 preflight sets `margin: 0` on everything → native `<dialog>` loses its auto-centring; set `margin: auto`.
- SVG coordinates computed with `Math.sin`/`Math.cos` can differ between server and browser → round them (hydration).
- `ResizeObserver` callbacks can fire after unmount → guard refs.
- Seeded timestamps must be clamped to "now", or relative times read "in 3 hours".
- Sections with sub-tabs: keep the section head in a `layout.tsx` so it doesn't replay its entrance between tabs (the
  reference usually re-enters only the tab body), and skip the page-exit animation within a section.

## Measuring
- **Background tabs** throttle `requestAnimationFrame` to ~1 fps → bring the tab to the front first.
- **Headless Chrome has no GPU** → backdrop filters render slowly; re-check timing in a real window.
- Synthetic `KeyboardEvent('Escape')` doesn't close native `<dialog>`s; send a real key press (MCP `press_key`).
- Warm lazy routes once before timing route transitions, or chunk loading pollutes the numbers.
- DevTools MCP `take_screenshot` with a `filePath` outside the workspace is refused; take inline screenshots.
- **Look for a tween library before sampling frames.** If the bundle ships GSAP, its `fromTo`/`to` calls hold the exact
  durations, eases and staggers; replaying them with the same library matched frame samples on the first try.
- The first fps reading after a cold load can be low; re-measure warm before chasing it.

## Capture coverage
- Enrichr reports "0 animations" for most SPAs — the motion is JS-driven and only happens on interaction.
- The capture holds one route. Detail routes (`#/items/:id`), drawers, menus, sign-in and shortcut screens are only
  discoverable by clicking through the live site.
- `analysis/interaction-states.json` reveals press/hover styling (e.g. `:active` `scale(0.97, 1.04)` = a squash-and-
  stretch press) — then measure the actual dynamics.

## Performance
- `backdrop-filter: url(#svg-filter)` on large surfaces is the usual cause of janky scrolling. Restrict it.
- Evaluate speed on a production build (`npm run build && npm start`), not the dev server.

## Workflow
- If the dev server suddenly fails with `MODULE_NOT_FOUND`, check the project folder wasn't moved or deleted before
  reinstalling anything.
- Don't add motion the reference doesn't have (theme switches and checkboxes are often instant).
- Tune the seeded data so each page tells the same "story" as the reference (goal %, pace, counts of items waiting).
- Biggest token costs are whole-file reads of the capture, full-size screenshots and long tool outputs — use the
  summary, numeric diffs with crops, brief recorder output and the single verify gate.
