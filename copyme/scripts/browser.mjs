// Shared launcher: installed Google Chrome by default (works on macOS, Windows, Linux).
//   CHROME_PATH=/path/to/chrome   use a specific binary
//   CHROME_CHANNEL=bundled        use Playwright's own Chromium (npx playwright install chromium)
//   CHROME_CHANNEL=msedge         any Playwright channel name
import { chromium } from "playwright-core";

export function launch(opts = {}) {
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH, ...opts });
  const channel = process.env.CHROME_CHANNEL ?? "chrome";
  return chromium.launch(channel === "bundled" ? opts : { channel, ...opts });
}

// CSS selector(s) hidden before screenshots (cookie banners, promo pills…): HIDE=".banner,.promo"
export const hideCss = `${process.env.HIDE ? process.env.HIDE + "," : ""}nextjs-portal{display:none!important}`;
