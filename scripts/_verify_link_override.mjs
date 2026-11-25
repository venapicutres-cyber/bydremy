import { chromium } from 'playwright-core';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const base = process.env.BASE || 'http://localhost:3002';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(25000);

await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' });
const adminPassword = process.env.QA_ADMIN_PASSWORD;
if (!adminPassword) throw new Error('QA_ADMIN_PASSWORD belum diisi.');
await page.getByLabel('Password', { exact: true }).fill(adminPassword);
await page.getByRole('button', { name: /Masuk Dashboard/ }).click();
await page.waitForFunction(() => Boolean(localStorage.getItem('bydreamy.admin.session')), null, { timeout: 10000 });

// Persist store dulu (login saja belum menulis localStorage), lalu muat ulang Home.
await page.goto(base + '/admin/homepage/80785', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Simpan Perubahan', exact: true }).click();
await page.waitForTimeout(800);
await page.evaluate(() => {
  const key = 'bydreamy.admin.v1';
  const db = JSON.parse(localStorage.getItem(key) || '{}');
  const home = (db.pages || []).find((p) => p.id === 80785);
  home.linkOverrides = { '/demo-heritage-series-utary/': '/katalog/heritage' };
  localStorage.setItem(key, JSON.stringify(db));
});
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.bydreamy-cloned #sp-catalog', { timeout: 25000 });
await page.waitForTimeout(1200);

const href = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('#sp-catalog .e-grid > .e-con-full'));
  const el = cards.find((c) => c.querySelector('[data-id="140b5a3"]'));
  return el?.querySelector('[data-id="140b5a3"] a[href]')?.getAttribute('href') || null;
});
console.log(`${href === '/katalog/heritage' ? 'PASS' : 'FAIL'} link override diterapkan :: ${href}`);
await browser.close();
process.exit(href === '/katalog/heritage' ? 0 : 1);
