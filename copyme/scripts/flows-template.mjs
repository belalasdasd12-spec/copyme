// Interaction test skeleton for the rebuild. Fill in per site; keep each check small and observable.
// node flows-template.mjs http://localhost:3100
import { launch, hideCss } from "./browser.mjs";
const base = process.argv[2];
const b = await launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const res = [];
const check = async (name, fn) => { try { res.push(`${(await fn()) ? "PASS" : "FAIL"}  ${name}`); } catch (e) { res.push(`FAIL  ${name}: ${e.message.split("\n")[0]}`); } };
const toast = async () => (await p.locator("[role=status]").last().innerText()).replace(/\n/g, " ");
// Examples (adapt selectors to the rebuild):
await p.goto(base + "/apps", { waitUntil: "networkidle" });
await check("search filters cards", async () => { await p.getByPlaceholder(/search/i).fill("fin"); return (await p.locator("main article h2").count()) === 1; });
await p.goto(base + "/releases", { waitUntil: "networkidle" });
await check("drag a card to the next column shows a toast", async () => { await p.locator("article[draggable]").first().dragTo(p.locator("<column selector>").nth(1)); return (await toast()).includes("moved"); });
console.log(res.join("\n")); console.log("page errors:", errs.join(" | ") || "none");
await b.close();
