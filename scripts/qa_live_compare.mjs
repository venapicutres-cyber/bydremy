import { chromium } from 'playwright-core';

const exe = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://bydreamy.com/katalog-buku-tamu-fix/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);
const heading = page.getByText('Disc. Up To').first();
if (await heading.count()) {
  await heading.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'capture/qa/live-buku-tamu-promo.jpg', type: 'jpeg', quality: 70 });
}
const liveImgs = await page.evaluate(() =>
  Array.from(document.querySelectorAll('img'))
    .filter((i) => i.complete && i.naturalWidth === 0)
    .map((i) => i.getAttribute('src'))
    .slice(0, 20),
);
console.log('live broken images:', liveImgs);
await browser.close();
