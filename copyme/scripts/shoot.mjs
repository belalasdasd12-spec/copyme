// node shoot.mjs <outDir> <refUrl> <newUrl> [sizes=desktop,mobile | all]   (HIDE=".selector" hides overlays like promo pills)
// Full-page screenshots of reference vs rebuild (while iterating: desktop+mobile; final pass: all four) → <outDir>/<size>-ref.png / -new.png
import { launch, hideCss } from "./browser.mjs";
const [out, refUrl, newUrl, pick = "desktop,mobile"] = process.argv.slice(2);
const all = { desktop: [1920, 1080], laptop: [1440, 900], tablet: [768, 1024], mobile: [390, 844] };
const sizes = pick === "all" ? all : Object.fromEntries(pick.split(",").map((k) => [k, all[k]]));
const b = await launch();
for (const [name, [w, h]] of Object.entries(sizes))
  for (const [t, url] of [["ref", refUrl], ["new", newUrl]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: w < 761, hasTouch: w < 761 });
    await p.goto(url, { waitUntil: "networkidle" });
    await p.addStyleTag({ content: hideCss });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/${name}-${t}.png`, fullPage: true });
    await p.close();
  }
await b.close();
