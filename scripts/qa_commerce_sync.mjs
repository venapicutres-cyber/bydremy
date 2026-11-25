import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:/Users/PC - SIGAMPANG/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe';
const base = 'http://localhost:3000';
const KEY = 'bydreamy.admin.v1';
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
const dialogs = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200));
});
page.on('dialog', (d) => {
  dialogs.push({ type: d.type(), message: d.message() });
  d.accept();
});

const go = (p) => page.goto(base + p, { waitUntil: 'domcontentloaded' });
const store = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const statTexts = () =>
  page.locator('.adm-mini-stat strong').allInnerTexts().then((list) => list.map((t) => t.trim()));
const money = (text) => Number(String(text).replace(/[^\d]/g, '')) || 0;

// ---------------------------------------------------------------- login
await go('/admin');
const adminPassword = process.env.QA_ADMIN_PASSWORD;
if (!adminPassword) throw new Error('QA_ADMIN_PASSWORD belum diisi.');
await page.getByLabel('Password', { exact: true }).fill(adminPassword);
await page.getByRole('button', { name: /Masuk Dashboard/ }).click();
await page.waitForFunction(() => Boolean(localStorage.getItem('bydreamy.admin.session')), null, { timeout: 8000 });

// ------------------------------------------- kondisi awal: seed bersih
await page.evaluate((k) => localStorage.removeItem(k), KEY);
await go('/admin/orders');
await page.waitForSelector('.adm-mini-stat');
const orderStats = await statTexts(); // [Pendapatan, Potensi, Total pesanan, Rata-rata]
check('seed: pendapatan pesanan terbayar', money(orderStats[0]) === 2945000, orderStats[0]);
check('seed: total pesanan 10', orderStats[2] === '10', orderStats[2]);

await go('/admin/customers');
await page.waitForSelector('.adm-mini-stat');
const custStats = await statTexts(); // [Total pelanggan, Berulang, Total nilai, Rata-rata]
check('seed: pelanggan 10', custStats[0] === '10', custStats[0]);
check('seed: tidak ada pelanggan berulang palsu', custStats[1] === '0', custStats[1]);
check(
  'sinkron: "Total nilai pelanggan" = "Pendapatan" di Pesanan',
  money(custStats[2]) === money(orderStats[0]),
  `${custStats[2]} vs ${orderStats[0]}`,
);

// --------------------------------------- buat pesanan pelanggan baru
const createOrder = async ({ name, email, total, status }) => {
  await go('/admin/orders');
  await page.getByRole('button', { name: /Pesanan Baru/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama pelanggan').fill(name);
  await dialog.getByLabel('Email').fill(email);
  // Select Status = select ke-3 di modal (Pelanggan, Template, Status): labelnya
  // tercampur teks opsi sehingga tidak bisa dicari lewat getByLabel.
  await dialog.locator('select').nth(2).selectOption(status);
  await dialog.getByLabel('Total (Rp)').fill(String(total));
  await dialog.getByRole('button', { name: 'Buat Pesanan' }).click();
  await page.waitForTimeout(400);
};

await createOrder({ name: 'QA Sync', email: 'qa.sync@example.com', total: 500000, status: 'paid' });
let data = await store();
check('pesanan: nomor berurutan (ATT-2411)', data.orders[0].id === 'ATT-2411', data.orders[0].id);
check('pesanan: total pesanan jadi 11', data.orders.length === 11, String(data.orders.length));
check(
  'pelanggan: email baru otomatis terdaftar',
  data.customers.filter((c) => c.email.toLowerCase() === 'qa.sync@example.com').length === 1,
  String(data.customers.length),
);
check('pelanggan: tidak ada field pesanan tersimpan lagi', !('orders' in (data.customers.find((c) => c.email === 'qa.sync@example.com') || {})));

await go('/admin/customers');
await page.waitForSelector('.adm-mini-stat');
let cs = await statTexts();
check('sinkron: pelanggan 11 & nilai ikut naik', cs[0] === '11' && money(cs[2]) === 3445000, `${cs[0]} / ${cs[2]}`);
let row = page.locator('tr', { hasText: 'qa.sync@example.com' });
check('pelanggan: baris menampilkan 1 pesanan', (await row.locator('.adm-count').innerText()).trim() === '1');

// ------------- pesanan kedua, email sama beda huruf besar/spasi
await createOrder({ name: 'QA Sync', email: '  QA.Sync@Example.com  ', total: 500000, status: 'paid' });
data = await store();
check('pesanan: nomor lanjut ATT-2412', data.orders[0].id === 'ATT-2412', data.orders[0].id);
check(
  'pelanggan: email sama tidak terduplikasi',
  data.customers.filter((c) => c.email.trim().toLowerCase() === 'qa.sync@example.com').length === 1,
  String(data.customers.length),
);
check('pelanggan: total tetap 11', data.customers.length === 11, String(data.customers.length));

await go('/admin/customers');
await page.waitForSelector('.adm-mini-stat');
cs = await statTexts();
row = page.locator('tr', { hasText: 'qa.sync@example.com' });
check('pelanggan: baris jadi 2 pesanan', (await row.locator('.adm-count').innerText()).trim() === '2');
check('pelanggan: berulang jadi 1', cs[1] === '1', cs[1]);
check('sinkron: nilai jadi 3.945.000', money(cs[2]) === 3945000, cs[2]);

await go('/admin/orders');
orderStats.length = 0;
orderStats.push(...(await statTexts()));
await go('/admin/customers');
await page.waitForSelector('.adm-mini-stat');
cs = await statTexts();
check('sinkron: nilai pelanggan = pendapatan pesanan (setelah tambah)', money(cs[2]) === money(orderStats[0]), `${cs[2]} vs ${orderStats[0]}`);

// --------------------------------- hapus pesanan → hitungan ikut turun
await go('/admin/orders');
await page.locator('tr', { hasText: 'ATT-2412' }).locator('button').last().click();
await page.waitForTimeout(400);
data = await store();
check('hapus pesanan: pesanan hilang', !data.orders.some((o) => o.id === 'ATT-2412'));
await go('/admin/customers');
await page.waitForSelector('.adm-mini-stat');
row = page.locator('tr', { hasText: 'qa.sync@example.com' });
check('hapus pesanan: hitungan pelanggan turun jadi 1', (await row.locator('.adm-count').innerText()).trim() === '1');

// --------------------- pelanggan yang masih punya pesanan tidak bisa dihapus
dialogs.length = 0;
await row.locator('button').last().click();
await page.waitForTimeout(300);
check('proteksi: peringatan pesanan muncul', dialogs.some((d) => d.type === 'alert' && d.message.includes('masih memiliki 1 pesanan')));
data = await store();
check('proteksi: pelanggan tidak jadi terhapus', data.customers.length === 11, String(data.customers.length));

// ---------------- hapus pesanan terakhir → pelanggan boleh dihapus
await go('/admin/orders');
await page.locator('tr', { hasText: 'ATT-2411' }).locator('button').last().click();
await page.waitForTimeout(400);
await go('/admin/customers');
await page.waitForSelector('.adm-mini-stat');
row = page.locator('tr', { hasText: 'qa.sync@example.com' });
check('pesanan habis: hitungan 0', (await row.locator('.adm-count').innerText()).trim() === '0');
await row.locator('button').last().click();
await page.waitForTimeout(400);
data = await store();
check('pelanggan tanpa pesanan: bisa dihapus', data.customers.length === 10, String(data.customers.length));

// ---------------- pemilih pelanggan menjaga email tetap identik
await go('/admin/orders');
await page.getByRole('button', { name: /Pesanan Baru/ }).click();
let dlg = page.getByRole('dialog');
await dlg.locator('select').first().selectOption({ index: 1 });
check('picker: kontak pelanggan ikut terisi', (await dlg.locator('.adm-inline').innerText()).includes('astri@example.com'));
check('picker: input manual disembunyikan', (await dlg.getByLabel('Nama pelanggan', { exact: true }).count()) === 0);
await dlg.locator('select').nth(2).selectOption('paid');
await dlg.getByRole('button', { name: 'Buat Pesanan' }).click();
await page.waitForTimeout(400);
data = await store();
check('picker: pesanan memakai email pelanggan persis', data.orders[0].email === 'astri@example.com', data.orders[0].email);
check('picker: pelanggan tidak terduplikasi', data.customers.length === 10, String(data.customers.length));
await go('/admin/customers');
await page.waitForSelector('.adm-mini-stat');
row = page.locator('tr', { hasText: 'astri@example.com' });
check('picker: hitungan pelanggan jadi 2', (await row.locator('.adm-count').innerText()).trim() === '2');

// ---------------------------------- DP sebagian + tanggal bayar
await go('/admin/orders');
await page.waitForSelector('.adm-mini-stat');
const beforeDp = await statTexts();
await page.getByRole('button', { name: /Pesanan Baru/ }).click();
dlg = page.getByRole('dialog');
await dlg.getByLabel('Nama pelanggan').fill('DP Tester');
await dlg.getByLabel('Email').fill('dp.tester@example.com');
await dlg.getByLabel('Total (Rp)').fill('1000000');
await dlg.getByLabel('Sudah dibayar (Rp)').fill('400000');
await dlg.locator('select').nth(2).selectOption('in_progress');
await dlg.getByRole('button', { name: 'Buat Pesanan' }).click();
await page.waitForTimeout(400);
data = await store();
const dpOrder = data.orders.find((order) => order.email === 'dp.tester@example.com');
check('dp: nominal dibayar tersimpan', dpOrder?.paid === 400000, String(dpOrder?.paid));
await go('/admin/orders');
await page.waitForSelector('.adm-mini-stat');
const afterDp = await statTexts();
check('dp: pendapatan naik sebesar DP', money(afterDp[0]) - money(beforeDp[0]) === 400000, `${beforeDp[0]} → ${afterDp[0]}`);
check('dp: belum dibayar naik sebesar sisa', money(afterDp[1]) - money(beforeDp[1]) === 600000, `${beforeDp[1]} → ${afterDp[1]}`);
check('dp: tabel menandai DP', (await page.locator('tr', { hasText: dpOrder.id }).innerText()).includes('DP'));

// ------------------------ ubah status lewat tabel menyamakan jumlah terbayar
const dpRow = page.locator('tr', { hasText: dpOrder.id });
await dpRow.locator('select').selectOption('paid');
await page.waitForTimeout(400);
data = await store();
check('status: paid otomatis melunasi', data.orders.find((order) => order.id === dpOrder.id).paid === 1000000);

// ---------------------------------- riwayat pesanan per pelanggan
await go('/admin/customers');
await page.waitForSelector('.adm-mini-stat');
await page.locator('tr', { hasText: 'dp.tester@example.com' }).locator('.adm-person__name').click();
await page.waitForTimeout(300);
dlg = page.getByRole('dialog');
const historyText = await dlg.innerText();
check('riwayat: menampilkan pesanan pelanggan', historyText.includes(dpOrder.id) && historyText.includes('1 pesanan'));

// ---------------------------------------- nota cetak & WhatsApp
await go('/admin/orders');
const notaRow = page.locator('tr', { hasText: dpOrder.id });
const waHref = await notaRow.locator('a[title="Kirim ringkasan via WhatsApp"]').getAttribute('href');
check('whatsapp: pesan memuat nomor pesanan', decodeURIComponent(waHref || '').includes(dpOrder.id), String(waHref).slice(0, 48));
const [popup] = await Promise.all([
  page.waitForEvent('popup', { timeout: 4000 }).catch(() => null),
  notaRow.locator('button[title="Cetak nota"]').click(),
]);
check('nota: jendela cetak terbuka', Boolean(popup));
if (popup) {
  const notaHtml = await popup.content();
  check('nota: memuat nomor & total pesanan', notaHtml.includes(dpOrder.id) && notaHtml.includes('1.000.000'));
  await popup.close();
}

// ------------------------------------------ backup export & import
await go('/admin');
await page.waitForSelector('.adm-backup__file', { state: 'attached' });
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  page.getByRole('button', { name: /Export JSON/ }).click(),
]);
check('backup: file JSON terunduh', Boolean(download), download ? download.suggestedFilename() : '');
const backupPath = download ? await download.path() : '';
const backupText = backupPath ? fs.readFileSync(backupPath, 'utf8') : '{}';
const backupOrders = JSON.parse(backupText).orders?.length ?? -1;
check('backup: isi memuat pesanan & pelanggan', backupText.includes('"orders"') && backupText.includes('"customers"'));
check('backup: memuat pesanan DP terbaru', backupText.includes(dpOrder.id));

await page.locator('.adm-backup__file').setInputFiles(backupPath);
await page.waitForTimeout(500);
data = await store();
check('import: data kembali utuh', data.orders.length === backupOrders, `${data.orders.length} vs ${backupOrders}`);

const brokenPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-backup-')), 'rusak.json');
fs.writeFileSync(brokenPath, '{ "pages": [] }');
await page.locator('.adm-backup__file').setInputFiles(brokenPath);
await page.waitForTimeout(400);
check('import: file rusak ditolak', (await page.locator('.adm-backup__note--status').innerText()).includes('Gagal impor'));
data = await store();
check('import: data tidak berubah setelah file rusak', data.orders.length === backupOrders, String(data.orders.length));

check('tidak ada error konsol/halaman', errors.length === 0, errors.slice(0, 3).join(' | '));

await page.evaluate((k) => localStorage.removeItem(k), KEY);
fs.writeFileSync('capture/qa/commerce-sync-report.json', JSON.stringify({ failed, total: results.length, results, errors }, null, 2));
console.log(`\n${results.length - failed}/${results.length} checks passed, ${errors.length} errors.`);
await browser.close();
process.exit(failed ? 1 : 0);
