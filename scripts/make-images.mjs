// Generates the PNG icons and the social-preview image from SVG/HTML.
// Run once after changing the logo: node scripts/make-images.mjs
// (needs a Chromium; set CHROME_PATH if it isn't at the default location).
import { chromium } from "playwright-core";
import fs from "node:fs";

const exe = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const mark = fs.readFileSync("public/favicon.svg", "utf8");
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();

for (const [file, size, pad] of [
  ["public/favicon-32.png", 32, 0],
  ["public/apple-touch-icon.png", 180, 0],
  ["public/icon-192.png", 192, 0],
  ["public/icon-512.png", 512, 0],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${mark.replace("<svg ", `<svg width="${size - pad * 2}" height="${size - pad * 2}" style="display:block;margin:${pad}px" `)}</body></html>`,
  );
  await page.screenshot({ path: file, omitBackground: true });
}

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<html><body style="margin:0">
<div style="width:1200px;height:630px;box-sizing:border-box;padding:72px 80px;background:#fbfbfd;font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;position:relative;overflow:hidden">
  <div style="position:absolute;right:-160px;top:-200px;width:760px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,113,227,.16),transparent)"></div>
  <div style="display:flex;align-items:center;gap:18px">${mark.replace("<svg ", '<svg width="64" height="64" ')}
    <span style="font-size:34px;font-weight:600;letter-spacing:-.02em;color:#1d1d1f">Apartments<span style="color:#0071e3">4</span>Newark</span></div>
  <div style="margin-top:70px;font-size:76px;line-height:1.04;font-weight:700;letter-spacing:-.035em;color:#1d1d1f;max-width:980px">
    Find your next place in <span style="color:#0071e3">Newark</span> and other cities in New Jersey</div>
  <div style="position:absolute;left:80px;bottom:64px;display:flex;gap:14px">
    ${["Rooms &amp; apartments", "Free to ask &amp; tour", "No sign-up"].map((t) => `<span style="font-size:24px;font-weight:600;color:#1d1d1f;background:#fff;border-radius:999px;padding:12px 22px;box-shadow:0 8px 24px -12px rgba(29,29,31,.25)">${t}</span>`).join("")}
  </div>
</div></body></html>`);
await page.screenshot({ path: "public/og-image.png" });
await browser.close();
console.log("images written");
