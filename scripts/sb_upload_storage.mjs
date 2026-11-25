// Mengunggah aset yang dipakai ke Supabase Storage bucket "assets", dengan
// struktur path identik seperti di public/ (mis. wp-content/uploads/...).
//
// Memakai Storage REST API + service_role key dari .env, karena `supabase
// storage cp -r` belum mendukung penyalinan rekursif ke remote.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const STAGE = join(resolve(ROOT, '..'), 'attar-storage-stage');
const BUCKET = 'assets';
const CONCURRENCY = Number(process.env.UPLOAD_JOBS || 10);

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }),
);

const SUPABASE_URL = env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env');
  process.exit(1);
}

const TYPES = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  ico: 'image/x-icon',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf',
  html: 'text/html',
};

const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/');

/** Daftar seluruh object di bucket (rekursif) supaya unggahan bisa melompati yang sudah ada. */
async function listBucket() {
  const keys = new Set();
  const pending = [''];
  while (pending.length) {
    const prefix = pending.pop();
    for (let offset = 0; ; offset += 1000) {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
      });
      if (!res.ok) throw new Error(`list ${prefix}: ${res.status} ${await res.text()}`);
      const rows = await res.json();
      for (const row of rows) {
        const path = prefix ? `${prefix}/${row.name}` : row.name;
        if (row.id === null) pending.push(path);
        else keys.add(path);
      }
      if (rows.length < 1000) break;
    }
  }
  return keys;
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts', 'out', 'assets-manifest.json'), 'utf8'));
const limit = Number(process.env.UPLOAD_LIMIT || 0);
const onlyMissing = process.env.UPLOAD_MODE === 'missing';
let targets = manifest.files.filter((f) => existsSync(join(STAGE, f.path)));
if (limit) targets = targets.slice(0, limit);
if (onlyMissing) {
  const existing = await listBucket();
  const before = targets.length;
  targets = targets.filter((f) => !existing.has(f.path));
  console.log(`Lewati ${before - targets.length} object yang sudah ada di bucket.`);
}

console.log(`Mengunggah ${targets.length} file ke ${SUPABASE_URL}/storage/v1/object/${BUCKET}/ ...`);

let done = 0;
let failed = 0;
let uploadedBytes = 0;
const errors = [];
const started = Date.now();

async function upload(entry, attempt = 1) {
  const file = join(STAGE, entry.path);
  const ext = entry.path.split('.').pop().toLowerCase();
  const body = readFileSync(file);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodePath(entry.path)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-upsert': 'true',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    if (attempt < 3 && res.status >= 500) return upload(entry, attempt + 1);
    throw new Error(`${res.status} ${text.slice(0, 200)}`);
  }
  uploadedBytes += statSync(file).size;
  done += 1;
  if (done % 200 === 0 || done === targets.length) {
    const mb = (uploadedBytes / 1048576).toFixed(1);
    const secs = ((Date.now() - started) / 1000).toFixed(0);
    console.log(`  ${done}/${targets.length} file (${mb} MB, ${secs}s)`);
  }
}

const queue = [...targets];
async function worker() {
  while (queue.length) {
    const entry = queue.shift();
    try {
      await upload(entry);
    } catch (error) {
      failed += 1;
      errors.push(`${entry.path}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nSelesai: ${done} berhasil, ${failed} gagal, ${(uploadedBytes / 1048576).toFixed(1)} MB`);
if (errors.length) {
  console.log('--- gagal ---');
  errors.slice(0, 20).forEach((e) => console.log(`  ${e}`));
}
