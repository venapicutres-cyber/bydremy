import { chromium } from 'playwright-core';
import fs from 'node:fs';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const base = 'http://localhost:3000';

// Login memakai Supabase Auth, jadi kredensial diambil dari environment.
// Jalankan: $env:QA_ADMIN_PASSWORD='…'; node scripts/qa_admin.mjs
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || 'admin@bydreamy.local';
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('QA_ADMIN_PASSWORD belum diisi. Set environment variable itu ke password akun admin Supabase.');
  process.exit(2);
}

const results = [];
let failed = 0;
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  if (!ok) {
    failed += 1;
    console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
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
// Situs publik membaca data dari Supabase, jadi tunggu debounce simpan (500 ms) + round-trip.
const openPublic = async (path) => {
  await go(path);
  await page.waitForTimeout(1200);
};

// ---------------------------------------------------------------- login
await go('/admin');
await page.getByLabel('Email', { exact: true }).fill(ADMIN_EMAIL);
await page.getByLabel('Password', { exact: true }).fill('wrong-password');
await page.getByRole('button', { name: /Masuk Dashboard/ }).click();
await page.waitForTimeout(900);
check('login: wrong password shows error', (await page.locator('.adm-alert--error').count()) > 0);

await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
await page.getByRole('button', { name: /Masuk Dashboard/ }).click();
await page.waitForSelector('.adm-shell', { timeout: 15000 });
await page.waitForTimeout(400);
check('login: valid credentials reach dashboard', (await page.locator('.adm-shell').count()) > 0);
check('dashboard: heading rendered', ((await page.locator('h1').first().textContent()) || '').trim().length > 0);

// ----------------------------------- template demo vs halaman website
await go('/admin/pages');
await page.waitForSelector('.adm-template');
const navLabels = await page.locator('.adm-nav a').allTextContents();
check('nav: menu Template Demo tersedia', navLabels.some((label) => label.includes('Template Demo')), navLabels.join(', '));
check(
  'nav: menu Halaman Website tersedia',
  navLabels.some((label) => label.includes('Halaman Website')),
  navLabels.join(', '),
);
const seedPages = JSON.parse(fs.readFileSync('src/data/generated/pages.json', 'utf8'));
const seedTemplates = seedPages.filter((page) => page.kind === 'template');
const seedWebsitePages = seedPages.filter((page) => page.kind !== 'template');
const galleryCards = await page.locator('.adm-template').count();
check(
  'template: daftar hanya menampilkan template demo',
  galleryCards === seedTemplates.length,
  `${galleryCards}/${seedTemplates.length} kartu`,
);
await page.getByRole('button', { name: 'Tabel', exact: true }).click();
await page.waitForSelector('.adm-table--pages');
const templateRows = await page.locator('.adm-table--pages tbody tr').count();
check('template: tampilan tabel menampilkan semua template', templateRows === seedTemplates.length, `${templateRows} baris`);
check(
  'template: kolom kategori tampil di tabel',
  (await page.locator('.adm-table--pages tbody tr').first().innerText()).includes('Heritage'),
);
await go('/admin/templates');
await page.waitForFunction(
  () => location.pathname === '/admin/pages' && new URLSearchParams(location.search).get('kind') === 'template',
  null,
  { timeout: 8000 },
);
await page.waitForSelector('.adm-template');
check(
  'rute lama /admin/templates diarahkan ke Template Demo',
  (await page.locator('.adm-template').count()) === seedTemplates.length,
);

await go('/admin/pages?kind=page');
await page.waitForURL(/\/admin\/homepage$/, { timeout: 8000 });
await page.waitForSelector('.adm-homepage-pages');
const websiteRows = await page.locator('.adm-homepage-pages tbody tr').count();
check(
  'halaman website: dikelola di /admin/homepage',
  websiteRows === seedWebsitePages.length,
  `${websiteRows}/${seedWebsitePages.length} baris`,
);
check(
  'halaman website: halaman template tidak ikut tampil',
  !(await page.locator('.adm-homepage-pages tbody').innerText()).includes('/demo-'),
);
const websiteSearch = page.locator('.adm-homepage-pages .adm-search input');
await websiteSearch.fill('portfolio');
await page.waitForTimeout(150);
const filteredWebsiteRows = await page.locator('.adm-homepage-pages tbody tr').count();
check('halaman website: pencarian menyaring tabel', filteredWebsiteRows === 2, `${filteredWebsiteRows} baris`);
await websiteSearch.fill('');
await page.locator('.adm-homepage-pages .adm-seg button', { hasText: 'Draft' }).click();
await page.waitForTimeout(150);
check(
  'halaman website: filter status draft berfungsi',
  (await page.locator('.adm-homepage-pages .adm-empty').count()) > 0,
);
await page.locator('.adm-homepage-pages .adm-seg button', { hasText: 'Semua' }).click();
await page.locator('.adm-homepage-pages tbody tr').nth(1).locator('input[type="checkbox"]').check();
check(
  'halaman website: aksi massal tersedia',
  (await page.locator('.adm-homepage-pages .adm-bulkbar').innerText()).includes('1 dipilih'),
);
await page.locator('.adm-homepage-pages .adm-bulkbar__clear').click();
check(
  'halaman website: tautan edit tetap di /admin/homepage',
  (await page.locator('.adm-homepage-pages tbody tr').nth(1).locator('a[title="Edit"]').getAttribute('href'))?.startsWith(
    '/admin/homepage/',
  ),
);

// ------------------------------------------------------------- pages CRUD
await go('/admin/homepage/new');
await page.getByLabel('Nama halaman', { exact: true }).fill('QA Test Page');
await page.getByLabel('Judul', { exact: true }).fill('QA Test Page Title');
await page.locator('.adm-side-card').first().locator('select').selectOption('published');
await page.getByRole('button', { name: 'Buat Halaman' }).click();
await page.waitForURL(/\/admin\/homepage\/\d+$/, { timeout: 8000 });
const pageId = Number(page.url().match(/homepage\/(\d+)$/)[1]);
check('page: created with published status', (await db()).pages?.some((p) => p.id === pageId && p.status === 'published'));
check(
  'page: editor halaman tetap di /admin/homepage',
  (await page.locator('.adm-back').innerText()).includes('Halaman Website'),
);

await openPublic('/qa-test-page');
let bodyText = await page.locator('body').innerText();
check('page: public route renders new page', bodyText.includes('QA Test Page') && !bodyText.includes('Halaman tidak ditemukan'));

// Draft hides the page from the public site.
await go(`/admin/homepage/${pageId}`);
await page.locator('.adm-side-card').first().locator('select').selectOption('draft');
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await openPublic('/qa-test-page');
bodyText = await page.locator('body').innerText();
check('page: draft hidden from public route', bodyText.includes('Halaman tidak ditemukan'));

// Publish again.
await go(`/admin/homepage/${pageId}`);
await page.locator('.adm-side-card').first().locator('select').selectOption('published');
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await openPublic('/qa-test-page');
bodyText = await page.locator('body').innerText();
check('page: republished renders again', bodyText.includes('QA Test Page') && !bodyText.includes('Halaman tidak ditemukan'));

// Delete via editor.
await go(`/admin/homepage/${pageId}`);
await page.getByRole('button', { name: /Lanjutan/ }).click();
await page.getByRole('button', { name: /Hapus Halaman/ }).click();
await page.waitForURL(/\/admin\/homepage$/, { timeout: 8000 });
check('page: deleted', !(await db()).pages?.some((p) => p.id === pageId));
await openPublic('/qa-test-page');
check('page: deleted route returns not found', (await page.locator('body').innerText()).includes('Halaman tidak ditemukan'));

// ---------------------------------------------- template edit + revert (Sage)
await go('/admin/pages/17655');
await page.waitForTimeout(900);
const headingInput = page.locator('.adm-section .adm-mini-field input').first();
const originalHeading = await headingInput.inputValue();
await headingInput.fill('QA OUR STORY');
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await openPublic('/demo-premium-03-sage');
bodyText = await page.locator('body').innerText();
check('template: heading override applied on route', bodyText.includes('QA OUR STORY'));

// Hide a section and verify on the public route.
await go('/admin/pages/17655');
await page.waitForTimeout(900);
await page.locator('.adm-section').first().getByRole('button', { name: /Sembunyikan/ }).click();
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await page.waitForTimeout(200);
const hiddenIds = (await db()).pages.find((p) => p.id === 17655)?.hiddenSectionIds || [];
check('template: hidden section id stored', hiddenIds.length > 0, hiddenIds[0] || 'kosong');
const sectionId = hiddenIds[0];
await openPublic('/demo-premium-03-sage');
check(
  'template: section hidden on public route',
  await page.evaluate(
    (id) => document.querySelector(`[data-id="${id}"]`)?.style.display === 'none',
    sectionId,
  ),
);

// Revert dashboard changes.
await go('/admin/pages/17655');
await page.waitForTimeout(900);
await page.locator('.adm-section .adm-mini-field input').first().fill(originalHeading);
await page.locator('.adm-section').first().getByRole('button', { name: /Tampilkan/ }).click();
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await openPublic('/demo-premium-03-sage');
bodyText = await page.locator('body').innerText();
check('template: changes reverted', !bodyText.includes('QA OUR STORY'));
check(
  'template: section visible again',
  await page.evaluate(
    (id) => document.querySelector(`[data-id="${id}"]`)?.style.display !== 'none',
    sectionId,
  ),
);

// ---------------------------------------------------------- templates CRUD
await go('/admin/templates');
await page.waitForTimeout(400);
const beforeTemplates = (await db()).pages.filter((p) => p.kind === 'template').length;
check('templates: seed count is 25', beforeTemplates === 25, String(beforeTemplates));
await page.getByRole('button', { name: /Tambah Template/ }).click();
const dialog = page.getByRole('dialog');
await dialog.getByLabel('Nama template').fill('QA Template');
await dialog.getByRole('button', { name: 'Buat Template' }).click();
await page.waitForURL(/\/admin\/pages\/\d+$/, { timeout: 8000 });
const templateId = Number(page.url().match(/pages\/(\d+)$/)[1]);
await page.locator('.adm-side-card').first().locator('select').selectOption('published');
await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
await go('/admin/templates');
await page.waitForTimeout(400);
check('templates: created', (await page.locator('.adm-template', { hasText: 'QA Template' }).count()) > 0);
check('templates: count is 26', (await db()).pages.filter((p) => p.kind === 'template').length === 26);

await go(`/admin/pages/${templateId}`);
await page.getByRole('button', { name: /Lanjutan/ }).click();
await page.getByRole('button', { name: /Hapus Halaman/ }).click();
await page.waitForURL(/\/admin\/pages\/?$/, { timeout: 8000 });
await go('/admin/templates');
await page.waitForTimeout(300);
check('templates: deleted', (await db()).pages.filter((p) => p.kind === 'template').length === 25);

// --------------------------------------------------------- categories CRUD
await go('/admin/categories');
await page.getByRole('button', { name: /Kategori Baru/ }).click();
await page.getByRole('dialog').getByLabel('Nama kategori').fill('QA Wedding');
await page.getByRole('dialog').getByRole('button', { name: 'Buat Kategori' }).click();
await page.waitForTimeout(300);
check('categories: created', (await page.locator('.adm-category', { hasText: 'QA Wedding' }).count()) > 0);

let categoryCard = page.locator('.adm-category', { hasText: 'QA Wedding' });
await categoryCard.getByRole('button', { name: /Edit/ }).click();
await page.getByRole('dialog').getByLabel('Nama kategori').fill('QA Wedding Updated');
await page.getByRole('dialog').getByRole('button', { name: 'Simpan Perubahan' }).click();
await page.waitForTimeout(300);
check('categories: edited', (await page.locator('.adm-category', { hasText: 'QA Wedding Updated' }).count()) > 0);
await page.locator('.adm-category', { hasText: 'QA Wedding Updated' }).locator('.adm-icon-btn--danger').click();
await page.waitForTimeout(300);
check('categories: deleted', (await page.locator('.adm-category', { hasText: 'QA Wedding' }).count()) === 0);

// ------------------------------------------------------------- media CRUD
await go('/admin/media');
await page.getByRole('button', { name: /Tambah Media/ }).click();
await page.getByRole('dialog').getByLabel('Nama file').fill('qa-cover.jpg');
await page.getByRole('dialog').getByLabel('URL gambar').fill('/wp-content/uploads/2026/02/AMEERA-SLIDE-1.webp');
await page.getByRole('dialog').getByRole('button', { name: 'Tambahkan' }).click();
await page.waitForTimeout(300);
check('media: created', (await page.locator('.adm-media', { hasText: 'qa-cover.jpg' }).count()) > 0);
await page.locator('.adm-media', { hasText: 'qa-cover.jpg' }).getByTitle('Edit').click();
await page.getByRole('dialog').getByLabel('Nama file').fill('qa-cover-2.jpg');
await page.getByRole('dialog').getByRole('button', { name: 'Simpan' }).click();
await page.waitForTimeout(300);
check('media: edited', (await page.locator('.adm-media', { hasText: 'qa-cover-2.jpg' }).count()) > 0);
await page.locator('.adm-media', { hasText: 'qa-cover-2.jpg' }).locator('.adm-icon-btn--danger').click();
await page.waitForTimeout(300);
check('media: deleted', (await page.locator('.adm-media', { hasText: 'qa-cover-2.jpg' }).count()) === 0);

// ------------------------------------------------------------ orders CRUD
await go('/admin/orders');
await page.getByRole('button', { name: /Pesanan Baru/ }).click();
const orderDialog = page.getByRole('dialog');
await orderDialog.getByLabel('Nama pelanggan').fill('QA Customer');
await orderDialog.getByLabel('Email').fill('qa-order@example.com');
await orderDialog.getByLabel('No. WhatsApp').fill('6281234567890');
await orderDialog.getByRole('button', { name: 'Buat Pesanan' }).click();
await page.waitForTimeout(300);
let orderRow = page.locator('tbody tr', { hasText: 'QA Customer' });
check('orders: created', (await orderRow.count()) > 0);
await orderRow.locator('select').selectOption('paid');
await page.waitForTimeout(300);
check('orders: status changed to paid', (await orderRow.locator('select').inputValue()) === 'paid');
await orderRow.getByRole('button', { name: 'Edit' }).click();
await page.getByRole('dialog').getByLabel('Paket').fill('QA Package');
await page.getByRole('dialog').getByRole('button', { name: 'Simpan Pesanan' }).click();
await page.waitForTimeout(300);
check('orders: edited', (await page.locator('tbody tr', { hasText: 'QA Customer' }).innerText()).includes('QA Package'));
await page.locator('tbody tr', { hasText: 'QA Customer' }).locator('.adm-icon-btn--danger').click();
await page.waitForTimeout(300);
check('orders: deleted', (await page.locator('tbody tr', { hasText: 'QA Customer' }).count()) === 0);

// --------------------------------------------------------- customers CRUD
await go('/admin/customers');
await page.getByRole('button', { name: /Pelanggan Baru/ }).click();
await page.getByRole('dialog').getByLabel('Nama lengkap').fill('QA Pelanggan');
await page.getByRole('dialog').getByLabel('Email').fill('qa-customer@example.com');
await page.getByRole('dialog').getByRole('button', { name: 'Tambahkan' }).click();
await page.waitForTimeout(300);
let customerRow = page.locator('tbody tr', { hasText: 'QA Pelanggan' });
check('customers: created', (await customerRow.count()) > 0);
await customerRow.getByRole('button', { name: 'Edit' }).click();
await page.getByRole('dialog').getByLabel('Nama lengkap').fill('QA Pelanggan Updated');
await page.getByRole('dialog').getByRole('button', { name: 'Simpan' }).click();
await page.waitForTimeout(300);
check('customers: edited', (await page.locator('tbody tr', { hasText: 'QA Pelanggan Updated' }).count()) > 0);
await page.locator('tbody tr', { hasText: 'QA Pelanggan Updated' }).locator('.adm-icon-btn--danger').click();
await page.waitForTimeout(300);
check('customers: deleted', (await page.locator('tbody tr', { hasText: 'QA Pelanggan' }).count()) === 0);

// ------------------------------------------------------------- users CRUD
await go('/admin/users');
await page.getByRole('button', { name: /Pengguna Baru/ }).click();
await page.getByRole('dialog').getByLabel('Nama', { exact: true }).fill('QA User');
await page.getByRole('dialog').getByLabel('Email').fill('qa-user@example.com');
await page.getByRole('dialog').getByRole('button', { name: 'Tambahkan' }).click();
await page.waitForTimeout(300);
let userRow = page.locator('tbody tr', { hasText: 'QA User' });
check('users: created', (await userRow.count()) > 0);
await userRow.locator('.adm-status-btn').click();
await page.waitForTimeout(200);
check('users: status toggled to inactive', (await userRow.innerText()).toLowerCase().includes('inactive'));
await userRow.getByRole('button', { name: 'Edit' }).click();
await page.getByRole('dialog').getByLabel('Nama', { exact: true }).fill('QA User Updated');
await page.getByRole('dialog').getByRole('button', { name: 'Simpan' }).click();
await page.waitForTimeout(300);
check('users: edited', (await page.locator('tbody tr', { hasText: 'QA User Updated' }).count()) > 0);
await page.locator('tbody tr', { hasText: 'QA User Updated' }).locator('.adm-icon-btn--danger').click();
await page.waitForTimeout(300);
check('users: deleted', (await page.locator('tbody tr', { hasText: 'QA User' }).count()) === 0);

// ------------------------------------------------------------ settings save
await go('/admin/settings');
const siteNameInput = page.getByLabel('Nama website');
const siteNameOriginal = await siteNameInput.inputValue();
await siteNameInput.fill('bydreamy QA');
await page.getByRole('button', { name: /Simpan Pengaturan/ }).click();
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(400);
check('settings: site name persisted', (await page.getByLabel('Nama website').inputValue()) === 'bydreamy QA');
await page.getByLabel('Nama website').fill(siteNameOriginal);
await page.getByRole('button', { name: /Simpan Pengaturan/ }).click();

// ------------------------------------------------------------ homepage meta
await go('/admin/homepage');
await page.waitForTimeout(500);
const homeTitleInput = page.getByLabel('Title tag homepage');
const homeTitleOriginal = await homeTitleInput.inputValue();
await homeTitleInput.fill('QA Homepage Title');
await page.getByRole('button', { name: /Simpan Homepage/ }).click();
await openPublic('/');
check('homepage: title tag persisted', (await page.title()) === 'QA Homepage Title', await page.title());
await go('/admin/homepage');
await page.waitForTimeout(500);
await page.getByLabel('Title tag homepage').fill(homeTitleOriginal);
await page.getByRole('button', { name: /Simpan Homepage/ }).click();

// ------------------------------------------------------------------- SEO
await go('/admin/seo');
const seoTitleInput = page.locator('.adm-input-block input').first();
const seoOriginal = await seoTitleInput.inputValue();
await seoTitleInput.fill('bydreamy QA SEO Title');
await page.getByRole('button', { name: /Simpan SEO/ }).click();
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(400);
check('seo: title persisted', (await page.locator('.adm-input-block input').first().inputValue()) === 'bydreamy QA SEO Title');
await page.locator('.adm-input-block input').first().fill(seoOriginal);
await page.getByRole('button', { name: /Simpan SEO/ }).click();

// ------------------------------------------------------------- navigation
await go('/admin/navigation');
await page.getByRole('button', { name: /Tambah item menu/ }).click();
const menuLabels = page.locator('input[aria-label="Label menu"]');
await menuLabels.last().fill('QA Menu');
await page.getByRole('button', { name: /Simpan Perubahan/ }).click();
await openPublic('/tentang');
check('navigation: new menu appears on React pages', (await page.locator('body').innerText()).toUpperCase().includes('QA MENU'));
await go('/admin/navigation');
await page.locator('.adm-nav-row').last().getByTitle('Hapus').click();
await page.getByRole('button', { name: /Simpan Perubahan/ }).click();

// ---------------------------------------------------------------- preview
await go('/admin/preview/17655');
await page.waitForTimeout(1200);
check('preview: bar and cloned content render', (await page.locator('.adm-preview__bar').count()) > 0 && (await page.locator('.elementor-widget').count()) > 20);

// ----------------------------------------------------------------- report
const report = { failed, total: results.length, results, errors };
fs.writeFileSync('capture/qa/admin-report.json', JSON.stringify(report, null, 2));
console.log(`\n${results.length - failed}/${results.length} checks passed, ${errors.length} console/page errors.`);
if (errors.length) console.log(errors.slice(0, 10));
await browser.close();
process.exit(failed ? 1 : 0);
