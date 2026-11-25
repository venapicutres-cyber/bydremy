import { useSyncExternalStore } from 'react';
import { seedDatabase } from '../../data/site';
import type { Database } from '../../data/types';
import { fetchDatabase, isSupabaseConfigured, saveDatabase } from '../supabase';

const STORAGE_KEY = 'bydreamy.admin.v1';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function load(): Database {
  if (typeof window === 'undefined') return clone(seedDatabase);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(seedDatabase);
    const parsed = JSON.parse(raw) as Database;
    if (parsed.version !== seedDatabase.version) return clone(seedDatabase);
    // Keep newly generated seed pages (e.g. after a content rebuild) available,
    // while pages created in the dashboard survive and deletions stay deleted.
    const merged = { ...clone(seedDatabase), ...parsed };
    const byId = new Map(parsed.pages.map((page) => [page.id, page]));
    const seedIds = new Set(seedDatabase.pages.map((page) => page.id));
    const deleted = new Set(parsed.deletedPageIds || []);
    merged.pages = [
      ...seedDatabase.pages
        .filter((seed) => !deleted.has(seed.id))
        .map((seed) => {
          const stored = byId.get(seed.id);
          if (!stored) return seed;
          // Isi kolom baru dari seed (mis. harga template) bila belum ada di data
          // tersimpan, tanpa menimpa perubahan yang sudah dibuat admin.
          return {
            ...seed,
            ...stored,
            price: stored.price ?? seed.price,
            priceCompare: stored.priceCompare ?? seed.priceCompare,
          };
        }),
      ...parsed.pages.filter((page) => !seedIds.has(page.id)),
    ];
    // Aset baru dari seed (mis. font lokal) ikut masuk ke store yang sudah ada,
    // tanpa menghidupkan lagi media yang sudah dihapus admin.
    const mediaById = new Map((parsed.media || []).map((item) => [item.id, item]));
    const seedMediaIds = new Set(seedDatabase.media.map((item) => item.id));
    const deletedMedia = new Set(parsed.deletedMediaIds || []);
    merged.media = [
      ...seedDatabase.media
        .filter((seed) => !deletedMedia.has(seed.id))
        .map((seed) => mediaById.get(seed.id) ?? seed),
      ...(parsed.media || []).filter((item) => !seedMediaIds.has(item.id)),
    ];
    return merged;
  } catch {
    return clone(seedDatabase);
  }
}

let current = load();
const listeners = new Set<() => void>();

let storageWarningShown = false;
/** True setelah data Supabase berhasil dibaca (atau tabelnya memang masih kosong). */
let remoteReady = false;
/** True bila admin sudah mengubah data sebelum hidrasi selesai, agar tidak ditimpa. */
let mutated = false;
/**
 * True setelah tabel bisnis (pesanan, pelanggan, pengguna) dimuat untuk admin.
 * Hidrasi publik berikutnya harus mempertahankan data itu, karena fetch publik
 * sengaja tidak mengambil tabel tersebut (RLS menutupnya untuk anon).
 */
let adminReady = false;

/** Status sinkronisasi snapshot ke Supabase, dipakai UI untuk memberi tahu admin. */
let syncError: string | null = null;
const syncListeners = new Set<() => void>();

function setSyncError(message: string | null) {
  if (syncError === message) return;
  syncError = message;
  syncListeners.forEach((listener) => listener());
}

export function getSyncError(): string | null {
  return syncError;
}

export function subscribeSyncError(listener: () => void) {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

/** Tutup peringatan gagal simpan; akan muncul lagi bila sinkronisasi gagal lagi. */
export function dismissSyncError() {
  setSyncError(null);
}

/** Pesan error sinkronisasi terakhir, atau null bila semua tersimpan. */
export function useSyncError(): string | null {
  return useSyncExternalStore(subscribeSyncError, getSyncError, getSyncError);
}

function persistLocal() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (error) {
    if ((error as DOMException)?.name === 'QuotaExceededError' && !storageWarningShown) {
      storageWarningShown = true;
      window.alert(
        'Penyimpanan browser penuh. Hapus beberapa media lama atau gunakan URL aset, lalu simpan ulang perubahan.',
      );
    }
  }
}

let syncTimer: number | undefined;
let syncing = false;
let syncQueued = false;

async function flushToSupabase() {
  if (syncing) {
    syncQueued = true;
    return;
  }
  syncing = true;
  try {
    do {
      syncQueued = false;
      const snapshot = current;
      try {
        await saveDatabase(snapshot);
        setSyncError(null);
      } catch (error) {
        console.error('[supabase] gagal menyimpan data dashboard', error);
        setSyncError(
          error instanceof Error && error.message
            ? error.message
            : 'Perubahan gagal dikirim ke server.',
        );
      }
    } while (syncQueued);
  } finally {
    syncing = false;
  }
}

/**
 * Sinkronisasi snapshot penuh bisa dimatikan untuk editor undangan: mereka
 * menulis lewat RPC khusus satu halaman, bukan menimpa seluruh data situs.
 */
let snapshotSyncEnabled = true;

export function setSnapshotSyncEnabled(value: boolean) {
  snapshotSyncEnabled = value;
}

/** Tulis balik ke Supabase (debounce) agar ketikan/aksi berturut-turut hanya jadi satu simpan. */
function scheduleSync() {
  if (!isSupabaseConfigured || !remoteReady || !snapshotSyncEnabled) return;
  if (syncTimer !== undefined) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncTimer = undefined;
    void flushToSupabase();
  }, 500);
}

/**
 * Muat data dari Supabase setelah aplikasi tampil, lalu pakai sebagai sumber data utama.
 * localStorage tetap dipakai sebagai cache/fallback saat Supabase tidak tersedia.
 */
export async function hydrateFromSupabase() {
  if (!isSupabaseConfigured) return;
  try {
    const remote = await fetchDatabase();
    remoteReady = true;
    if (!remote || mutated) return;
    // Tabel bisnis tidak ikut diambil saat anon; jangan hapus data yang sudah
    // dimuat setelah login.
    current = adminReady
      ? {
          ...remote,
          orders: current.orders,
          customers: current.customers,
          users: current.users,
        }
      : remote;
    persistLocal();
    emit();
  } catch (error) {
    console.error('[supabase] gagal memuat data dashboard', error);
  }
}

/**
 * Muat tabel bisnis yang hanya boleh dibaca user login. Dipanggil setelah
 * Supabase Auth berhasil menerbitkan sesi.
 */
export async function hydrateAdminData() {
  if (!isSupabaseConfigured) return;
  try {
    const remote = await fetchDatabase({ includeAdmin: true });
    if (!remote) return;
    adminReady = true;
    current = {
      ...current,
      orders: remote.orders,
      customers: remote.customers,
      users: remote.users,
    };
    persistLocal();
    emit();
  } catch (error) {
    console.error('[supabase] gagal memuat data admin', error);
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDatabase(): Database {
  return current;
}

export function setDatabase(updater: (db: Database) => Database) {
  current = updater(current);
  mutated = true;
  persistLocal();
  emit();
  scheduleSync();
}

export function useDatabase(): Database {
  return useSyncExternalStore(subscribe, getDatabase, getDatabase);
}

export const stamp = () => new Date().toISOString();
