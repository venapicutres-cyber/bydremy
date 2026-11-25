import { chromium } from 'playwright-core';
const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const base = 'http://localhost:4180';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${new URL(r.url()).pathname}`); });

await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const home = await page.evaluate(() => ({
  title: document.title,
  widgets: document.querySelectorAll('.elementor-widget').length,
  slick: document.querySelectorAll('.pp-slick-slider.slick-initialized').length,
}));
console.log('home', home);

await page.goto(base + '/demo-premium-03-sage', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const btn = page.locator('#tombol-buka');
if (await btn.count()) await btn.first().click({ force: true }).catch(() => {});
await page.evaluate(async () => {
  const step = window.innerHeight * 0.7;
  for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
});
await page.waitForTimeout(600);
const sage = await page.evaluate(() => ({
  widgets: document.querySelectorAll('.elementor-widget').length,
  timelineItems: document.querySelectorAll('.pp-timeline-item').length,
  hiddenTimeline: document.querySelectorAll('.pp-timeline-item.pp-timeline-item-hidden').length,
}));
console.log('sage', sage);

await page.goto(base + '/admin', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const admin = await page.evaluate(() => ({
  login: !!document.querySelector('.adm-login'),
  session: !!localStorage.getItem('bydreamy.admin.session'),
}));
console.log('admin', admin);
console.log('errors', errors);
await browser.close();
