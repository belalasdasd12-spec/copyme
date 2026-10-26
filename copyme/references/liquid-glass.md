# Liquid glass (SVG refraction) — technique and the performance rule

## How sites usually do it
Each glass element got its own `<filter id="lgN">` and `backdrop-filter: url(#lgN)` (Chromium only):
- `feImage` = a displacement map generated on a canvas for that element's exact size (+28 px padding) and corner radius,
- three `feDisplacementMap`s (R/G/B at slightly different scales, e.g. 26/28/30) isolated with `feColorMatrix`
  and recombined with `feBlend screen` → subtle chromatic dispersion at the rim,
- `feGaussianBlur stdDeviation≈3.2` (frost) + `feColorMatrix saturate 1.6`.
Look for it: `grep 'backdrop-filter: url' original/rendered.html` and `feDisplacementMap` in the JS bundle.

## Our implementation (templates/LiquidGlass.tsx)
- Map from a rounded-rect signed-distance field: inside a bezel (8–22 px) push samples inward along the edge normal
  with a smoothstep falloff; neutral (128,128) elsewhere.
- Draw the map at **half resolution** and encode with `toBlob` → object URL (async) so it never blocks a frame.
- Queue map drawing (≤8 ms per frame); ResizeObserver re-draws on size change; MutationObserver picks up new
  `.glass` nodes; skip/remove when "Reduce transparency" (`html[data-solid-glass]`) is on.
- Start only after `load` + 400 ms (inline styles before hydration cause React mismatches).

## Performance rule (learned the hard way)
`backdrop-filter: url()` is re-evaluated every frame the content behind it moves. Measured on a dashboard with 14 glass surfaces including
large cards: **25 fps** while scrolling; removing it from the cards → **61–62 fps**. Sites that do this well keep it on
the brand pill, tab bar, toolbars, dock, small icon chips, and floating layers (menus, dialogs, drawers, focused card).
Eligibility check: `glass-chrome || glass-thick || width*height <= 40 000`. Large cards keep the plain CSS blur.

Measure with `scripts/perf-scroll.js` on a production build in real (GPU) Chrome, page in front.
