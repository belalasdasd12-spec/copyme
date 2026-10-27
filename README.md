# copyme — a Claude Code skill

Turn an **Enrichr** website capture into an independently written **React + Next.js + Tailwind** front-end that
matches the original's layout, responsive behaviour, interactions and motion — then prove it with side-by-side
screenshots, real-input tests and frame-by-frame motion measurements.

> Use it on your own sites, on sites you have permission to reproduce, or for learning. The skill writes all code
> from scratch, replaces brand, logo, artwork and copy with original material, and ends with an Authorization
> section listing what must not be reproduced exactly without the rights holder's permission.

## What it does

1. **Analyses** the Enrichr folder: design tokens, DOM structure, breakpoints, captured hover/press states.
2. **Captures the live site** for every route (an Enrichr capture contains only the page it loaded) and clicks
   through drawers, menus, modals, detail pages and shortcut screens.
3. **Builds** every page and overlay in Next.js 15 + Tailwind v4 with original content.
4. **Compares** element positions and screenshots at 1920 / 1440 / 768 / 390 px and fixes differences.
5. **Matches motion** by sampling the live site's animations every frame and encoding them as CSS `linear()`
   easings — panels, page entrances, tab indicators, toasts, button presses.
6. **Checks performance** (~60 fps scrolling on a production build) and finishes with a README.

It is built to stay fast and light on tokens without losing fidelity: one compact summary of the capture instead of
raw files, numeric screenshot diffs that point at the exact regions to look at, motion values read from the
reference's own tween calls when it has them, a cached starter project, and one verification gate. You run Enrichr
yourself and hand over the folder — the skill never installs or drives it.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- Node.js 20+, Python 3 with Pillow, Google Chrome (or Playwright's Chromium)
- An Enrichr export of the target page
- Recommended MCP servers for measuring motion:

```bash
claude mcp add --scope user chrome-devtools -- npx -y chrome-devtools-mcp@latest
claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest
```

## Install

Copy the `copyme` folder into your personal skills folder (or a project's `.claude/skills/`):

```bash
cp -R copyme ~/.claude/skills/
npm i --prefix ~/.claude/skills/copyme/scripts
python3 -m pip install --user pillow
```

Start a new Claude Code session so the skill and MCP tools load.

## Use

```
/copyme ~/Downloads/enrichr-extract-1234/
```

Or type `/copyme` and drag the Enrichr folder into the chat. Claude works through all phases and reports back with
what was built, how it was verified, and what is intentionally different. The project is created in `rebuild/`
inside the Enrichr folder unless you ask for another location.

## Contents

```
copyme/
  SKILL.md                 the workflow Claude follows
  references/
    brief.md               the original brief
    checklist.md           coverage list (pages, overlays, interactions, motion, quality)
    motion-capture.md      how to measure and reproduce animations
    liquid-glass.md        SVG-refraction glass and its performance rule
    lessons.md             traps that cost time on real runs
    setup.md               MCP and script setup
  scripts/                 capture summary, starter project, screenshots, numeric diff, route capture,
                           motion recorder, tests, verify gate, fps probe
  templates/               motion helpers and shell components to start from
```

## License

MIT — see [LICENSE](LICENSE).
