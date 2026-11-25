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
page.on('dialog', (d) => d.accept());

const readStore = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('bydreamy.admin.v1') || '{}'));

// ---- login
await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' });
const adminPassword = process.env.QA_ADMIN_PASSWORD;
if (!adminPassword) throw new Error('QA_ADMIN_PASSWORD belum diisi.');
await page.getByLabel('Password', { exact: true }).fill(adminPassword);
await page.getByRole('button', { name: /Masuk Dashboard/ }).click();
await page.waitForFunction(() => Boolean(localStorage.getItem('bydreamy.admin.session')), null, { timeout: 10000 });

// ---- 1. ubah harga template Flara (id 162067)
await page.goto(base + '/admin/pages/162067', { waitUntil: 'domcontentloaded' });
await page.getByLabel('Harga (Rp)', { exact: true }).fill('250000');
await page.getByLabel('Harga coret (Rp)', { exact: true }).fill('500000');
await page.getByRole('button', { name: 'Simpan Perubahan', exact: true }).click();
await page.waitForTimeout(900);
let db = await readStore();
let flara = (db.pages || []).find((x) => x.id === 162067);
ok('harga template tersimpan di store', flara && flara.price === 250000 && flara.priceCompare === 500000, JSON.stringify({ price: flara?.price, priceCompare: flara?.priceCompare }));

// ---- 2. sinkronkan katalog di halaman Home (80785)
await page.goto(base + '/admin/homepage/80785', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Sinkronkan Katalog', exact: true }).click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Simpan Perubahan', exact: true }).click();
await page.waitForTimeout(900);
db = await readStore();
const home = (db.pages || []).find((x) => x.id === 80785);
ok('override harga Flara tersimpan', home?.textOverrides?.['bebbfae'] === 'Rp 250.000', JSON.stringify(home?.textOverrides?.['bebbfae']));
ok('override harga coret Flara tersimpan', home?.textOverrides?.['2e2de35'] === 'Rp 500.000', JSON.stringify(home?.textOverrides?.['2e2de35']));
ok('override harga heritage tetap format lama', home?.textOverrides?.['641dbc4'] === 'Rp. 299.000', JSON.stringify(home?.textOverrides?.['641dbc4']));

// ---- 3. cek tampilan website
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.bydreamy-cloned #sp-catalog', { timeout: 25000 });
await page.waitForTimeout(1500);
const card = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('#sp-catalog .e-grid > .e-con-full'));
  const el = cards.find((c) =>
    Array.from(c.querySelectorAll('a[href]')).some((a) => (a.getAttribute('href') || '').includes('demo-premium-10-flara')),
  );
  if (!el) return null;
  return Array.from(el.querySelectorAll('[data-widget_type="heading.default"].elementor-widget__width-auto .elementor-heading-title')).map((n) =>
    n.textContent.trim(),
  );
});
ok('website: harga Flara tersinkron', Array.isArray(card) && card[0] === 'Rp 250.000' && card[1] === 'Rp 500.000', JSON.stringify(card));

console.log(fails.length ? `\n${fails.length} GAGAL` : '\nSEMUA PASS');
await browser.close();
process.exit(fails.length ? 1 : 0);
