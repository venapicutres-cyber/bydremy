// Memindai aset lokal yang BENAR-BENAR dipakai aplikasi, supaya hanya file itu
// yang diunggah ke Supabase Storage.
//
// Sumber pemindaian:
//   - HTML konten (src/content/pages/*.html)
//   - Seed data (src/data/**/*.json, src/data/*.ts)
//   - Kode & style aplikasi (src/**/*.{ts,tsx,css}) + index.html
//   - Semua CSS di public/site-css (dirujuk langsung maupun dinamis per halaman)
//   - Transitive: url() di dalam setiap CSS yang ditemukan ikut dipindai
//
// Output: scripts/out/assets-manifest.json
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, posix } from 'node:path';

const ROOT = resolve(process.cwd());
const PUBLIC = join(ROOT, 'public');
const OUT_DIR = join(ROOT, 'scripts', 'out');

// Prefix root-absolute yang dipakai clone (satu origin dengan halaman).
const PREFIXES = [
  'wp-content',
  'wp-includes',
  'site-css',
  'code.jquery.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'www.youtube.com',
  'connect.facebook.net',
  's.w.org',
  'www.googletagmanager.com',
  'static.cloudflareinsights.com',
];

// Cocok untuk "/wp-content/..." atau url(/...). Bentuk escape JSON ("\/wp-content\/...")
// disamakan lebih dulu di scanText supaya path ter-escape ikut terbaca utuh.
// Char-class sengaja berhenti di delimiter JSON/HTML (", &, {, }, koma, dst) agar path
// tidak "menelan" atribut berikutnya pada data-settings Elementor.
const ASSET_RE = new RegExp(
  `\\/(${PREFIXES.map((p) => p.replace(/\./g, '\\.')).join('|')})\\/[^"'\\s)\\\\<>{}&,:?*|` + '`' + `]+`,
  'g',
);

function walk(dir, filter, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full, filter, acc);
    } else if (filter(full)) {
      acc.push(full);
    }
  }
  return acc;
}

function normalize(raw) {
  let p = raw.replace(/\\\//g, '/');
  p = p.split('#')[0].split('?')[0];
  try {
    p = decodeURIComponent(p);
  } catch {
    /* biarkan apa adanya */
  }
  return p.replace(/^\/+/, '');
}

const refs = new Map(); // path -> Set(sumber)
const queue = [];
const seen = new Set();

function addRef(raw, source) {
  const p = normalize(raw);
  if (!p || p.startsWith('src/')) return;
  // Buang placeholder di kode (mis. "/wp-content/…", `/site-css/${css}`).
  if (/[${}*]|\.\.\./.test(p)) return;
  if (!PREFIXES.some((prefix) => p.startsWith(`${prefix}/`))) return;
  if (!refs.has(p)) refs.set(p, new Set());
  refs.get(p).add(source);
  if (!seen.has(p)) {
    seen.add(p);
    queue.push(p);
  }
}

function scanText(text, source) {
  // Atribut Elementor menyimpan path sebagai JSON escape ("\/wp-content\/...");
  // normalkan garis miring lebih dulu agar pola di atas menemukan path utuh.
  const normalized = text.replace(/\\\//g, '/');
  const matches = normalized.match(ASSET_RE);
  if (matches) matches.forEach((m) => addRef(m, source));
}

// --- 1. Sumber teks statis -------------------------------------------------
const sourceFiles = [
  join(ROOT, 'index.html'),
  ...walk(join(ROOT, 'src'), (f) => /\.(ts|tsx|css|html|json)$/.test(f)),
  ...walk(join(PUBLIC, 'site-css'), (f) => f.endsWith('.css')),
];

for (const file of sourceFiles) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  scanText(readFileSync(file, 'utf8'), rel);
}

// Stylesheet halaman dirujuk lewat nama berkas saja (kolom `css`, mis.
// "post-80785.css") lalu dipanggil aplikasi sebagai `/site-css/<nama>`, jadi
// pemindai teks tidak pernah melihat path lengkapnya. Daftarkan semua CSS di
// public/site-css supaya berkas yang dipakai per halaman ikut terunggah.
for (const file of walk(join(PUBLIC, 'site-css'), (f) => f.endsWith('.css'))) {
  addRef(`/site-css/${relative(join(PUBLIC, 'site-css'), file).replace(/\\/g, '/')}`, 'public/site-css');
}

// --- 2. Transitive: CSS yang dirujuk ikut dipindai url()-nya ----------------
let cursor = 0;
while (cursor < queue.length) {
  const assetPath = queue[cursor++];
  if (!assetPath.endsWith('.css')) continue;
  const full = join(PUBLIC, assetPath);
  if (!existsSync(full)) continue;
  scanText(readFileSync(full, 'utf8'), assetPath);
}

// --- 3. Resolusi ke public/ ------------------------------------------------
const files = [];
const missing = [];
let totalBytes = 0;

for (const [assetPath, sources] of [...refs.entries()].sort()) {
  const full = join(PUBLIC, assetPath);
  if (!existsSync(full) || !statSync(full).isFile()) {
    missing.push({ path: assetPath, refs: [...sources] });
    continue;
  }
  const size = statSync(full).size;
  totalBytes += size;
  files.push({ path: assetPath, size, refs: [...sources].slice(0, 4) });
}

mkdirSync(OUT_DIR, { recursive: true });
const manifest = {
  generatedAt: new Date().toISOString(),
  fileCount: files.length,
  totalBytes,
  totalMB: Number((totalBytes / 1048576).toFixed(1)),
  files,
  missing,
};
writeFileSync(join(OUT_DIR, 'assets-manifest.json'), JSON.stringify(manifest, null, 2));

// Ringkasan per folder teratas.
const byTop = {};
for (const f of files) {
  const top = f.path.split('/').slice(0, 2).join('/');
  byTop[top] = byTop[top] || { n: 0, mb: 0 };
  byTop[top].n += 1;
  byTop[top].mb += f.size / 1048576;
}

console.log(`Aset terpakai : ${files.length} file, ${manifest.totalMB} MB`);
console.log(`Tidak ditemukan: ${missing.length}`);
console.log('--- per folder ---');
Object.entries(byTop)
  .sort((a, b) => b[1].mb - a[1].mb)
  .forEach(([k, v]) => console.log(`  ${k.padEnd(28)} ${String(v.n).padStart(5)} file  ${v.mb.toFixed(1)} MB`));
if (missing.length) {
  console.log('--- contoh hilang ---');
  missing.slice(0, 15).forEach((m) => console.log(`  ${m.path}  <- ${m.refs[0]}`));
}
