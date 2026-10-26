// node live-routes.mjs <outDir> <baseUrlWithHashRoot> <route1,route2,...>
// e.g. node live-routes.mjs out "https://site/app/#/overview" apps,releases,reviews
// Saves <route>-d.png / -m.png, <route>.html (visible view markup) and css.txt (all stylesheets seen).
import { launch, hideCss } from "./browser.mjs";
import fs from "fs";
const [out, start, list] = process.argv.slice(2);
const routes = list.split(",");
const b = await launch();
const css = new Set();
for (const [label, w, h] of [["d", 1920, 1080], ["m", 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  p.on("response", (r) => r.url().endsWith(".css") && css.add(r.url()));
  await p.goto(start, { waitUntil: "networkidle" });
  for (const r of routes) {
    await p.evaluate((r) => (location.hash = `#/${r}`), r);
    await p.waitForTimeout(2500);
    await p.addStyleTag({ content: hideCss });
    await p.screenshot({ path: `${out}/${r.replace(/\//g, "_")}-${label}.png`, fullPage: true });
    if (label === "d") fs.writeFileSync(`${out}/${r.replace(/\//g, "_")}.html`, await p.evaluate(() => (document.querySelector("section.view:not([hidden])") ?? document.querySelector("main") ?? document.body).outerHTML));
  }
  await p.close();
}
fs.writeFileSync(`${out}/css.txt`, [...css].join("\n"));
await b.close();
