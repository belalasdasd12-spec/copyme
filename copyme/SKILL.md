---
name: copyme
description: Rebuild a website's front-end from an Enrichr extraction folder as independently written React + Next.js + Tailwind code — every page, every overlay, and motion matched frame-by-frame against the live site, with an authorization review. Use when the user types /copyme and gives (or points to) an Enrichr export folder (it contains manifest.json, REPORT.md, REBUILD.md, styles/used.css, analysis/, screenshots/, original/).
---

# /copyme — from an Enrichr capture to a faithful, independent rebuild

**Usage:** the user runs `/copyme` and provides the path to a folder exported by Enrichr (or drags it
into the chat). Do the whole job end to end without stopping at a plan: analyse → build → compare →
fix → measure motion → finish. The contract is the brief in [references/brief.md](references/brief.md).

**Only for sites the user may rebuild.** Before starting, make sure the target is the user's own site, a site they
have permission to reproduce, or a learning exercise that won't ship the original's brand or content. Always replace
names, logos, artwork and copy with original material, never copy source code, and write an Authorization section
(Phase 5). If the user clearly intends to pass off a copy of someone else's product as genuine, decline.

## Talking to the user
- Reply in the language the user writes in. Short progress lines while working; a clear summary at the end.
- Don't commit to git unless asked. Don't ask permission for routine steps; ask only for real decisions.
- If the user can't run something, run it for them (start the server, open it in a browser) instead of explaining.

## Phase 0 — Set up

1. Locate the Enrichr folder. Read `README.md`, `REPORT.md`, `REBUILD.md`, `manifest.json`, `screenshots/`,
   `analysis/interaction-states.json`, `analysis/responsive.json`, `styles/used.css`, `original/rendered.html`.
2. Create the project in `rebuild/` inside that folder unless the user prefers another location:
   `npx -y create-next-app@15 rebuild --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --no-turbopack --yes`
   then `npm i lucide-react` (ISC-licensed icons).
3. Measuring tools (see [references/setup.md](references/setup.md) if they are missing):
   - **Chrome DevTools MCP** (`mcp__chrome-devtools__*`): `evaluate_script` to sample styles every frame,
     `press_key`, `click`, `take_screenshot`, `select_page`. **Bring the page to the front before any timing work** —
     background tabs throttle animation frames to ~1 fps.
   - **Playwright MCP** (`mcp__playwright__*`) for click-through flows.
   - Batch scripts in [scripts/](scripts/) (Node + `playwright-core`, Python + Pillow). Install once with
     `npm i --prefix <skill-dir>/scripts`.

## Phase 1 — Analyse the capture and the live site

- Copy design-token **values** (colours, radii, shadows, type scale, spacing, easing, durations, breakpoints) into CSS
  variables + Tailwind `@theme inline`. Values are facts; markup and stylesheets are not to be copied.
- Dump a DOM skeleton of `original/rendered.html` (tag.class + text) for the component hierarchy.
- **An Enrichr capture contains only the route it loaded.** SPA routes are lazy chunks and come back empty
  (hidden `<section>`s). Find all routes (`grep -oE '#/[a-z/:${}.]+' assets/js/*`, nav links) and capture the live site
  for each at 1920×1080 and 390×844 with [scripts/live-routes.mjs](scripts/live-routes.mjs).
- Survey every interactive surface on the live site with [scripts/survey-overlays.mjs](scripts/survey-overlays.mjs):
  detail routes, drawers, menus, modals, card "expand", account menu, signed-out screen, shortcut list, toasts,
  empty states. Track coverage with [references/checklist.md](references/checklist.md).

Write a short `PLAN.md` (findings, breakpoints, component tree, interactions, authorization notes), then code.

## Phase 2 — Build

- All code from scratch; original brand name, logo, background artwork, and fictional content.
  Licensed fonts only (e.g. Google Fonts via `next/font`).
- Desktop-first breakpoints mapped to Tailwind `max-*` variants named after the reference's `width <= N` queries.
- Shared pieces: glass utilities, Card (with expand/focus), page header, segmented control with moving indicator,
  chips, charts, menus, modal/drawer, toast, command palette.
- Anything a drawer or modal edits lives in a small shared store (`useSyncExternalStore`) — overlays render outside the
  page, so local state goes stale.
- Read [references/lessons.md](references/lessons.md) for the Next.js/Tailwind traps that cost time before.

## Phase 3 — Compare and fix (repeat until it matches)

1. Element boxes: run the same `getBoundingClientRect` probe on reference and rebuild at 1920 (aim for ≤1 px).
2. Screenshots at 1920 / 1440 / 768 / 390 with [scripts/shoot.mjs](scripts/shoot.mjs), side by side with
   [scripts/pair.py](scripts/pair.py); look at them and fix every visible difference.
3. Real-input tests ([scripts/flows-template.mjs](scripts/flows-template.mjs), [scripts/keys-test.mjs](scripts/keys-test.mjs)):
   every button, filter, drag, form, drawer, menu and shortcut. No page errors, no hydration warnings
   ([scripts/hydration-check.mjs](scripts/hydration-check.mjs)).
4. Headless Chrome has no GPU, so `backdrop-filter` effects are slow there. If a timing test fails only headless,
   re-measure in a real Chrome window through the DevTools MCP before "fixing" it.

## Phase 4 — Match the motion

Follow [references/motion-capture.md](references/motion-capture.md): trigger each interaction on the live site,
sample computed styles every frame ([scripts/recorder.js](scripts/recorder.js)), convert samples to progress, and
encode them as CSS `linear()` easings — don't guess springs. Measure the rebuild the same way and compare.
Starting points: [templates/motion.ts](templates/motion.ts), [templates/PageEnter.tsx](templates/PageEnter.tsx),
[templates/Press.tsx](templates/Press.tsx), [templates/Glint.tsx](templates/Glint.tsx).

If the site uses SVG-refraction "liquid glass", see [references/liquid-glass.md](references/liquid-glass.md) and
[templates/LiquidGlass.tsx](templates/LiquidGlass.tsx). **Apply it only to small chrome surfaces and floating
layers, never to large page cards** — on large cards it can halve scrolling frame rate.

## Phase 5 — Finish

- Scroll performance on every page on a **production** build in real Chrome ([scripts/perf-scroll.js](scripts/perf-scroll.js)); target ~60 fps.
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` clean.
- README with structure, pages, overlays, motion, verification, and **Authorization**: what must not be reproduced
  exactly without the rights holder's permission (name/logo, source CSS/JS, artwork, copy/data, overall trade dress;
  quote any "All rights reserved" notices found in the vendor files).
- Start the production server, open it, and summarise what was built, what was verified, and what is intentionally different.
