import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const exe = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'capture', 'qa', 'pages');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'home', path: '/' },
  { name: 'portfolio', path: '/portfolio' },
  { name: 'digital-guestbook', path: '/digital-guestbook' },
  { name: 'wedding-frame', path: '/wedding-frame' },
  { name: 'video-statik', path: '/video-statik' },
  { name: 'contact-us', path: '/contact-us' },
  { name: 'katalog-website', path: '/katalog-website' },
  { name: 'katalog-video', path: '/katalog-video-statik' },
  { name: 'katalog-buku-tamu', path: '/katalog-buku-tamu-fix' },
  { name: 'portfolio-bydreamy', path: '/portfolio-bydreamy' },
  { name: '404', path: '/404-not-found' },
  { name: 'brand-katalog', path: '/katalog' },
  { name: 'brand-kategori', path: '/katalog/heritage' },
  { name: 'brand-detail', path: '/template/demo-heritage-series-ameera' },
  { name: 'brand-tentang', path: '/tentang' },
];

const widths = [
  { w: 1440, h: 900, label: '1440' },
  { w: 768, h: 1024, label: '768' },
  { w: 390, h: 844, label: '390' },
];

const only = process.argv[2];
const list = only ? targets.filter((t) => t.name === only) : targets;

const browser = await chromium.launch({ executablePath: exe, headless: true });
const report = [];

for (const target of list) {
  for (const vp of widths) {
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
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
    try {
      await page.goto('http://localhost:3000' + target.path, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(2500);
      // trigger all lazy sections/animations
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.8;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const imgs = Array.from(document.querySelectorAll('img'));
        const broken = imgs
          .filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src'))
          .map((i) => i.getAttribute('src').slice(-60));
        const widest = Array.from(document.querySelectorAll('body *'))
          .map((el) => ({ w: el.getBoundingClientRect().width, c: (el.className || '').toString().slice(0, 40) }))
          .sort((a, b) => b.w - a.w)[0];
        return {
          title: document.title,
          textLen: document.body.innerText.trim().length,
          overflow: Math.max(0, doc.scrollWidth - window.innerWidth),
          docHeight: doc.scrollHeight,
          broken: Array.from(new Set(broken)).slice(0, 5),
          widest,
        };
      });
      const base = `${target.name}-${vp.label}`;
      await page.screenshot({ path: path.join(outDir, `${base}-top.jpg`), type: 'jpeg', quality: 65 });
      await page.screenshot({ path: path.join(outDir, `${base}-full.jpg`), type: 'jpeg', quality: 50, fullPage: true });
      report.push({ ...target, width: vp.w, ...metrics, errors, consoleErrors });
      console.log(`${target.name} @${vp.label}: len=${metrics.textLen} overflow=${metrics.overflow} broken=${metrics.broken.length} err=${errors.length} con=${consoleErrors.length}`);
    } catch (err) {
      report.push({ ...target, width: vp.w, fatal: String(err).slice(0, 200) });
      console.log(`${target.name} @${vp.label}: FATAL ${String(err).slice(0, 120)}`);
    }
    await context.close();
  }
}

fs.writeFileSync(path.join(outDir, 'pages-report.json'), JSON.stringify(report, null, 2));
await browser.close();

const bad = report.filter((r) => r.fatal || r.errors?.length || r.consoleErrors?.length || r.broken?.length || r.overflow > 2 || r.textLen < 60);
console.log(`\n${report.length} page/viewport combos, ${bad.length} issues`);
for (const r of bad) {
  console.log(`== ${r.name} @${r.width}`, r.fatal || '', r.errors?.length ? `err:${r.errors}` : '', r.consoleErrors?.length ? `con:${r.consoleErrors}` : '', r.broken?.length ? `broken:${r.broken}` : '', r.overflow > 2 ? `overflow:${r.overflow}` : '', r.textLen < 60 ? `textLen:${r.textLen}` : '');
}
