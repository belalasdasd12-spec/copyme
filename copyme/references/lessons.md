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

## Measuring
- **Background tabs** throttle `requestAnimationFrame` to ~1 fps → bring the tab to the front first.
- **Headless Chrome has no GPU** → backdrop filters render slowly; re-check timing in a real window.
- Synthetic `KeyboardEvent('Escape')` doesn't close native `<dialog>`s; send a real key press (MCP `press_key`).
- Warm lazy routes once before timing route transitions, or chunk loading pollutes the numbers.
- DevTools MCP `take_screenshot` with a `filePath` outside the workspace is refused; take inline screenshots.

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
