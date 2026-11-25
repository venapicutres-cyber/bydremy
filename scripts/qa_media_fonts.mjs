import { chromium } from 'playwright-core';
import fs from 'node:fs';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const base = 'http://localhost:3000';
const results = [];
let failed = 0;
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'ok   ' : 'FAIL '} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed += 1;
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200));
});
page.on('dialog', (d) => d.accept());
const go = (p) => page.goto(base + p, { waitUntil: 'domcontentloaded' });

const FONT_COUNT = 57;

// ---------------------------------------------------------------- login
await go('/admin');
await page.getByLabel('Password', { exact: true }).fill('admin123');
await page.getByRole('button', { name: /Masuk Dashboard/ }).click();
await page.waitForFunction(() => Boolean(localStorage.getItem('bydreamy.admin.session')), null, { timeout: 8000 });

// ---------------------------------------------- store kosong → font ada
await go('/admin/media');
await page.evaluate(() => localStorage.removeItem('bydreamy.admin.v1'));
await go('/admin/media');
await page.waitForSelector('.adm-media-grid, .adm-empty');
await page.locator('.adm-filter-tabs button', { hasText: 'Font' }).click();
await page.waitForTimeout(300);
const fontCards = await page.locator('.adm-media').count();
check('seed: tab Font menampilkan semua font lokal', fontCards === FONT_COUNT, `${fontCards}/${FONT_COUNT}`);
check('seed: kartu font punya badge ekstensi', (await page.locator('.adm-media__preview > span').first().innerText()).includes('WOFF2'));

// ------------------------------------------------- pratinjau font lokal
const firstFont = page.locator('.adm-media').first();
const fontName = (await firstFont.locator('strong').innerText()).trim();
await firstFont.getByTitle('Pratinjau').click();
await page.waitForTimeout(700);
const sample = page.getByRole('dialog').getByText('Aa Bb Cc 0123');
check('pratinjau: modal font tampil', (await sample.count()) > 0);
const loaded = await page.evaluate(() => {
  const el = document.querySelector('.adm-preview__font');
  const family = el && el.style.fontFamily;
  return { family: family || '', status: family ? document.fonts.check(`16px ${family}`) : false };
});
check('pratinjau: font benar-benar dimuat', loaded.status === true, `family=${loaded.family}`);
await page.getByRole('dialog').locator('.adm-modal__foot').getByRole('button', { name: 'Tutup' }).click();

// ------------------------------- file font benar-benar tersedia (HTTP 200)
const domUrl = await firstFont.locator('.adm-media__body code').innerText();
const resp = await page.request.get(`${base}/wp-content/uploads/useanyfont/8543Belgiano-Serif.woff2`);
check('aset: file font lokal tersaji (200)', resp.status() === 200, `status=${resp.status()}`);
check('aset: folder font terdaftar', domUrl.includes('useanyfont'), domUrl);

// --------------- store lama (media hanya 2 gambar) → font tetap masuk
await page.evaluate(() => {
  const key = 'bydreamy.admin.v1';
  const seedProbe = { version: 3, pages: [], categories: [], media: [{ id: 1, name: 'x', url: '/x', type: 'image', folder: 'f', size: '1', createdAt: '' }], orders: [], customers: [], users: [], settings: {}, navigation: [], footer: [] };
  localStorage.setItem(key, JSON.stringify(seedProbe));
});
await go('/admin/media');
await page.waitForSelector('.adm-media-grid, .adm-empty');
await page.locator('.adm-filter-tabs button', { hasText: 'Font' }).click();
await page.waitForTimeout(300);
const mergedFonts = await page.locator('.adm-media').count();
check('merge: store lama ikut mendapat font baru', mergedFonts === FONT_COUNT, `${mergedFonts}/${FONT_COUNT}`);
await page.locator('.adm-filter-tabs button', { hasText: 'Gambar' }).click();
await page.waitForTimeout(300);
const mergedImages = await page.locator('.adm-media').count();
check('merge: seed gambar lama ikut dikembalikan', mergedImages === 29, `${mergedImages}/29`);

// ------------------------------ media yang dihapus tidak dihidupkan lagi
await page.evaluate(() => {
  const key = 'bydreamy.admin.v1';
  const data = JSON.parse(localStorage.getItem(key));
  data.deletedMediaIds = [30]; // id font pertama
  localStorage.setItem(key, JSON.stringify(data));
});
await go('/admin/media');
await page.waitForSelector('.adm-media-grid, .adm-empty');
await page.locator('.adm-filter-tabs button', { hasText: 'Font' }).click();
await page.waitForTimeout(300);
const afterDelete = await page.locator('.adm-media').count();
check('hapus: font ber-id 30 tidak muncul lagi', afterDelete === FONT_COUNT - 1, `${afterDelete}/${FONT_COUNT - 1}`);

// ------------------------------------------------------------- cleanup
await page.evaluate(() => localStorage.removeItem('bydreamy.admin.v1'));

const report = { failed, total: results.length, results, errors };
fs.writeFileSync('capture/qa/media-fonts-report.json', JSON.stringify(report, null, 2));
console.log(`\n${results.length - failed}/${results.length} checks passed, ${errors.length} console/page errors.`);
if (errors.length) console.log(errors.slice(0, 8));
await browser.close();
process.exit(failed ? 1 : 0);
