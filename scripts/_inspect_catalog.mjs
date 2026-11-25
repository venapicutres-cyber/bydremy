import { chromium } from 'playwright-core';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const base = process.env.BASE || 'http://localhost:3002';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.bydreamy-cloned #sp-catalog', { timeout: 20000 });
await page.waitForTimeout(1500);

const outline = await page.evaluate(() => {
  const root = document.querySelector('#sp-catalog');
  const lines = [];
  const short = (el) => {
    const id = el.getAttribute('data-id') || '';
    const cls = (el.getAttribute('class') || '').split(/\s+/).filter((c) => c && !c.startsWith('elementor-element-')).slice(0, 4).join('.');
    const wid = el.getAttribute('data-widget_type') || '';
    return `<${el.tagName.toLowerCase()}${id ? ' #' + id : ''}${wid ? ' [' + wid + ']' : ''}${cls ? ' .' + cls : ''}>`;
  };
  const walk = (el, depth) => {
    if (depth > 9) return;
    if (el.nodeType === 1) {
      let text = '';
      if (el.children.length === 0) text = (el.textContent || '').trim().slice(0, 40);
      lines.push('  '.repeat(depth) + short(el) + (text ? ' "' + text + '"' : ''));
      Array.from(el.children).forEach((c) => walk(c, depth + 1));
    }
  };
  Array.from(root.children).forEach((c) => walk(c, 0));
  return lines.join('\n');
});

console.log(outline);
await browser.close();
