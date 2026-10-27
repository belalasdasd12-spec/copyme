// node analyse.mjs <enrichrFolder> [maxSkeletonLines=260] [outFile]
// One compact summary of the capture → <enrichrFolder>/analysis/copyme-summary.md (no deps).
// Read this instead of rendered.html / used.css / the JS bundles; grep the raw files only for specific details.
import fs from "node:fs";
import path from "node:path";

const [dir, maxLinesArg, outArg] = process.argv.slice(2);
if (!dir) { console.error("usage: node analyse.mjs <enrichrFolder>"); process.exit(1); }
const MAX = +maxLinesArg || 260;
const rd = (p) => { try { return fs.readFileSync(path.join(dir, p), "utf8"); } catch { return ""; } };
const ls = (p) => { try { return fs.readdirSync(path.join(dir, p)); } catch { return []; } };
const uniq = (a) => [...new Set(a)];
const top = (arr, n = 15) => {
  const m = new Map(); for (const v of arr) m.set(v, (m.get(v) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([v, c]) => `${v} ×${c}`).join(" · ");
};
const out = [];
const h = (t) => out.push("", `## ${t}`);

// ── source / vendor ─────────────────────────────────────────
const manifest = (() => { try { return JSON.parse(rd("manifest.json")); } catch { return {}; } })();
const css = rd("styles/used.css");
const jsFiles = ls("assets/js").filter((f) => f.endsWith(".js"));
const js = Object.fromEntries(jsFiles.map((f) => [f, rd(`assets/js/${f}`)]));
const cssFiles = ls("assets/css").filter((f) => f.endsWith(".css"));
const allCss = css + cssFiles.map((f) => rd(`assets/css/${f}`)).join("\n");
out.push(`# Capture summary — ${manifest.source || dir}`, `captured ${manifest.capturedAt || "?"}`);
h("Vendor / rights (decides whether session-log numbers apply)");
const comments = [...(allCss + Object.values(js).join("\n")).matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0]).join("\n");
const rights = uniq([...comments.matchAll(/[^\n]{0,80}(?:©|All rights reserved|@license|copyright)[^\n]{0,80}/gi)].map((m) => m[0].trim().slice(0, 170))).slice(0, 8);
out.push(rights.length ? rights.map((r) => `- ${r}`).join("\n") : "- none found");
try { out.push(`- host: ${new URL(manifest.source).host}${new URL(manifest.source).pathname}`); } catch {}

// ── motion libraries (check before any frame sampling) ──────
h("Motion libraries in the bundles");
const libs = { gsap: /\bgsap\b|GreenSock|_gsScope/, "framer-motion / motion": /framer-motion|motion\/react|useAnimate|AnimatePresence/, anime: /\banime\(|animejs/, lottie: /lottie/i, "web animations": /\.animate\(\s*\[/, swiper: /swiper/i, three: /THREE\.|WebGLRenderer/ };
for (const [name, re] of Object.entries(libs)) {
  const hit = jsFiles.filter((f) => re.test(js[f]));
  if (hit.length) out.push(`- **${name}** in ${hit.join(", ")}`);
}
const tweens = [];
for (const f of jsFiles) for (const m of js[f].matchAll(/\.(?:fromTo|from|to|timeline|animate)\([^;]{0,40}?(?:duration|ease|stagger)[^;]{0,200}/g))
  tweens.push(`${f.slice(0, 24)}: ${m[0].replace(/\s+/g, " ").slice(0, 230)}`);
out.push(tweens.length ? `tween calls (${tweens.length}, first 40 — exact values live here):\n` + tweens.slice(0, 40).map((t) => "    " + t).join("\n") : "- no tween calls with duration/ease found → JS springs or CSS: sample with recorder.js");

// ── routes / views ──────────────────────────────────────────
h("Routes and captured views");
const routes = uniq(Object.values(js).flatMap((s) => [...s.matchAll(/#\/[a-z0-9][a-z0-9/_:-]*/gi)].map((m) => m[0]))).sort();
out.push(`- routes in JS (${routes.length}): ${routes.join(" ")}`);
const html = rd("original/rendered.html");
const views = [...html.matchAll(/<(section|div|main)\b[^>]*(?:data-view|data-route|class="[^"]*\bview\b)[^>]*>/g)].map((m) => m[0].replace(/\s+/g, " ").slice(0, 120));
if (views.length) out.push(`- view containers (${views.length}; empty/hidden ones were NOT captured → use live-routes.mjs):`, ...views.slice(0, 30).map((v) => "    " + v));

// ── tokens ──────────────────────────────────────────────────
h("Design tokens (values only)");
const vars = new Map();
for (const m of allCss.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:\s*([^;}]+)/g)) if (!vars.has(m[1])) vars.set(m[1], m[2].trim().slice(0, 90));
out.push(`custom properties (${vars.size}):`, [...vars].map(([k, v]) => `${k}: ${v}`).join("; "));
const decl = (prop) => [...allCss.matchAll(new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`, "g"))].map((m) => m[1].trim().slice(0, 80));
for (const p of ["font-family", "font-size", "font-weight", "line-height", "letter-spacing", "border-radius", "box-shadow", "backdrop-filter", "transition", "animation", "gap", "padding"])
  { const t = top(decl(p), p === "box-shadow" || p === "transition" ? 10 : 14); if (t) out.push(`- **${p}**: ${t}`); }
out.push(`- **media**: ${uniq([...allCss.matchAll(/@media\s*([^{]+)/g)].map((m) => m[1].trim())).join(" | ")}`);
out.push(`- **@keyframes**: ${uniq([...allCss.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])).join(", ") || "none"}`);
out.push(`- **fonts loaded**: ${uniq([...allCss.matchAll(/@font-face[^}]*font-family:\s*([^;]+)/g)].map((m) => m[1].trim())).join(", ") || "see analysis/fonts.json"}`);

// ── DOM skeleton ────────────────────────────────────────────
h("DOM skeleton (tag.class \"text\", repeated siblings collapsed)");
const body = (html.match(/<body[\s\S]*<\/body>/i) || [html])[0]
  .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, "")
  .replace(/<svg\b[\s\S]*?<\/svg>/gi, "<svg></svg>")
  .replace(/<!--[\s\S]*?-->/g, "");
const VOID = new Set("area base br col embed hr img input link meta source track wbr".split(" "));
const root = { kids: [] }; const stack = [root];
for (const m of body.matchAll(/<\/?([a-zA-Z][\w-]*)([^>]*)>|([^<]+)/g)) {
  const cur = stack.at(-1);
  if (m[3] !== undefined) { const t = m[3].replace(/\s+/g, " ").trim(); if (t && cur !== root) cur.text = ((cur.text || "") + " " + t).trim(); continue; }
  const tag = m[1].toLowerCase();
  if (m[0][1] === "/") { const i = stack.map((n) => n.tag).lastIndexOf(tag); if (i > 0) stack.length = i; continue; }
  const a = m[2];
  const cls = (a.match(/class="([^"]*)"/) || [, ""])[1].trim().split(/\s+/).filter(Boolean).slice(0, 3);
  const extra = ["hidden", "data-view", "role", "aria-label", "href"].map((k) => { const v = a.match(new RegExp(`\\b${k}(?:="([^"]*)")?`)); return v && a.includes(k) ? (k === "hidden" ? "[hidden]" : `[${k}=${(v[1] || "").slice(0, 24)}]`) : ""; }).join("");
  const node = { tag, sig: tag + (cls.length ? "." + cls.join(".") : "") + extra, kids: [] };
  cur.kids.push(node);
  if (!VOID.has(tag) && !/\/\s*$/.test(a)) stack.push(node);
}
const lines = [];
const walk = (n, d) => {
  for (let i = 0; i < n.kids.length; i++) {
    const k = n.kids[i]; let rep = 1;
    while (i + rep < n.kids.length && n.kids[i + rep].sig === k.sig) rep++;
    if (lines.length < MAX) lines.push("  ".repeat(d) + k.sig + (rep > 1 ? ` ×${rep}` : "") + (k.text ? ` "${k.text.slice(0, 32)}"` : ""));
    if (d < 11) walk(k, d + 1);
    i += rep - 1;
  }
};
walk(root, 0);
out.push("```", ...lines, lines.length >= MAX ? `… truncated at ${MAX} lines (pass a bigger limit if needed)` : "", "```");

// ── what else exists ────────────────────────────────────────
h("Files");
out.push(`- screenshots: ${ls("screenshots").join(", ") || "none"}`);
out.push(`- analysis: ${ls("analysis").map((f) => { try { return `${f} (${Math.round(fs.statSync(path.join(dir, "analysis", f)).size / 1024)}k)`; } catch { return f; } }).join(", ")}`);
out.push(`- js: ${jsFiles.map((f) => `${f} (${Math.round(js[f].length / 1024)}k)`).join(", ")}`);

const file = outArg || path.join(dir, "analysis", "copyme-summary.md");
fs.writeFileSync(file, out.join("\n") + "\n");
console.log(`${file} — ${out.join("\n").length} chars`);
