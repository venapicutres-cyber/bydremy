import { isSupabaseConfigured, uploadAsset } from '../services/supabase';

const MAX_ORIGINAL_BYTES = 1_200_000;

export interface PreparedImage {
  dataUrl: string;
  size: string;
}

function formatSize(bytes: number): string {
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

async function createBitmap(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      return await createImageBitmap(file);
    } catch {
      return null;
    }
  }
}

/**
 * Gambar besar dikompres ke WebP agar muat di penyimpanan lokal dashboard.
 * SVG dan GIF dibiarkan apa adanya selama ukurannya wajar.
 */
export async function prepareImageFile(file: File, maxWidth = 1600): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, WebP, GIF, atau SVG).');
  }

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    if (file.size > MAX_ORIGINAL_BYTES) {
      throw new Error('Ukuran gambar melebihi 1,2 MB. Kompres dulu sebelum mengunggah.');
    }
    return { dataUrl: await readAsDataUrl(file), size: formatSize(file.size) };
  }

  const bitmap = await createBitmap(file);
  if (!bitmap) {
    if (file.size > MAX_ORIGINAL_BYTES) {
      throw new Error('Gambar gagal diproses. Coba file lain atau lebih kecil.');
    }
    return { dataUrl: await readAsDataUrl(file), size: formatSize(file.size) };
  }

  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close?.();
    return { dataUrl: await readAsDataUrl(file), size: formatSize(file.size) };
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  let dataUrl = canvas.toDataURL('image/webp', 0.86);
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  }

  const bytes = Math.round((dataUrl.length * 3) / 4);
  return { dataUrl, size: formatSize(bytes) };
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'gambar'
  );
}

/**
 * Simpan gambar yang sudah dikompres ke bucket Storage dan kembalikan URL publiknya.
 * Bila Supabase tidak dikonfigurasi, dipakai data URL sebagai fallback.
 */
export async function persistPreparedImage(prepared: PreparedImage, fileName: string, pageId?: number): Promise<string> {
  if (!isSupabaseConfigured) return prepared.dataUrl;
  const blob = await (await fetch(prepared.dataUrl)).blob();
  const ext = EXT_BY_TYPE[blob.type] || 'webp';
  return uploadAsset(blob, `uploads/${Date.now()}-${slugify(fileName)}.${ext}`, blob.type, pageId);
}
