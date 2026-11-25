import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const exe = 'C:\\Users\\PC - SIGAMPANG\\AppData\\Local\\ms-playwright\\chromium-1255\\chrome-win64\\chrome.exe';
const base = 'http://localhost:3000';
const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'capture', 'qa');
fs.mkdirSync(outDir, { recursive: true });

const pages = JSON.parse(fs.readFileSync(path.join(root, 'src/data/generated/pages.json'), 'utf8'));
const templates = pages.filter((page) => page.kind === 'template');
const routes = templates.map((t) => ({ route: t.route, slug: t.slug, label: t.templateName }));
if (process.argv[2]) {
  const wanted = new Set(process.argv.slice(2));
  routes.splice(0, routes.length, ...routes.filter((r) => wanted.has(r.slug)));
}

const browser = await chromium.launch({ executablePath: exe, headless: true });
const results = [];

for (const item of routes) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  const consoleErrors = [];
  const failed = new Set();
  page.on('pageerror', (err) => errors.push(String(err.message).slice(0, 200)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      const url = res.url();
      if (!url.includes('localhost:3000')) return;
      failed.add(`${res.status()} ${new URL(url).pathname}`);
    }
  });
  try {
    await page.goto(base + item.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2200);
    const openBtn = page.locator('#tombol-buka');
    if (await openBtn.count()) {
      await openBtn.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
    }
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const imgs = Array.from(document.querySelectorAll('img'));
      const broken = imgs
        .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src'))
        .map((img) => img.getAttribute('src').slice(-70));
      const countdowns = Array.from(document.querySelectorAll('[class*="countdown"]'))
        .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 3);
      return {
        title: document.title,
        widgets: document.querySelectorAll('.elementor-widget').length,
        sections: document.querySelectorAll('section').length,
        overflow: Math.max(0, doc.scrollWidth - window.innerWidth),
        height: Math.max(doc.scrollHeight, document.body.scrollHeight),
        broken: Array.from(new Set(broken)).slice(0, 6),
        countdowns,
      };
    });
    await page.screenshot({
      path: path.join(outDir, `${item.slug}-1440.jpg`),
      fullPage: true,
      type: 'jpeg',
      quality: 55,
    });
    results.push({ ...item, ...metrics, errors, consoleErrors, failed: Array.from(failed).slice(0, 10) });
    console.log(
      `${item.slug}: widgets=${metrics.widgets} overflow=${metrics.overflow} broken=${metrics.broken.length} errors=${errors.length} console=${consoleErrors.length}`,
    );
  } catch (err) {
    results.push({ ...item, fatal: String(err).slice(0, 300) });
    console.log(`${item.slug}: FATAL ${String(err).slice(0, 160)}`);
  }
  await context.close();
}

fs.writeFileSync(path.join(outDir, 'template-report.json'), JSON.stringify(results, null, 2));
await browser.close();

const bad = results.filter((r) => r.fatal || r.errors?.length || r.consoleErrors?.length || r.broken?.length || r.overflow > 2);
console.log(`\n${results.length} routes checked, ${bad.length} with issues.`);
for (const r of bad) {
  console.log(`\n== ${r.slug}`);
  if (r.fatal) console.log('  fatal:', r.fatal);
  if (r.errors?.length) console.log('  pageerror:', r.errors);
  if (r.consoleErrors?.length) console.log('  console:', r.consoleErrors);
  if (r.broken?.length) console.log('  broken:', r.broken);
  if (r.overflow > 2) console.log('  overflow:', r.overflow);
}
