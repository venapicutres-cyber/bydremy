import { chromium } from 'playwright-core';

const exe = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true });

async function capture(url, label) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `capture/qa/compare-${label}-closed.jpg`, type: 'jpeg', quality: 65 });
  const btn = page.locator('#tombol-buka');
  if (await btn.count()) await btn.first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `capture/qa/compare-${label}-open.jpg`, type: 'jpeg', quality: 65 });
  const info = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), display: getComputedStyle(el).display };
    };
    return {
      bodyClass: document.body.className,
      bodyW: document.body.getBoundingClientRect().width,
      main: pick('#page, .elementor'),
      header: pick('#header'),
      cover: pick('.layercover'),
      home: pick('.home-title'),
      htmlW: document.documentElement.scrollWidth,
    };
  });
  console.log(label, JSON.stringify(info));
  await page.close();
}

await capture('http://localhost:3000/demo-heritage-series-ameera', 'clone-ameera');
await capture('https://bydreamy.com/demo-heritage-series-ameera/', 'live-ameera');
await browser.close();
