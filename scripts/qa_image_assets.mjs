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
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 240)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 240));
});
page.on('dialog', (d) => d.accept());

const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('bydreamy.admin.v1') || '{}'));
const go = (path) => page.goto(base + path, { waitUntil: 'domcontentloaded' });

const shotDir = 'capture/qa';
fs.mkdirSync(shotDir, { recursive: true });

// ------------------------------------------------------------------ login
await go('/admin');
await page.getByLabel('Password', { exact: true }).fill('admin123');
await page.getByRole('button', { name: /Masuk Dashboard/ }).click();
await page.waitForFunction(() => Boolean(localStorage.getItem('bydreamy.admin.session')), null, { timeout: 8000 });

// ------------------------------------------- section-scoped content images
await go('/admin/pages/324524');
await page.getByRole('button', { name: /Section & Teks/ }).click();
await page.waitForSelector('.adm-section-image');
const sectionStats = await page.locator('.adm-section').evaluateAll((nodes) =>
  nodes.map((node) => ({
    label: node.querySelector('header strong')?.textContent?.trim() || '',
    images: Array.from(node.querySelectorAll('.adm-section-image figcaption')).map((node) => node.textContent || ''),
  })),
);
const allSectionImages = sectionStats.flatMap((section) => section.images);
check('section: gambar konten tampil di section masing-masing', allSectionImages.length > 0, `${allSectionImages.length} kartu`);
const coverSection = sectionStats.find((section) => /THE WEDDING OF/i.test(section.label));
check('section: cover punya gambar yang bisa diubah', (coverSection?.images || []).some((name) => /PICTURE/i.test(name)));
const portraitSection = sectionStats.find((section) => /a Potrait of/i.test(section.label));
check(
  'section: foto pengantin terkumpul di section portrait',
  (portraitSection?.images || []).filter((name) => /Bride-Groom/i.test(name)).length >= 6,
  `${(portraitSection?.images || []).length} foto`,
);
const decorativeLeak = allSectionImages.filter((name) =>
  /(rambat|janur|batik|tree|wax|seal|lace|engraving|amplop|heritage|bunga|floral|orn)/i.test(name),
);
check('section: ornamen tidak ikut masuk daftar gambar section', decorativeLeak.length === 0, decorativeLeak.slice(0, 3).join(', '));

const firstSectionCard = page.locator('.adm-section-image').first();
await firstSectionCard.locator('button').first().click();
await page.waitForSelector('.adm-picker__item');
await page.locator('.adm-picker__item').nth(1).click();
await page.waitForSelector('.adm-section-image.is-changed');
check('section: ganti gambar langsung dari section', (await page.locator('.adm-section-image.is-changed').count()) === 1);
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await page.waitForTimeout(600);
let sectionStore = await db();
const sectionPage = sectionStore.pages.find((p) => p.id === 324524);
const sectionOverrides = Object.values(sectionPage?.imageOverrides || {});
check('section: override gambar section tersimpan', sectionOverrides.length > 0 && sectionOverrides.every((value) => value.startsWith('media:')), sectionOverrides[0]);

await page.locator('.adm-section-image.is-changed button[aria-label^="Reset"]').click();
await page.waitForTimeout(200);
check('section: reset mengembalikan gambar asli', (await page.locator('.adm-section-image.is-changed').count()) === 0);
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await page.waitForTimeout(500);
sectionStore = await db();
check(
  'section: reset ikut tersimpan',
  Object.keys(sectionStore.pages.find((p) => p.id === 324524)?.imageOverrides || {}).length === 0,
);
await page.getByRole('button', { name: /Gambar & Aset/ }).click();
await page.waitForSelector('.adm-image-row');
const assetRows324524 = await page.locator('.adm-image-row').count();
check(
  'aset: aset dekoratif tetap lengkap di tab Gambar & Aset',
  assetRows324524 > allSectionImages.length,
  `${assetRows324524} aset vs ${allSectionImages.length} gambar section`,
);

// ------------------------------------------------- editor: tab & columns
await go('/admin/pages/324486');
await page.getByRole('button', { name: /Section & Teks/ }).click();
await page.waitForSelector('.adm-mini-field__head em');
const labels = await page.locator('.adm-mini-field__head em').allTextContents();
check('kolom: label teks terbaca', labels.length > 0 && labels.every((t) => !t.includes(' · ')), labels.slice(0, 4).join(', '));
check(
  'kolom: label tidak memakai format lama "P · id"',
  !(await page.locator('.adm-mini-field > span').allTextContents()).some((t) => t.includes(' · ')),
);
const technicalCodes = await page.locator('.adm-section code, .adm-mini-field code').count();
check('kolom: kode ID teknis tidak ditampilkan', technicalCodes === 0, `${technicalCodes} kode`);
await page.screenshot({ path: `${shotDir}/assets_sections_columns.png`, fullPage: false });

// ------------------------------------------------------ editor: image tab
await page.getByRole('button', { name: /Gambar & Aset/ }).click();
await page.waitForSelector('.adm-image-row', { timeout: 20000 });
await page.waitForFunction(() => !document.querySelector('.adm-note')?.textContent?.includes('Memindai'), null, { timeout: 20000 });
const groupCount = await page.locator('.adm-image-row').count();
check('aset: gambar terdeteksi dari konten + CSS', groupCount > 0, `${groupCount} gambar`);

const sectionLabels = await page.locator('.adm-image-section__text strong').allTextContents();
check('aset: gambar dikelompokkan per kategori', sectionLabels.length >= 2, sectionLabels.join(' · '));
const ungroupedRows = await page.evaluate(
  () => document.querySelectorAll('.adm-image-row').length - document.querySelectorAll('.adm-image-section .adm-image-row').length,
);
check('aset: semua gambar berada dalam kategori', ungroupedRows === 0, `${ungroupedRows} baris tanpa kategori`);

const firstSection = page.locator('.adm-image-section').first();
await firstSection.locator('summary').click();
await page.waitForTimeout(150);
check('aset: kategori bisa dilipat', !(await firstSection.locator('.adm-image-row').first().isVisible().catch(() => false)));
await firstSection.locator('summary').click();
await page.waitForTimeout(150);
check('aset: kategori bisa dibuka lagi', await firstSection.locator('.adm-image-row').first().isVisible());
await page.screenshot({ path: `${shotDir}/assets_images_tab.png`, fullPage: false });

// Responsif: daftar gambar tidak boleh melebar keluar layar.
await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(400);
const fitsMobile = await page.evaluate(() => {
  const list = document.querySelector('.adm-images');
  if (!list) return false;
  return list.getBoundingClientRect().right <= window.innerWidth + 1;
});
check('aset: layout gambar muat di 390px', fitsMobile);
await page.screenshot({ path: `${shotDir}/assets_images_mobile.png`, fullPage: false });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.waitForTimeout(300);

const cssRow = page.locator('.adm-image-row', { has: page.locator('.adm-image-row__badges span', { hasText: 'CSS' }) }).first();
check('aset: gambar background dari stylesheet terdeteksi', (await cssRow.count()) > 0);
const cssOriginal = (await cssRow.locator('.adm-image-row__body > code').textContent()) || '';

// Pilih satu media seed sebagai pengganti gambar CSS.
await cssRow.getByRole('button', { name: /Ganti gambar|Ganti lagi/ }).click();
await page.waitForSelector('.adm-picker__item');
await page.screenshot({ path: `${shotDir}/assets_media_picker.png`, fullPage: false });
const chosen = await page.locator('.adm-picker__item').nth(2).locator('img').getAttribute('src');
await page.locator('.adm-picker__item').nth(2).click();
await page.waitForSelector('.adm-image-row.is-changed');
check('aset: baris CSS ditandai "Diganti"', (await page.locator('.adm-image-row.is-changed').count()) === 1);

// Pilih gambar konten juga.
const htmlRow = page
  .locator('.adm-image-row')
  .filter({ hasNot: page.locator('.adm-image-row__badges span', { hasText: 'CSS' }) })
  .first();
await htmlRow.getByRole('button', { name: /Ganti gambar|Ganti lagi/ }).click();
await page.waitForSelector('.adm-picker__item');
const htmlReplacement = await page.locator('.adm-picker__item').first().locator('img').getAttribute('src');
await page.locator('.adm-picker__item').first().click();
await page.waitForTimeout(300);

// Simpan.
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await page.waitForTimeout(600);
let store = await db();
const savedPage = store.pages.find((p) => p.id === 324486);
const overrideCount = Object.keys(savedPage?.imageOverrides || {}).length;
check('aset: override tersimpan di database', overrideCount > 0, `${overrideCount} URL`);
const overrideValues = Object.values(savedPage?.imageOverrides || {});
check('aset: aset disimpan sebagai referensi media', overrideValues.every((value) => value.startsWith('media:')), overrideValues[0]);
check('aset: varian gambar berbagi satu aset', new Set(overrideValues).size === 2, `${new Set(overrideValues).size} aset unik`);

// ----------------------------------------------------------- preview page
await go('/admin/preview/324486');
await page.waitForSelector('.bydreamy-cloned');
await page.waitForFunction(() => !document.querySelector('.bydreamy-loader'), null, { timeout: 20000 });
const preview = await page.evaluate(
  ({ oldKey, nextUrl }) => {
    const style = document.querySelector('style[data-bydreamy-image-overrides]');
    const root = document.querySelector('.bydreamy-cloned');
    const styleText = style ? style.textContent || '' : '';
    return {
      styleText,
      hasOldCssUrl: oldKey ? styleText.includes(oldKey) : true,
      hasNewCssUrl: nextUrl ? styleText.includes(nextUrl) : false,
      imgCount: root ? root.querySelectorAll('img').length : 0,
    };
  },
  { oldKey: cssOriginal, nextUrl: chosen },
);
check('preview: stylesheet override disuntikkan', preview.styleText.length > 0);
check('preview: URL background lama sudah tidak dipakai', preview.hasOldCssUrl === false);
check('preview: background memakai aset pengganti', preview.hasNewCssUrl === true);
check('preview: gambar konten tetap tampil', preview.imgCount > 0, `${preview.imgCount} img`);
await page.screenshot({ path: `${shotDir}/assets_preview_after_override.png`, fullPage: false });

const htmlSwapOk = await page.evaluate((url) => {
  const root = document.querySelector('.bydreamy-cloned');
  if (!root || !url) return false;
  return Array.from(root.querySelectorAll('img')).some((img) => (img.getAttribute('src') || '') === url);
}, htmlReplacement);
check('preview: gambar konten memakai aset pengganti', htmlSwapOk, htmlReplacement || '—');

// ------------------------------------------------------------- reset all
await go('/admin/pages/324486');
await page.getByRole('button', { name: /Gambar & Aset/ }).click();
await page.waitForSelector('.adm-image-row');
await page.getByRole('button', { name: /Reset semua/ }).click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await page.waitForTimeout(500);
store = await db();
const resetPage = store.pages.find((p) => p.id === 324486);
check('aset: reset semua mengosongkan override', Object.keys(resetPage?.imageOverrides || {}).length === 0);

// --------------------------------------------------- unggah gambar baru
await page.getByRole('button', { name: /Gambar & Aset/ }).click();
await page.waitForSelector('.adm-image-row');
const uploadRow = page
  .locator('.adm-image-row')
  .filter({ has: page.locator('.adm-image-row__badges span', { hasText: 'Konten' }) })
  .first();
await uploadRow.getByRole('button', { name: /Ganti gambar/ }).click();
await page.waitForSelector('.adm-picker');
await page.setInputFiles('.adm-picker input[type=file]', 'public/wp-content/uploads/2026/02/AMEERA-SLIDE-2.webp');
await page.waitForFunction(() => !document.querySelector('.adm-picker'), null, { timeout: 25000 });
const mediaAfterUpload = (await db()).media;
const uploaded = mediaAfterUpload[0];
check('unggah: gambar dikompres ke WebP', uploaded?.url?.startsWith('data:image/webp;base64,'), uploaded?.size);
check('unggah: data URL tetap ringan', (uploaded?.url?.length || 0) < 900000, `${Math.round((uploaded?.url?.length || 0) / 1024)} KB base64`);
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await page.waitForTimeout(600);
const uploadedPage = (await db()).pages.find((p) => p.id === 324486);
const uploadedToken = Object.values(uploadedPage.imageOverrides || {})[0];
check('unggah: override memakai token media', /^media:\d+$/.test(uploadedToken || ''), uploadedToken);

await go('/admin/preview/324486');
await page.waitForSelector('.bydreamy-cloned');
await page.waitForFunction(() => !document.querySelector('.bydreamy-loader'), null, { timeout: 20000 });
const usesUpload = await page.evaluate(() => {
  const root = document.querySelector('.bydreamy-cloned');
  const style = document.querySelector('style[data-bydreamy-image-overrides]');
  // The asset may be used by an <img> or by an inline/stylesheet background.
  return Boolean(root && ((root.innerHTML || '').includes('data:image/') || (style?.textContent || '').includes('data:image/')));
});
check('unggah: preview memakai gambar unggahan', usesUpload);

// Bersihkan override agar pengujian berikutnya mulai dari asli.
await go('/admin/pages/324486');
await page.getByRole('button', { name: /Gambar & Aset/ }).click();
await page.waitForSelector('.adm-image-row');
await page.getByRole('button', { name: /Reset semua/ }).click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await page.waitForTimeout(500);

// ---------------------------------------------------------- media page
await go('/admin/media');
await page.waitForSelector('.adm-media');
check('media: badge pemakaian tampil', (await page.locator('.adm-media__usage').count()) > 0);
check('media: aksi salin URL tersedia', (await page.locator('.adm-media__actions button[title="Salin URL"]').count()) > 0);

// ------------------------------------------------------- category picker
await go('/admin/categories');
await page.waitForSelector('.adm-category');
await page.locator('.adm-category').first().getByRole('button', { name: 'Edit' }).click();
await page.waitForSelector('.adm-modal');
await page.getByRole('button', { name: 'Pilih' }).click();
await page.waitForSelector('.adm-picker');
check('kategori: picker media terbuka di form edit', (await page.locator('.adm-picker').count()) === 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(250);
check('kategori: Escape menutup picker saja', (await page.locator('.adm-picker').count()) === 0 && (await page.locator('.adm-modal').count()) > 0);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('kategori: Escape kedua menutup form', (await page.locator('.adm-modal').count()) === 0);

// ------------------------------------------------------ template create form
await go('/admin/templates');
await page.getByRole('button', { name: 'Tambah Template' }).click();
await page.waitForSelector('.adm-modal');
check('template: form tambah punya picker thumbnail', (await page.getByRole('button', { name: 'Pilih' }).count()) > 0);
await page.keyboard.press('Escape');

check('tidak ada error console/page', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();

console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exit(1);
