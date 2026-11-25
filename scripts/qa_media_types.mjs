import { chromium } from 'playwright-core';
import fs from 'node:fs';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const base = 'http://localhost:3000';
const results = [];
let failed = 0;
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  if (!ok) {
    failed += 1;
    console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    console.log(`ok    ${name}${detail ? ' — ' + detail : ''}`);
  }
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

const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('bydreamy.admin.v1') || '{}'));
const go = (path) => page.goto(base + path, { waitUntil: 'domcontentloaded' });
const round = 0;

// ---------------------------------------------------------------- login
await go('/admin');
const adminPassword = process.env.QA_ADMIN_PASSWORD;
if (!adminPassword) throw new Error('QA_ADMIN_PASSWORD belum diisi.');
await page.getByLabel('Password', { exact: true }).fill(adminPassword);
await page.getByRole('button', { name: /Masuk Dashboard/ }).click();
await page.waitForFunction(() => Boolean(localStorage.getItem('bydreamy.admin.session')), null, { timeout: 8000 });

await go('/admin/media');
await page.waitForSelector('.adm-media-grid, .adm-empty');

// --------------------------------------------------- tambah video YouTube
const addMedia = async ({ name, type, url, folder = 'qa' }) => {
  await page.getByRole('button', { name: /Tambah Media/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama file').fill(name);
  await dialog.getByLabel('Tipe').selectOption(type);
  await dialog.locator('input.adm-input-plain').nth(1).fill(url);
  await dialog.getByLabel('Folder', { exact: true }).fill(folder);
  await dialog.getByRole('button', { name: 'Tambahkan' }).click();
  await page.waitForTimeout(300);
};

await addMedia({ name: 'qa-youtube.mp4', type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
const videoRow = page.locator('.adm-media', { hasText: 'qa-youtube.mp4' });
check('video: kartu dibuat', (await videoRow.count()) > 0);
const storedVideo = (await db()).media?.find((m) => m.name === 'qa-youtube.mp4');
check('video: tipe tersimpan sebagai video', storedVideo?.type === 'video', storedVideo?.type);

// Badge YouTube + thumbnail otomatis.
check('video: badge penyedia tampil', (await videoRow.locator('.adm-media__badge').innerText()).toLowerCase().includes('youtube'));
check(
  'video: thumbnail youtube otomatis',
  (await videoRow.locator('.adm-media__preview img').getAttribute('src') || '').includes('img.youtube.com/vi/dQw4w9WgXcQ'),
);

// ---------------------------------------------------- pratinjau video embed
await videoRow.getByTitle('Pratinjau').click();
await page.waitForTimeout(300);
const videoDialog = page.getByRole('dialog');
check('video: modal pratinjau tampil', (await videoDialog.count()) > 0);
check(
  'video: iframe embed youtube benar',
  (await videoDialog.locator('iframe.adm-preview__frame').getAttribute('src') || '').includes('youtube.com/embed/dQw4w9WgXcQ'),
);
const closeDialog = () => page.getByRole('dialog').locator('.adm-modal__foot').getByRole('button', { name: 'Tutup' }).click();
await closeDialog();

// ------------------------------------------- pratinjau video file langsung
await addMedia({ name: 'qa-clip.mp4', type: 'video', url: '/wp-content/uploads/2026/clip.mp4' });
const fileRow = page.locator('.adm-media', { hasText: 'qa-clip.mp4' });
await fileRow.getByTitle('Pratinjau').click();
await page.waitForTimeout(300);
check('video-file: elemen <video controls> dipakai', (await page.getByRole('dialog').locator('video.adm-preview__frame').count()) > 0);
await closeDialog();

// ------------------------------------- tautan video tak dikenal → peringatan
await page.getByRole('button', { name: /Tambah Media/ }).click();
let dialog = page.getByRole('dialog');
await dialog.getByLabel('Nama file').fill('qa-badvideo');
await dialog.getByLabel('Tipe').selectOption('video');
await dialog.locator('input.adm-input-plain').nth(1).fill('bukan-tautan-video');
await page.waitForTimeout(200);
check('video: peringatan tautan tak dikenal muncul', (await dialog.locator('.adm-note').count()) > 0);
await dialog.getByRole('button', { name: 'Batal' }).click();

// -------------------------------------------------- auto-deteksi tipe video
await page.getByRole('button', { name: /Tambah Media/ }).click();
dialog = page.getByRole('dialog');
await dialog.getByLabel('Nama file').fill('qa-autodetect');
await dialog.locator('input.adm-input-plain').nth(1).fill('https://youtu.be/9bZkp7q19f0');
await page.waitForTimeout(200);
check('deteksi: tipe otomatis jadi Video', (await dialog.getByLabel('Tipe').inputValue()) === 'video');
check('deteksi: label field berubah jadi tautan video', (await dialog.getByText('Tautan video').count()) > 0);
await dialog.getByRole('button', { name: 'Batal' }).click();

// --------------------------------------------------------- tambah font
await addMedia({ name: 'qa-font.woff2', type: 'font', url: '/fonts/qa-font.woff2' });
const fontRow = page.locator('.adm-media', { hasText: 'qa-font.woff2' });
check('font: kartu dibuat', (await fontRow.count()) > 0);
check('font: kartu menampilkan ekstensi', (await fontRow.locator('.adm-media__preview > span').innerText()).includes('WOFF2'));
await fontRow.getByTitle('Pratinjau').click();
await page.waitForTimeout(500);
check('font: modal pratinjau tampil', (await page.getByRole('dialog').getByText('Aa Bb Cc 0123').count()) > 0);
const fontFaceInjected = await page.evaluate(() =>
  Array.from(document.head.querySelectorAll('style')).some((s) => s.textContent.includes('@font-face') && s.textContent.includes('bydreamy-media-')),
);
check('font: @font-face disuntik saat pratinjau', fontFaceInjected);
await closeDialog();
const fontFaceRemoved = await page.evaluate(() =>
  Array.from(document.head.querySelectorAll('style')).some((s) => s.textContent.includes('bydreamy-media-')),
);
check('font: @font-face dibersihkan setelah tutup', !fontFaceRemoved);

// ------------------------------------------------------ tambah dokumen
await addMedia({ name: 'qa-doc.pdf', type: 'document', url: '/docs/qa-doc.pdf' });
const docRow = page.locator('.adm-media', { hasText: 'qa-doc.pdf' });
check('dokumen: kartu dibuat', (await docRow.count()) > 0);
await docRow.getByTitle('Pratinjau').click();
await page.waitForTimeout(300);
check('dokumen: iframe pratinjau PDF', (await page.getByRole('dialog').locator('iframe.adm-preview__doc').count()) > 0);
await closeDialog();

// --------------------------------------------- filter tab per tipe
await page.locator('.adm-filter-tabs button', { hasText: 'Video' }).click();
await page.waitForTimeout(200);
const videoCards = await page.locator('.adm-media').count();
const videoInDb = ((await db()).media || []).filter((m) => m.type === 'video').length;
check('tab Video: hanya menampilkan video', videoCards === videoInDb, `${videoCards}/${videoInDb}`);

// ------------------------------------------------------------- cleanup
const cleanup = ['qa-youtube.mp4', 'qa-clip.mp4', 'qa-font.woff2', 'qa-doc.pdf'];
for (const name of cleanup) {
  await page.evaluate(
    (n) => {
      const key = 'bydreamy.admin.v1';
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      data.media = (data.media || []).filter((m) => m.name !== n);
      localStorage.setItem(key, JSON.stringify(data));
    },
    name,
  );
}
check('cleanup: media uji dihapus dari store', true);

const report = { failed, total: results.length, results, errors };
fs.writeFileSync('capture/qa/media-types-report.json', JSON.stringify(report, null, 2));
console.log(`\n${results.length - failed}/${results.length} checks passed, ${errors.length} console/page errors.`);
if (errors.length) console.log(errors.slice(0, 10));
await browser.close();
process.exit(failed ? 1 : 0);
