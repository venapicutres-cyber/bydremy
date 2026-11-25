/**
 * Aset situs (gambar, font, CSS, JS) dipindahkan ke bucket Storage Supabase.
 * Semua referensi aset di aplikasi memakai path root-absolute asli (`/wp-content/...`)
 * supaya tampilan tetap identik; modul ini memetakannya ke URL Storage saat render.
 */
const RAW_BASE = (import.meta.env.VITE_ASSET_BASE as string | undefined)?.trim() || '';

/** Base publik bucket Storage. Kosong berarti aset tetap disajikan secara lokal. */
export const ASSET_BASE = RAW_BASE.replace(/\/+$/, '');

export const ASSET_PREFIXES = ['/wp-content/', '/wp-includes/', '/site-css/'] as const;

/**
 * Domain WordPress asal. Semua referensi absolut ke domain ini dibuang origin-nya
 * supaya situs tidak lagi memanggil domain asal: sisa URL relatif hasil
 * pembersihan kemudian dipetakan ke Storage seperti aset lain.
 * Domain lama tetap diterima agar markup lama di database masih tersaji.
 */
const LEGACY_HOST = '(?:www\\.)?(?:bydreamy|dreamyinvitation|attarivitation)\\.com';
const LEGACY_ORIGIN = new RegExp(`^https?://${LEGACY_HOST}(?=/|$)`, 'i');
const LEGACY_ORIGIN_G = new RegExp(`https?:(\\/|\\\\\\/){2}${LEGACY_HOST}`, 'gi');

/** Path aset root-absolute yang sudah dipindahkan ke Storage. */
export function isStoredAssetPath(value: string): boolean {
  return ASSET_PREFIXES.some((prefix) => value.startsWith(prefix));
}

/** Ubah path aset lokal menjadi URL Storage. URL eksternal, data, dan route dibiarkan apa adanya. */
export function assetUrl(value: string | null | undefined): string {
  const raw = (value || '').trim();
  if (!raw) return raw;
  const path = raw.replace(LEGACY_ORIGIN, '');
  if (!ASSET_BASE || !isStoredAssetPath(path)) return path;
  return `${ASSET_BASE}${path}`;
}

/**
 * Ganti semua referensi aset root-absolute di dalam markup (HTML mentah, stylesheet, atau
 * string srcset) dengan URL Storage. Path yang sudah absolut dibiarkan agar tidak dobel.
 *
 * Dua bentuk didukung: `/wp-content/...` biasa, dan bentuk ter-escape JSON
 * `\/wp-content\/...` yang dipakai atribut `data-settings` Elementor.
 */
export function rewriteAssetRefs(markup: string | null | undefined): string {
  const text = markup || '';
  if (!text) return text;
  const hasLegacy = /(?:bydreamy|dreamyinvitation|attarivitation)\.com/i.test(text);
  const hasRootRef = text.includes('/wp-') || text.includes('/site-css/');
  if (!hasLegacy && (!ASSET_BASE || !hasRootRef)) return text;
  const out = hasLegacy ? text.replace(LEGACY_ORIGIN_G, '') : text;
  if (!ASSET_BASE || (!out.includes('/wp-') && !out.includes('/site-css/'))) return out;
  return out
    .replace(/(?<![\w.:/-])\\\/(wp-content|wp-includes|site-css)\\\//g, `${ASSET_BASE}/$1/`)
    .replace(/(?<![\w.:/-])\/(wp-content|wp-includes|site-css)\//g, `${ASSET_BASE}/$1/`);
}
