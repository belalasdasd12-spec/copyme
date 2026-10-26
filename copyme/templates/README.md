# Templates

Starting points for the rebuild's motion layer. Copy into the Next.js project:

| File | Copy to | What it does |
|---|---|---|
| motion.ts | `lib/motion.ts` | `curve()` → CSS `linear()` easings from measured samples; panel reveal, icon pop, press squash. Example curves must be replaced by measurements. |
| PageEnter.tsx | `components/shell/PageEnter.tsx`, used from `app/template.tsx` | Page entrance for `[data-enter="ch" \| "stat" \| "card"]` elements |
| Press.tsx | `components/shell/Press.tsx`, mounted once in the layout | Squash-and-stretch on pill/round buttons |
| Glint.tsx | `components/shell/Glint.tsx`, mounted once | Pointer-following highlight on `.glass` (reads `--gx/--gy`) |
| LiquidGlass.tsx | `components/shell/LiquidGlass.tsx`, mounted once | SVG-refraction backdrop for small `.glass` chrome and overlays (Chromium) |

Timings in PageEnter.tsx and Press.tsx are examples from a past project — re-measure on your reference.
