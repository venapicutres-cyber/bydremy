import type { Database, MediaRecord } from '../../data/types';
import { mediaRefId } from '../../utils/mediaRef';
import { persistPreparedImage, prepareImageFile } from '../../utils/imageFile';
import { isSupabaseConfigured, uploadAsset } from '../supabase';
import { setDatabase, stamp } from './persistence';

export function createMedia(input: Partial<MediaRecord>): MediaRecord {
  const record: MediaRecord = {
    id: Date.now(),
    name: input.name ?? 'aset-baru.webp',
    url: input.url ?? '',
    type: input.type ?? 'image',
    folder: input.folder ?? 'uploads/2026',
    size: input.size ?? '—',
    createdAt: stamp(),
  };
  setDatabase((db) => ({ ...db, media: [record, ...db.media] }));
  return record;
}

/**
 * Kompres file gambar dari komputer, unggah ke Storage, lalu catat di Media
 * supaya langsung bisa dipakai ulang dari pustaka media.
 */
export async function uploadImageToMedia(file: File, pageId?: number): Promise<MediaRecord> {
  const prepared = await prepareImageFile(file);
  const url = await persistPreparedImage(prepared, file.name, pageId);
  return createMedia({
    name: file.name,
    url,
    type: 'image',
    folder: 'uploads/2026',
    size: prepared.size,
  });
}

const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
};

function uploadSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'aset'
  );
}

function formatUploadSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('File tidak bisa dibaca.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Unggah gambar, video, atau audio dari komputer. Gambar tetap dikompres;
 * video/audio diunggah apa adanya ke Storage karena browser tidak bisa
 * mengompresnya tanpa merusak kualitas.
 */
export async function uploadMediaToMedia(
  file: File,
  kind: MediaRecord['type'] = 'image',
  pageId?: number,
): Promise<MediaRecord> {
  if (kind === 'image') return uploadImageToMedia(file, pageId);

  const expected = kind === 'video' ? 'video/' : kind === 'audio' ? 'audio/' : '';
  if (!expected || !file.type.startsWith(expected)) {
    throw new Error(
      kind === 'video'
        ? 'File harus berupa video (MP4, WebM, atau MOV).'
        : 'File harus berupa audio (MP3, WAV, M4A, atau OGG).',
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Ukuran file melebihi 40 MB. Kompres atau gunakan tautan eksternal.');
  }

  let url: string;
  if (isSupabaseConfigured) {
    const ext = EXT_BY_MIME[file.type] || file.name.split('.').pop()?.toLowerCase() || (kind === 'video' ? 'mp4' : 'mp3');
    url = await uploadAsset(file, `uploads/${Date.now()}-${uploadSlug(file.name)}.${ext}`, file.type, pageId);
  } else {
    url = await readAsDataUrl(file);
  }

  return createMedia({
    name: file.name,
    url,
    type: kind,
    folder: 'uploads/2026',
    size: formatUploadSize(file.size),
  });
}

export function updateMedia(id: number, patch: Partial<MediaRecord>) {
  setDatabase((db) => ({
    ...db,
    media: db.media.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

export function deleteMedia(id: number) {
  setDatabase((db) => ({
    ...db,
    media: db.media.filter((item) => item.id !== id),
    // Catat id seed yang dihapus agar tidak muncul lagi saat seed diperbarui.
    deletedMediaIds: [...(db.deletedMediaIds || []), id],
  }));
}

/**
 * Peta pemakaian aset: id media -> daftar lokasi yang mereferensikannya.
 * Dipakai untuk label "Dipakai di" sekaligus pengaman sebelum menghapus, sehingga
 * keduanya selalu memakai perhitungan yang sama.
 */
export function collectMediaUsage(db: Database): Map<number, string[]> {
  const usage = new Map<number, string[]>();
  const idByUrl = new Map<string, number>();
  db.media.forEach((item) => {
    if (item.url) idByUrl.set(item.url, item.id);
  });

  const record = (id: number, label: string) => {
    const list = usage.get(id) || [];
    if (list.includes(label)) return;
    list.push(label);
    usage.set(id, list);
  };

  // Token `media:<id>` maupun URL aset langsung (data lama) sama-sama dihitung.
  const mark = (value: string | undefined, label: string) => {
    if (!value) return;
    const id = mediaRefId(value) ?? idByUrl.get(value);
    if (id !== undefined) record(id, label);
  };

  // HTML bebas (konten hasil edit dan HTML tambahan) bisa memuat token atau URL aset.
  const markMarkup = (markup: string | undefined, label: string) => {
    if (!markup) return;
    markup.match(/media:\d+/g)?.forEach((token) => mark(token, label));
    idByUrl.forEach((id, url) => {
      if (markup.includes(url)) record(id, label);
    });
  };

  db.pages.forEach((page) => {
    const where = `Halaman: ${page.label}`;
    mark(page.thumb, `${where} — thumbnail`);
    Object.values(page.imageOverrides || {}).forEach((value) => mark(value, `${where} — gambar`));
    markMarkup(page.contentHtml, `${where} — konten`);
    markMarkup(page.extraHtml, `${where} — HTML tambahan`);
  });
  db.categories.forEach((category) => mark(category.cover, `Kategori: ${category.name} — cover`));
  Object.entries(db.settings).forEach(([key, value]) => {
    if (typeof value === 'string') mark(value, `Pengaturan situs — ${key}`);
  });

  return usage;
}
