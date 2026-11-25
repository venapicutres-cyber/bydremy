// Menyiapkan folder staging berisi HANYA aset yang dipakai (hardlink, tanpa
// menyalin byte) supaya bisa diunggah apa adanya ke Supabase Storage dengan
// struktur path yang sama seperti di public/.
import { readFileSync, mkdirSync, linkSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const PUBLIC = join(ROOT, 'public');
// Harus satu volume dengan public/ agar hardlink berhasil (hemat ruang & waktu).
const STAGE = join(resolve(ROOT, '..'), 'attar-storage-stage');

const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts', 'out', 'assets-manifest.json'), 'utf8'));

if (existsSync(STAGE)) rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });

let linked = 0;
let copied = 0;

for (const { path } of manifest.files) {
  const src = join(PUBLIC, path);
  const dst = join(STAGE, path);
  if (!existsSync(src)) continue;
  mkdirSync(dirname(dst), { recursive: true });
  try {
    linkSync(src, dst);
    linked += 1;
  } catch {
    copyFileSync(src, dst);
    copied += 1;
  }
}

const bytes = manifest.files.reduce((sum, f) => sum + f.size, 0);
console.log(`Staging: ${STAGE}`);
console.log(`  hardlink ${linked} | disalin ${copied} | total ${manifest.files.length} file / ${(bytes / 1048576).toFixed(1)} MB`);
