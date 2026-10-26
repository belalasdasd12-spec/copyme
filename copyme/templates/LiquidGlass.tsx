"use client";

import { useEffect } from "react";

// Liquid-glass refraction for every `.glass` surface. Each element gets its own SVG filter whose
// displacement map is drawn for its exact size and corner radius: near the rim the backdrop is
// pulled inward like a thick lens, the R/G/B channels bend by slightly different amounts (a hint
// of dispersion), then a light frost blur and a saturation lift. Chromium only — other engines
// keep the plain blurred glass from the CSS.
const PAD = 28;
const NS = "http://www.w3.org/2000/svg";

function radiusOf(el: HTMLElement, w: number, h: number) {
  const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return Math.min(r, w / 2, h / 2);
}

// The map is smooth, so it is drawn at half resolution and stretched by feImage —
// a quarter of the pixels to compute and encode, with no visible difference.
const RES = 0.5;

async function drawMap(w: number, h: number, r: number) {
  const W = Math.round(w + PAD * 2);
  const H = Math.round(h + PAD * 2);
  const cw = Math.ceil(W * RES);
  const ch = Math.ceil(H * RES);
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(cw, ch);
  const bezel = Math.max(8, Math.min(22, Math.min(w, h) * 0.3));
  const hw = w / 2;
  const hh = h / 2;
  for (let j = 0; j < ch; j++) {
    for (let k = 0; k < cw; k++) {
      // signed distance to the rounded rectangle (negative inside)
      const px = k / RES - PAD - hw;
      const py = j / RES - PAD - hh;
      const qx = Math.abs(px) - (hw - r);
      const qy = Math.abs(py) - (hh - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const d = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
      let dx = 0;
      let dy = 0;
      if (d < 0 && -d < bezel) {
        // outward normal of the nearest edge
        let nx: number, ny: number;
        if (ox > 0 || oy > 0) {
          const len = Math.hypot(ox, oy) || 1;
          nx = (ox / len) * Math.sign(px);
          ny = (oy / len) * Math.sign(py);
        } else if (qx > qy) {
          nx = Math.sign(px);
          ny = 0;
        } else {
          nx = 0;
          ny = Math.sign(py);
        }
        const t = 1 - -d / bezel;
        const m = t * t * (3 - 2 * t); // smooth lens falloff
        dx = -nx * m;
        dy = -ny * m;
      }
      const i = (j * cw + k) * 4;
      img.data[i] = 128 + dx * 127;
      img.data[i + 1] = 128 + dy * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res));
  return { url: blob ? URL.createObjectURL(blob) : c.toDataURL(), W, H };
}

function filterMarkup(id: string, url: string, W: number, H: number) {
  const channel = (scale: number, result: string) =>
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="${result}"/>`;
  const only = (k: number) => [0, 1, 2].map((row) => [0, 1, 2, 3, 4].map((col) => +(row === k && col === k)).join(" ")).join("  ") + "  0 0 0 1 0";
  return `<filter id="${id}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB" x="${-PAD}" y="${-PAD}" width="${W}" height="${H}">
    <feImage href="${url}" x="${-PAD}" y="${-PAD}" width="${W}" height="${H}" preserveAspectRatio="none" result="map"/>
    ${channel(26, "dr")}<feColorMatrix in="dr" type="matrix" values="${only(0)}" result="r"/>
    ${channel(28, "dg")}<feColorMatrix in="dg" type="matrix" values="${only(1)}" result="g"/>
    ${channel(30, "db")}<feColorMatrix in="db" type="matrix" values="${only(2)}" result="b"/>
    <feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen" result="bent"/>
    <feGaussianBlur in="bent" stdDeviation="3.2" result="frost"/><feColorMatrix in="frost" type="saturate" values="1.6"/>
  </filter>`;
}

export function LiquidGlass() {
  useEffect(() => {
    const chromium = /Chrome\//.test(navigator.userAgent) && !/Firefox\//.test(navigator.userAgent);
    if (!chromium || matchMedia("(prefers-reduced-transparency: reduce)").matches) return;

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    const defs = document.createElementNS(NS, "defs");
    svg.appendChild(defs);
    document.body.prepend(svg);

    let n = 0;
    const ids = new WeakMap<HTMLElement, { id: string; key: string }>();
    const solid = () => document.documentElement.hasAttribute("data-solid-glass");

    const urls = new Map<string, string>();
    const apply = async (el: HTMLElement) => {
      if (solid()) {
        el.style.removeProperty("backdrop-filter");
        return;
      }
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // Like the reference, refraction is reserved for the chrome (brand, tabs, tools, dock),
      // small glass chips and floating layers (menus, dialogs, drawers, a focused card).
      // Large page cards keep the plain CSS blur: re-filtering them every scroll frame
      // dropped scrolling from 60 to ~25 fps.
      const eligible = el.classList.contains("glass-chrome") || el.classList.contains("glass-thick") || w * h <= 40_000;
      if (!eligible || w < 8 || h < 8) {
        if (ids.has(el)) {
          el.style.removeProperty("backdrop-filter");
          ids.delete(el);
        }
        return;
      }
      const r = radiusOf(el, w, h);
      const key = `${w}x${h}r${r}`;
      const known = ids.get(el);
      if (known?.key === key) return;
      const id = known?.id ?? `lgx${++n}`;
      ids.set(el, { id, key });
      const { url, W, H } = await drawMap(w, h, r);
      if (ids.get(el)?.key !== key) return URL.revokeObjectURL(url); // resized again meanwhile
      const old = urls.get(id);
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      urls.set(id, url);
      defs.querySelector(`#${id}`)?.remove();
      defs.insertAdjacentHTML("beforeend", filterMarkup(id, url, W, H));
      el.style.setProperty("backdrop-filter", `url(#${id})`);
    };

    // Maps are drawn a few per frame so a page full of cards never blocks the main thread
    const queue = new Set<HTMLElement>();
    let raf = 0;
    const pump = () => {
      raf = 0;
      const t0 = performance.now();
      for (const el of queue) {
        queue.delete(el);
        if (el.isConnected) void apply(el);
        if (performance.now() - t0 > 8) break;
      }
      if (queue.size) raf = requestAnimationFrame(pump);
    };
    const schedule = (el: HTMLElement) => {
      queue.add(el);
      if (!raf) raf = requestAnimationFrame(pump);
    };
    const ro = new ResizeObserver((entries) => entries.forEach((e) => schedule(e.target as HTMLElement)));
    const watch = (root: ParentNode) => root.querySelectorAll<HTMLElement>(".glass").forEach((el) => ro.observe(el));
    // Wait until the first page (including Suspense boundaries) has hydrated before touching
    // inline styles, or React would see attributes it didn't render.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      watch(document);
      mo.observe(document.body, { childList: true, subtree: true });
    };
    const kick = () => setTimeout(start, 400);
    if (document.readyState === "complete") kick();
    else window.addEventListener("load", kick, { once: true });
    const mo = new MutationObserver((muts) => {
      for (const m of muts)
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.classList.contains("glass")) ro.observe(node);
          watch(node);
        });
    });
    // re-evaluate when "Reduce transparency" is toggled
    const attr = new MutationObserver(() => document.querySelectorAll<HTMLElement>(".glass").forEach((el) => (ids.delete(el), schedule(el))));
    attr.observe(document.documentElement, { attributes: true, attributeFilter: ["data-solid-glass"] });

    return () => {
      window.removeEventListener("load", kick);
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      attr.disconnect();
      svg.remove();
      urls.forEach((u) => u.startsWith("blob:") && URL.revokeObjectURL(u));
    };
  }, []);
  return null;
}
