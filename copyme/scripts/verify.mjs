// node verify.mjs <rebuildDir> [routes="",apps,settings] [port=3199]
// One gate: tsc → eslint → next build → start the build → hydration/console check on every route (1920 + 390).
// Prints "ok" per step and only the errors when a step fails (trimmed), so the transcript stays short.
import { spawnSync, spawn } from "node:child_process";
import path from "node:path";
import { launch } from "./browser.mjs";

const [dir, routes = "", port = "3199"] = process.argv.slice(2);
if (!dir) { console.error("usage: node verify.mjs <rebuildDir> [routes] [port]"); process.exit(1); }
const cwd = path.resolve(dir);
const trim = (s, n = 40) => { const l = s.split("\n").filter((x) => /error|warn|fail|✗|×|Type|Module|\d+:\d+/i.test(x)); return (l.length ? l : s.split("\n")).slice(0, n).join("\n"); };
let failed = false;
const step = (name, cmd, args) => {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", shell: process.platform === "win32", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", FORCE_COLOR: "0" }, maxBuffer: 64 << 20 });
  const out = (r.stdout || "") + (r.stderr || "");
  if (r.status === 0) console.log(`ok   ${name}`);
  else { failed = true; console.log(`FAIL ${name}\n${trim(out)}`); }
  return r.status === 0;
};
step("tsc", "npx", ["tsc", "--noEmit"]);
step("eslint", "npx", ["eslint", ".", "--max-warnings=0"]);
if (!step("build", "npm", ["run", "build", "--silent"])) process.exit(1);

const srv = spawn("npx", ["next", "start", "-p", port], { cwd, stdio: "ignore", shell: process.platform === "win32" });
const base = `http://localhost:${port}`;
for (let i = 0; i < 60; i++) { try { await fetch(base); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
try {
  const b = await launch();
  const bad = [];
  for (const [w, h] of [[1920, 1080], [390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
    for (const r of routes.split(",")) {
      const msgs = []; const on = (m) => (m.type() === "error" || /hydrat/i.test(m.text())) && msgs.push(m.text());
      p.on("console", on); const pe = (e) => msgs.push(e.message); p.on("pageerror", pe);
      const res = await p.goto(`${base}/${r}`, { waitUntil: "networkidle" }); await p.waitForTimeout(700);
      p.off("console", on); p.off("pageerror", pe);
      if (!res || res.status() >= 400) msgs.push(`HTTP ${res?.status()}`);
      if (msgs.length) bad.push(`${w} /${r}: ${msgs.map((x) => x.slice(0, 300)).join(" | ")}`);
    }
    await p.close();
  }
  await b.close();
  if (bad.length) { failed = true; console.log(`FAIL runtime (${bad.length})\n${bad.slice(0, 30).join("\n")}`); }
  else console.log(`ok   runtime (${routes.split(",").length} routes × 2 sizes, no console errors / hydration warnings)`);
} finally { srv.kill(); }
process.exit(failed ? 1 : 0);
