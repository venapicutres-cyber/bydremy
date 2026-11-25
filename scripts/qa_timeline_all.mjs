import { chromium } from 'playwright-core';
const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const routes = ['/demo-heritage-series-ameera','/demo-heritage-series-utary','/demo-heritage-series-sandhayu','/demo-heritage-series-sandhayu-v2','/demo-heritage-series-aruna','/demo-heritage-series-aruna-v2','/demo-moody-papercut','/demo-moody-sweetpink-fix','/demo-moody-wave','/demo-premium-02','/demo-premium-03-sage','/demo-premium-04','/demo-premium-05','/'];
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let bad = 0;
for (const width of [1440, 390]) {
  for (const route of routes) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, isMobile: width < 500, hasTouch: width < 500 });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000' + route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1600);
    const btn2 = page.locator('#tombol-buka-2:visible');
    const btn = page.locator('#tombol-buka:visible');
    if (await btn2.count()) await btn2.first().click({ force: true }).catch(() => {});
    else if (await btn.count()) await btn.first().click({ force: true }).catch(() => {});
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
    });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => ({
      total: document.querySelectorAll('.pp-timeline-item').length,
      hidden: document.querySelectorAll('.pp-timeline-item.pp-timeline-item-hidden').length,
      bounced: document.querySelectorAll('.pp-timeline-item.bounce-in').length,
    }));
    if (m.hidden > 0) { bad++; console.log(`STILL HIDDEN ${route} @${width}`, m); }
    else console.log(`ok ${route} @${width} total=${m.total} bounced=${m.bounced}`);
    await ctx.close();
  }
}
await browser.close();
console.log(bad ? `${bad} timeline pages still hide items` : 'all timeline items revealed');
