import { seedDatabase } from '../data/site';
import type { Database } from '../data/types';

const REQUIRED_ARRAYS: (keyof Database)[] = ['pages', 'media', 'orders', 'customers', 'users', 'navigation', 'footer'];

export function backupFilename(date = new Date()): string {
  return `bydreamy-backup-${date.toISOString().slice(0, 10)}.json`;
}

export function buildBackup(db: Database): string {
  return JSON.stringify({ ...db, version: seedDatabase.version }, null, 2);
}

/**
 * Membaca file backup. Versi data disamakan dengan aplikasi saat ini supaya
 * hasil impor tidak langsung dibuang oleh proses pemuatan berikutnya.
 */
export function parseBackup(text: string): Database {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File ini bukan JSON yang valid.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Isi file bukan data dashboard yang dikenali.');
  }
  const record = parsed as Record<string, unknown>;
  const missing = REQUIRED_ARRAYS.filter((key) => !Array.isArray(record[key]));
  if (missing.length) throw new Error(`Backup tidak lengkap, bagian ini hilang: ${missing.join(', ')}.`);
  if (!record.settings || typeof record.settings !== 'object') {
    throw new Error('Backup tidak lengkap, bagian ini hilang: settings.');
  }
  return { ...(parsed as Database), version: seedDatabase.version };
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
