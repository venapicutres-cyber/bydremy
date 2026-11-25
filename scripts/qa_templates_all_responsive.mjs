import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const exe = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const root = path.resolve(import.meta.dirname, '..');
const pages = JSON.parse(fs.readFileSync(path.join(root, 'src/data/generated/pages.json'), 'utf8'));
const templates = pages.filter((page) => page.kind === 'template');
const widths = [
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
];

const browser = await chromium.launch({ executablePath: exe, headless: true });
const issues = [];
let checked = 0;

for (const template of templates) {
  for (const vp of widths) {
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      isMobile: vp.w < 500,
      hasTouch: vp.w < 500,
    });
    const page = await context.newPage();
    const errors = [];
    const consoleErrors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160));
    });
    await page.goto('http://localhost:3000' + template.route, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(2000);
    const btn = page.locator('#tombol-buka');
    if (await btn.count()) await btn.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);
    const m = await page.evaluate(() => {
      const doc = document.documentElement;
      const broken = Array.from(document.querySelectorAll('img'))
        .filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src'))
        .map((i) => i.getAttribute('src').slice(-50));
      return {
        overflow: Math.max(0, doc.scrollWidth - window.innerWidth),
        textLen: document.body.innerText.trim().length,
        broken: Array.from(new Set(broken)).slice(0, 4),
        hiddenTimeline: document.querySelectorAll('.pp-timeline-item.pp-timeline-item-hidden').length,
      };
    });
    const bad =
      errors.length ||
      consoleErrors.length ||
      m.broken.length ||
      m.overflow > 2 ||
      m.textLen < 80;
    checked += 1;
    if (bad) {
      issues.push({ slug: template.slug, width: vp.w, ...m, errors, consoleErrors });
      console.log(
        `${template.slug} @${vp.w}: overflow=${m.overflow} text=${m.textLen} broken=${m.broken.length} hiddenTimeline=${m.hiddenTimeline} err=${errors.length} con=${consoleErrors.length}`,
      );
    }
    await context.close();
  }
}

await browser.close();
fs.writeFileSync(
  path.join(root, 'capture/qa/templates-responsive-report.json'),
  JSON.stringify({ checked, issues }, null, 2),
);
console.log(`\n${checked} template/viewport combos checked, ${issues.length} with issues.`);
process.exit(issues.length ? 1 : 0);
