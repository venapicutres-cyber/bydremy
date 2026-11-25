import { chromium } from 'playwright-core';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
});

await page.goto('http://localhost:3000/demo-premium-03-sage', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Open cover if present.
const cover = await page.$('#tombol-buka');
if (cover) {
  await cover.click();
  await page.waitForTimeout(500);
}

// Scroll through page in steps so reveal logic fires.
const height = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < height; y += 600) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(120);
}
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const timeline = document.querySelector('.pp-timeline');
  const items = timeline ? timeline.querySelectorAll('.pp-timeline-item') : [];
  const hidden = timeline ? timeline.querySelectorAll('.pp-timeline-item.pp-timeline-item-hidden').length : -1;
  const bounced = timeline ? timeline.querySelectorAll('.pp-timeline-item.bounce-in').length : -1;
  const bar = timeline ? timeline.querySelector('.pp-timeline-connector-inner') : null;
  return {
    timelineItems: items.length,
    hidden,
    bounced,
    barHeight: bar?.style.height || null,
  };
});
console.log(JSON.stringify({ info, errors }, null, 2));

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: 'capture/qa/powerpack-ameera-top.jpg', type: 'jpeg', quality: 70 });

// FAQ page
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const faq = await page.evaluate(() => {
  const acc = document.querySelector('.pp-advanced-accordion');
  if (!acc) return null;
  const titles = Array.from(acc.querySelectorAll('.pp-accordion-tab-title'));
  titles[0]?.click();
  const firstOpen = titles[0].classList.contains('pp-accordion-tab-show');
  const content = titles[0].nextElementSibling;
  const contentVisible = content && getComputedStyle(content).display !== 'none';
  titles[1]?.click();
  const firstClosed = !titles[0].classList.contains('pp-accordion-tab-show');
  const secondOpen = titles[1].classList.contains('pp-accordion-tab-show');
  const slick = document.querySelector('.pp-slick-slider');
  return {
    titleCount: titles.length,
    firstOpen,
    contentVisible,
    accordionMode: firstClosed && secondOpen,
    slickInitialized: !!slick?.classList.contains('slick-initialized'),
    slickSlides: slick ? slick.querySelectorAll('.slick-slide.slick-active').length : 0,
  };
});
console.log(JSON.stringify({ faq, faqErrors: errors.filter((e) => !e.includes('ameera')) }, null, 2));

await page.evaluate(() => {
  const acc = document.querySelector('.pp-advanced-accordion');
  acc?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(600);
await page.screenshot({ path: 'capture/qa/powerpack-faq.jpg', type: 'jpeg', quality: 70 });

await browser.close();
