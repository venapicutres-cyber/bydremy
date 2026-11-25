import fs from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const pages = JSON.parse(fs.readFileSync('src/data/generated/pages.json', 'utf8'));
const templates = (Array.isArray(pages) ? pages : pages.pages).filter((page) => page.kind === 'template');

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const failures = [];

for (const template of templates) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}));
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto(`http://localhost:3000${template.route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#tombol-buka', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);

  const before = await page.evaluate(() => ({
    url: location.pathname,
    pageId: document.querySelector('.bydreamy-cloned')?.getAttribute('data-page-id') || null,
  }));

  const cover = page.locator('#tombol-buka');
  if (await cover.count()) {
    const inner = cover.locator('a');
    if (await inner.count()) await inner.first().click({ force: true }).catch(() => {});
    else await cover.first().click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(500);

  const after = await page.evaluate(() => ({
    url: location.pathname,
    coverVisible: Array.from(document.querySelectorAll('.layercover')).some(
      (element) => getComputedStyle(element).display !== 'none' && element.offsetParent !== null,
    ),
  }));

  // Every href-less anchor is a button; clicking it must not navigate away.
  const buttonUrls = await page.evaluate(() => {
    const urls = [];
    const anchors = Array.from(document.querySelectorAll('.bydreamy-cloned a:not([href])')).slice(0, 8);
    for (const anchor of anchors) {
      const before = location.pathname;
      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
      urls.push({ label: (anchor.textContent || '').trim().slice(0, 30), before, after: location.pathname });
    }
    return urls;
  });

  await page.waitForTimeout(200);
  const stayed = after.url === before.url && buttonUrls.every((item) => item.after === item.before);
  // html2canvas is a QR-download dependency that the demo payload never ships;
  // it only fires when that optional button is pressed, not on navigation.
  const navErrors = errors.filter((message) => !message.includes('html2canvas'));

  if (before.pageId !== String(template.id) || !stayed || navErrors.length) {
    failures.push({ route: template.route, before, after, stayed, buttonUrls, errors: navErrors });
    console.log(`FAIL ${template.route} ` + JSON.stringify({ before, after, stayed, errors: navErrors }));
  } else {
    console.log(`ok   ${template.route} cover=${before.pageId} url=${after.url}`);
  }
  await ctx.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} halaman gagal` : `\nSemua ${templates.length} template aman: klik Buka Undangan tidak berpindah dari halaman.`);
process.exit(failures.length ? 1 : 0);
