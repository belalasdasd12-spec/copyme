// Template: click through a live site's overlays and save a screenshot + visible overlay text for each.
// Edit STEPS for the site (selectors come from the DOM skeleton). node survey-overlays.mjs <outDir> <baseUrl>
import { launch, hideCss } from "./browser.mjs";
import fs from "fs";
const [out, base] = process.argv.slice(2);
const b = await launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base, { waitUntil: "networkidle" });
const go = async (h) => { await p.evaluate((h) => (location.hash = h), h); await p.waitForTimeout(1500); };
const overlay = () => p.evaluate(() => [...document.querySelectorAll("dialog[open], [role=dialog], .pop, [role=menu]")].map((e) => `${e.id || e.className}: ${e.innerText.slice(0, 300).replace(/\n+/g, " | ")}`));
const close = async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(300); await p.mouse.click(5, 450); await p.waitForTimeout(300); };
const notes = [];
const STEPS = [
  // [name, async () => { ...open one surface... }] — replace the selectors with the site's own
  ["detail-page", async () => go("#/items/first-id")],
  ["create-menu", async () => p.locator("<create button>").click()],
  ["account-menu", async () => p.locator("<avatar button>").click()],
  ["row-drawer", async () => { await go("#/list"); await p.locator("<row selector>").first().click(); }],
];
for (const [name, open] of STEPS) {
  try { await open(); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${name}.png` }); notes.push([name, await overlay(), p.url()]); } catch (e) { notes.push([name, "FAILED " + e.message.split("\n")[0]]); }
  await close();
}
fs.writeFileSync(`${out}/notes.json`, JSON.stringify(notes, null, 1));
await b.close();
