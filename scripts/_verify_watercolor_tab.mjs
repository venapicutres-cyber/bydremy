import { chromium } from 'playwright-core';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const base = process.env.BASE || 'http://localhost:3002';
const fails = [];
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' :: ' + extra : ''}`);
  if (!cond) fails.push(name);
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.setDefaultTimeout(25000);

async function run(viewport) {
  await page.setViewportSize(viewport);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.bydreamy-cloned #sp-catalog', { timeout: 25000 });
  await page.waitForTimeout(1200);

  const tabs = await page.evaluate(() => {
    const heading = document.querySelector('#sp-catalog .e-n-tabs-heading');
    if (!heading) return null;
    return Array.from(heading.querySelectorAll('.e-n-tab-title')).map((b) => {
      const cs = getComputedStyle(b);
      return {
        id: b.id,
        text: (b.textContent || '').trim(),
        width: Math.round(b.getBoundingClientRect().width),
        radius: cs.borderTopLeftRadius + ' / ' + cs.borderTopRightRadius,
        borderTop: cs.borderTopWidth,
        ariaControls: b.getAttribute('aria-controls'),
      };
    });
  });
  ok(`[${viewport.width}] tab heading ditemukan`, !!tabs);
  ok(`[${viewport.width}] tombol WATERCOLOR ada`, !!tabs?.some((t) => t.id === 'tab-watercolor-series'));
  console.log('  tabs =', JSON.stringify(tabs));

  await page.click('#sp-catalog #tab-watercolor-series');
  await page.waitForTimeout(700);
  const panel = await page.evaluate(() => {
    const p = document.getElementById('e-n-tab-content-1262917635');
    if (!p) return null;
    const cs = getComputedStyle(p);
    const cards = Array.from(p.querySelectorAll('.e-grid > .e-con-full'));
    return {
      active: p.classList.contains('e-active'),
      display: cs.display,
      cardCount: cards.length,
      names: cards.map((c) => {
        const h = c.querySelector('.elementor-heading-title');
        return h ? h.textContent.trim() : null;
      }),
      rect: { w: Math.round(p.getBoundingClientRect().width), h: Math.round(p.getBoundingClientRect().height) },
    };
  });
  ok(`[${viewport.width}] panel watercolor ada`, !!panel);
  console.log('  panel =', JSON.stringify(panel));
  ok(`[${viewport.width}] panel punya 5 kartu`, panel?.cardCount === 5, `count=${panel?.cardCount}`);

  const pricelist = await page.evaluate(() => {
    const el = document.getElementById('e-n-tab-content-1262917636');
    return el ? { active: el.classList.contains('e-active'), h: Math.round(el.getBoundingClientRect().height) } : null;
  });
  console.log('  pricelist =', JSON.stringify(pricelist));
}

await run({ width: 1500, height: 950 });
await run({ width: 390, height: 844 });

await browser.close();
console.log(fails.length ? `\n${fails.length} FAIL` : '\nALL PASS');
process.exit(fails.length ? 1 : 0);
