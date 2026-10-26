// Keyboard shortcut test with real key presses. node keys-test.mjs http://localhost:3100
// Note: headless Chrome has no GPU — overlays with backdrop-filter:url() animate slowly; give closes ≥1.5 s or
// confirm timing in real Chrome via the DevTools MCP.
import { launch, hideCss } from "./browser.mjs";
const base = process.argv[2];
const b = await launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const res = [];
const check = async (name, fn) => { try { res.push(`${(await fn()) ? "PASS" : "FAIL"}  ${name}`); } catch (e) { res.push(`FAIL  ${name}: ${e.message.split("\n")[0]}`); } };
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(900); await p.mouse.click(700, 140);
const dialogs = () => p.locator("[role=dialog]").count();
await check("⌘K opens search", async () => { await p.keyboard.press("Meta+k"); await p.waitForTimeout(300); return (await dialogs()) === 1; });
await check("Esc closes", async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(1500); return (await dialogs()) === 0; });
await check("/ opens search", async () => { await p.keyboard.press("/"); await p.waitForTimeout(300); const ok = (await dialogs()) === 1; await p.keyboard.press("Escape"); await p.waitForTimeout(1500); return ok; });
await check("? opens the shortcuts list", async () => { await p.keyboard.press("Shift+/"); await p.waitForTimeout(500); const ok = (await dialogs()) === 1; await p.keyboard.press("Escape"); await p.waitForTimeout(1500); return ok; });
await check("G then A goes to /apps", async () => { await p.keyboard.press("g"); await p.keyboard.press("a"); await p.waitForURL((u) => new URL(u).pathname === "/apps", { timeout: 5000 }); return true; });
await check("shortcuts ignored while typing", async () => { const box = p.locator("input").first(); await box.click(); await p.keyboard.type("gn/"); await p.waitForTimeout(400); return (await box.inputValue()).endsWith("gn/") && (await dialogs()) === 0; });
console.log(res.join("\n"));
await b.close();
