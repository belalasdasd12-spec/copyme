// node hydration-check.mjs <baseUrl> <route1,route2,...>   (use "" for the home route)
import { launch, hideCss } from "./browser.mjs";
const [base, list] = process.argv.slice(2);
const b = await launch();
for (const [w, h] of [[1920, 1080], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  for (const r of list.split(",")) {
    const msgs = []; const on = (m) => m.type() === "error" && msgs.push(m.text()); p.on("console", on); p.on("pageerror", (e) => msgs.push(e.message));
    await p.goto(`${base}/${r}`, { waitUntil: "networkidle" }); await p.waitForTimeout(700); p.off("console", on);
    if (msgs.length) console.log(w, "/" + r, msgs.map((x) => x.slice(0, 400)).join("\n"));
  }
  await p.close();
}
console.log("done");
await b.close();
