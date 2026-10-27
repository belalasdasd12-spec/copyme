---
name: copyme
description: Rebuild a website's front-end from an Enrichr extraction folder as independently written React + Next.js + Tailwind code — every page, every overlay, and motion matched frame-by-frame against the live site, with an authorization review. Use when the user types /copyme and gives (or points to) an Enrichr export folder (it contains manifest.json, REPORT.md, REBUILD.md, styles/used.css, analysis/, screenshots/, original/).
---

# /copyme — from an Enrichr capture to a faithful, independent rebuild

**Usage:** the user runs `/copyme` and provides the path to a folder exported by Enrichr (or drags it
into the chat). Do the whole job end to end without stopping at a plan: analyse → build → compare →
fix → measure motion → finish. The contract is the brief in [references/brief.md](references/brief.md).

**Claude does not install, connect or run Enrichr.** Enrichr needs a subscription after the first use, so the user
runs it themselves (anywhere, on any machine or account) and hands over the finished extraction folder — simpler and
cheaper than having Claude drive it. Always start from that folder; if something is missing from the capture, fill
the gap from the live site with the scripts below, not by re-running Enrichr.

**Only for sites the user may rebuild.** Before starting, make sure the target is the user's own site, a site they
have permission to reproduce, or a learning exercise that won't ship the original's brand or content. Always replace
names, logos, artwork and copy with original material, never copy source code, and write an Authorization section
(Phase 5). If the user clearly intends to pass off a copy of someone else's product as genuine, decline.

## Fidelity first, then speed

Matching the reference exactly is the goal. Every saving below keeps the run cheap in time and tokens and comes with a
guard that protects fidelity — never drop the guard.

| Saving | Guard |
|---|---|
| Read `analysis/copyme-summary.md` ([scripts/analyse.mjs](scripts/analyse.mjs)), never `rendered.html` / `used.css` / JS bundles whole | `grep` the raw files for any detail the summary lacks |
| Compare screenshots by numbers ([scripts/diff.py](scripts/diff.py)) and open only the crops it saves | Strict threshold (18); before finishing, look at every page once at full size |
| Iterate at 1920 + 390 only (`shoot.mjs … desktop,mobile`) | Final pass at all four widths (`all`) is mandatory before "done" |
| Look at overview screenshots at half scale | Crops of small details (1 px borders, icon alignment, text weight) at full scale |
| Take motion values from the reference's own scripts (the summary lists tween libraries and calls) | Confirm one interaction of each kind with the recorder; with no library, sample every interaction |
| Recorder in brief mode (~1 sample / 40 ms + every peak and dip) | `brief = false` when a curve has overshoot or wobble that must be encoded precisely |
| Batch flows in one script instead of many MCP clicks | Real Chrome via the DevTools MCP for timing, fps and anything that only fails headless |
| Clone a cached base project ([scripts/new-project.sh](scripts/new-project.sh)) | The base rebuilds itself after 30 days; templates are references — adapt them |
| One gate ([scripts/verify.mjs](scripts/verify.mjs)) that prints only failures | It still runs everything: tsc, eslint, build, every route at 1920 + 390 for console/hydration errors |
| Parallel subagents for pages (Phase 2) | **Same model as the main session, never a cheaper one**; every page is diffed before it is accepted |

If earlier runs recorded measured motion numbers for the **same vendor** (check the rights notice and host in the
summary), start from them and confirm with one measurement. For any other vendor ignore them — they would mislead.

## Talking to the user
- Reply in the language the user writes in. Short progress lines while working; a clear summary at the end.
- Don't commit to git unless asked. Don't ask permission for routine steps; ask only for real decisions.
- If the user can't run something, run it for them (start the server, open it in a browser) instead of explaining.

## Phase 0 — Set up

1. Locate the Enrichr folder. Run `node <skill-dir>/scripts/analyse.mjs <folder>` and read
   `analysis/copyme-summary.md` (rights notice, motion libraries + tween calls, routes and empty views, tokens, media
   queries, DOM skeleton, file list). Then read `REBUILD.md`, the screenshots (half scale), and
   `analysis/interaction-states.json` / `responsive.json` when needed.
2. Create the project in `rebuild/` inside that folder unless the user prefers another location:
   `bash <skill-dir>/scripts/new-project.sh <folder>/rebuild` — Next 15 + Tailwind v4 + lucide-react (ISC icons) + gsap,
   cloned from a cached base in seconds after the first run.
3. Measuring tools (see [references/setup.md](references/setup.md) if they are missing):
   - **Chrome DevTools MCP** (`mcp__chrome-devtools__*`): `evaluate_script` to sample styles every frame,
     `press_key`, `click`, `take_screenshot`, `select_page`. **Bring the page to the front before any timing work** —
     background tabs throttle animation frames to ~1 fps.
   - **Playwright MCP** (`mcp__playwright__*`) for click-through flows.
   - Batch scripts in [scripts/](scripts/) (Node + `playwright-core`, Python + Pillow). Install once with
     `npm i --prefix <skill-dir>/scripts`. Prefer them for batch work; keep the MCP tools for real-Chrome checks.

## Phase 1 — Analyse the capture and the live site

- Copy design-token **values** (colours, radii, shadows, type scale, spacing, easing, durations, breakpoints) into CSS
  variables + Tailwind `@theme inline`. Values are facts; markup and stylesheets are not to be copied.
- The DOM skeleton in the summary gives the component hierarchy.
- **An Enrichr capture contains only the route it loaded.** SPA routes are lazy chunks and come back empty
  (hidden `<section>`s). The summary lists the routes found in the JS and the view containers; capture the live site
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
- **Parallel pages** once tokens, shell, overlays, shared kit, data store and one finished page exist: write `KIT.md`
  (files each agent may touch, data API, kit components, CSS vocabulary, reference screenshot paths, how to run
  `shoot.mjs` + `diff.py`), then one subagent per section **on the same model as the main session**. Shared files stay
  with the main session; agents report gaps, the main session fixes shared pieces and diffs every page before accepting it.

## Phase 3 — Compare and fix (repeat until it matches)

1. Element boxes: run the same `getBoundingClientRect` probe on reference and rebuild at 1920 (aim for ≤1 px).
2. While iterating: `shoot.mjs <dir> <ref> <new> desktop,mobile`, then `python3 -I diff.py --dir <dir> <out>`; open
   only the crops it lists (ref | new | heat), fix, rerun until no region is left. Final pass: `shoot.mjs … all` + diff
   at all four widths, plus one full-size look at every page (numbers can miss a slightly lighter colour or a weight
   change). [scripts/pair.py](scripts/pair.py) makes plain side-by-side images when needed.
3. Real-input tests ([scripts/flows-template.mjs](scripts/flows-template.mjs), [scripts/keys-test.mjs](scripts/keys-test.mjs)):
   every button, filter, drag, form, drawer, menu and shortcut — one script per batch of flows, printing only failures.
4. Headless Chrome has no GPU, so `backdrop-filter` effects are slow there. If a timing test fails only headless,
   re-measure in a real Chrome window through the DevTools MCP before "fixing" it.

## Phase 4 — Match the motion

**First check the summary's "Motion libraries" section.** If the reference bundles GSAP (or another tween library),
take durations, eases, delays and staggers straight from its tween calls (`grep` the bundle around them), use the same
library with the same values, and confirm one interaction of each kind with the recorder. This usually matches on the
first try and skips most frame sampling.

Otherwise follow [references/motion-capture.md](references/motion-capture.md): trigger each interaction on the live site,
sample computed styles every frame ([scripts/recorder.js](scripts/recorder.js)), convert samples to progress, and
encode them as CSS `linear()` easings — don't guess springs. Measure the rebuild the same way and compare.
Starting points: [templates/motion.ts](templates/motion.ts), [templates/PageEnter.tsx](templates/PageEnter.tsx),
[templates/Press.tsx](templates/Press.tsx), [templates/Glint.tsx](templates/Glint.tsx).

If the site uses SVG-refraction "liquid glass", see [references/liquid-glass.md](references/liquid-glass.md) and
[templates/LiquidGlass.tsx](templates/LiquidGlass.tsx). **Apply it only to small chrome surfaces and floating
layers, never to large page cards** — on large cards it can halve scrolling frame rate.

## Phase 5 — Finish

- Scroll performance on every page on a **production** build in real Chrome ([scripts/perf-scroll.js](scripts/perf-scroll.js)); target ~60 fps.
- `node <skill-dir>/scripts/verify.mjs rebuild ",route1,route2,…"` prints `ok` for tsc, eslint, build and runtime
  (every route at 1920 + 390: console errors, hydration warnings, HTTP errors); fix anything it lists.
- README with structure, pages, overlays, motion, verification, and **Authorization**: what must not be reproduced
  exactly without the rights holder's permission (name/logo, source CSS/JS, artwork, copy/data, overall trade dress;
  quote any "All rights reserved" notices found in the vendor files).
- Start the production server, open it, and summarise what was built, what was verified, and what is intentionally different.
