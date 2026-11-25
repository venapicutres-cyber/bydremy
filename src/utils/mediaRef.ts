import type { MediaRecord } from '../data/types';
import { assetUrl } from './assetUrl';

/**
 * Aset unggahan disimpan sekali di Media; setiap pemakainya menyimpan token
 * `media:<id>` supaya gambar tidak disalin ulang ke halaman, kategori, atau pengaturan.
 */
const PREFIX = 'media:';

export function toMediaRef(id: number | string): string {
  return `${PREFIX}${id}`;
}

export function mediaRefId(value: string | undefined): number | null {
  if (!value || !value.startsWith(PREFIX)) return null;
  const id = Number(value.slice(PREFIX.length));
  return Number.isInteger(id) ? id : null;
}

/** Nilai mentah tanpa rewrite Storage, dipakai untuk kolom input di dashboard. */
export function mediaRefValue(value: string | undefined, media: MediaRecord[]): string {
  const id = mediaRefId(value);
  if (id === null) return value ?? '';
  return media.find((item) => item.id === id)?.url ?? '';
}

/** URL siap pakai untuk `img src` atau `background-image`, sudah menunjuk ke Storage. */
export function resolveMediaRef(value: string | undefined, media: MediaRecord[]): string {
  return assetUrl(mediaRefValue(value, media));
}
