import { toDataURL } from 'qrcode';

/**
 * QR check-in memuat URL pendek ke dashboard check-in beserta token unik tamu.
 * Scanner cukup membaca token UUID-nya, jadi QR tetap bisa dipindai oleh
 * aplikasi kamera biasa maupun scanner QR generik.
 */
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export function checkInUrl(token: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/admin/check-in?token=${encodeURIComponent(token)}`;
}

/** Data URL PNG siap dipakai pada <img> atau diunduh sebagai berkas. */
export async function qrDataUrl(text: string, size = 512): Promise<string> {
  return toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: size,
    color: { dark: '#1c1917ff', light: '#ffffffff' },
  });
}

export async function checkInQrDataUrl(token: string, size = 512): Promise<string> {
  return qrDataUrl(checkInUrl(token), size);
}

/**
 * Terima UUID mentah, URL `...?token=...`, atau teks lain yang memuat UUID.
 * Mengembalikan null bila tidak ada token yang dikenali.
 */
export function extractCheckInToken(value: string): string | null {
  const text = (value || '').trim();
  if (!text) return null;

  const direct = text.match(UUID_PATTERN);
  if (direct) return direct[0].toLowerCase();

  try {
    const url = new URL(text);
    const param =
      url.searchParams.get('token') ||
      url.searchParams.get('checkin') ||
      url.searchParams.get('qr');
    if (param) return extractCheckInToken(param);
  } catch {
    /* Bukan URL; sudah dicek sebagai UUID di atas. */
  }
  return null;
}

export function safeFileName(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tamu'
  );
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Unduh berkas teks (dipakai ekspor CSV data tamu). */
export function downloadText(text: string, filename: string, type = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
