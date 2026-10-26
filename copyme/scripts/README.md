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
| shoot.mjs | Full-page screenshots of reference and rebuild at 1920/1440/768/390 |
| pair.py | Side-by-side image of two screenshots (red divider), optional crop + scale |
| live-routes.mjs | Capture every route of the live site (screens desktop+phone, markup, route CSS URLs) |
| survey-overlays.mjs | Click through overlays (drawers, menus, modals, detail pages) on the live site, save screens + text |
| recorder.js | In-page recorder: trigger → which elements changed and how, frame by frame |
| perf-scroll.js | In-page scroll fps probe (bring the tab to front first) |
| flows-template.mjs | Interaction test skeleton for the rebuild (fill in per site) |
| keys-test.mjs | Keyboard shortcut test skeleton |
| hydration-check.mjs | Visit every route desktop+phone, print console errors / hydration warnings |
