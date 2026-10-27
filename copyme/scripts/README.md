# Helper scripts

Install once:

    npm i --prefix <skill-dir>/scripts
    python3 -m pip install --user pillow

Run with `node <skill-dir>/scripts/<file>.mjs ...`. Browsers launch through `browser.mjs` (installed Google Chrome by
default; see that file for `CHROME_PATH` / `CHROME_CHANNEL`). `recorder.js` and `perf-scroll.js` are pasted into the
page with the Chrome DevTools MCP `evaluate_script`. Write outputs to a temporary folder, not into the project.

| Script | Purpose |
|---|---|
| browser.mjs | Shared cross-platform browser launcher |
| analyse.mjs | Capture → `analysis/copyme-summary.md` (rights notice, motion libraries + tween calls, routes, tokens, DOM skeleton). No deps. Read this instead of the raw files |
| new-project.sh | Clone a cached Next 15 + Tailwind v4 + lucide-react + gsap base into `<dest>` in seconds |
| shoot.mjs | Full-page screenshots of reference and rebuild; 4th arg `desktop,mobile` (default, while iterating) or `all` (final pass) |
| diff.py | Numeric screenshot diff: % changed, worst regions, full-scale crops (ref / new / heat) — open only the crops |
| verify.mjs | One gate: tsc, eslint, build, then every route at 1920 + 390 for console / hydration errors; prints only failures |
| pair.py | Side-by-side image of two screenshots (red divider), optional crop + scale |
| live-routes.mjs | Capture every route of the live site (screens desktop+phone, markup, route CSS URLs) |
| survey-overlays.mjs | Click through overlays (drawers, menus, modals, detail pages) on the live site, save screens + text |
| recorder.js | In-page recorder: trigger → which elements changed and how; brief mode (default) keeps ~1 sample / 40 ms + every peak and dip |
| perf-scroll.js | In-page scroll fps probe (bring the tab to front first) |
| flows-template.mjs | Interaction test skeleton for the rebuild (fill in per site) |
| keys-test.mjs | Keyboard shortcut test skeleton |
| hydration-check.mjs | Visit every route desktop+phone, print console errors / hydration warnings (verify.mjs already includes this) |
