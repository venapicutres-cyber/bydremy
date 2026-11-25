import { isSupabaseConfigured, supabase } from './supabase';

/** Satu ucapan/RSVP dari tamu undangan. */
export interface GuestbookEntry {
  id: number;
  pageId: number;
  name: string;
  message: string;
  attendance: string;
  createdAt: string;
  /** Token QR personal, hanya ada pada hasil submit_guestbook yang baru. */
  checkinToken?: string;
}

export interface GuestbookInput {
  pageId: number;
  name: string;
  message: string;
  attendance?: string;
}

/** Baris check-in (token sengaja tidak diekspos ke publik). */
export interface Checkin {
  entryId: number;
  token: string;
  identityCategory: string;
  phone: string;
  checkedInAt: string | null;
  method: string;
  note: string;
  createdAt: string;
  entry?: GuestbookEntry;
}

/** Hasil RPC check-in: data tamu + status check-in + token untuk QR. */
export interface CheckinResult extends GuestbookEntry {
  identityCategory: string;
  phone: string;
  checkedInAt: string | null;
  method: string;
  alreadyCheckedIn: boolean;
}

/** Data aman untuk Layar Sapa (tanpa token dan nomor telepon). */
export interface SapaGuest {
  name: string;
  message: string;
  identityCategory: string;
  checkedInAt: string;
}

const COLUMNS = 'id, page_id, name, message, attendance, created_at';
const CHECKIN_COLUMNS =
  'entry_id, token, identity_category, phone, checked_in_at, checkin_method, checkin_note, created_at, ' +
  'guestbook_entries (id, page_id, name, message, attendance, created_at)';
const MAX_ENTRIES = 100;

export const hasGuestbookBackend = isSupabaseConfigured;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function mapEntry(row: Record<string, unknown>): GuestbookEntry {
  return {
    id: Number(row.id),
    pageId: Number(row.page_id),
    name: str(row.name),
    message: str(row.message),
    attendance: str(row.attendance),
    createdAt: str(row.created_at, new Date().toISOString()),
    checkinToken: str(row.checkin_token) || undefined,
  };
}

function mapCheckin(row: Record<string, unknown>): Checkin {
  const embedded = row.guestbook_entries as Record<string, unknown> | null | undefined;
  return {
    entryId: Number(row.entry_id),
    token: str(row.token),
    identityCategory: str(row.identity_category),
    phone: str(row.phone),
    checkedInAt: str(row.checked_in_at) || null,
    method: str(row.checkin_method),
    note: str(row.checkin_note),
    createdAt: str(row.created_at, new Date().toISOString()),
    entry: embedded ? mapEntry(embedded) : undefined,
  };
}

function mapCheckinResult(row: Record<string, unknown>): CheckinResult {
  return {
    ...mapEntry(row),
    identityCategory: str(row.identity_category),
    phone: str(row.phone),
    checkedInAt: str(row.checked_in_at) || null,
    method: str(row.checkin_method, 'qr'),
    alreadyCheckedIn: row.already_checked_in === true,
  };
}

function unwrap<T>(data: unknown, map: (row: Record<string, unknown>) => T): T {
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row) throw new Error('Server tidak mengembalikan data yang diharapkan.');
  return map(row);
}

/** Ucapan sebuah undangan, terbaru lebih dulu. */
export async function fetchGuestbook(pageId: number, limit = 50): Promise<GuestbookEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('guestbook_entries')
    .select(COLUMNS)
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data || []) as Record<string, unknown>[]).map(mapEntry);
}

/** Semua ucapan untuk rekap dashboard. */
export async function fetchAllGuestbook(limit = 1000): Promise<GuestbookEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('guestbook_entries')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data || []) as Record<string, unknown>[]).map(mapEntry);
}

/** Jumlah RSVP publik, dipakai statistik ringan pada halaman fitur. */
export async function fetchGuestbookCount(): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('guestbook_entries')
    .select('id', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Kirim ucapan lewat RPC yang memvalidasi isi. Tabel tidak bisa di-insert
 * langsung dengan anon key, jadi satu-satunya jalur tulis ada di sini.
 * RPC sekarang juga membuat token QR personal untuk tamu.
 */
export async function submitGuestbook(input: GuestbookInput): Promise<GuestbookEntry> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.rpc('submit_guestbook', {
    p_page_id: input.pageId,
    p_name: input.name,
    p_message: input.message,
    p_attendance: input.attendance || '',
  });
  if (error) throw new Error(error.message);
  return unwrap(data, mapEntry);
}

/**
 * Dengarkan ucapan baru lewat Supabase Realtime. `pageId` kosong berarti semua
 * undangan (dipakai dashboard). Mengembalikan fungsi cleanup.
 */
export function subscribeGuestbook(
  pageId: number | null,
  onEntry: (entry: GuestbookEntry) => void,
): () => void {
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel(pageId === null ? 'guestbook:all' : `guestbook:${pageId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'guestbook_entries',
        ...(pageId === null ? {} : { filter: `page_id=eq.${pageId}` }),
      },
      (payload) => onEntry(mapEntry(payload.new as Record<string, unknown>)),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Hapus satu ucapan (moderasi). Hanya admin yang diizinkan oleh RLS. */
export async function deleteGuestbookEntry(id: number): Promise<void> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await supabase.from('guestbook_entries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function mergeGuestbookEntry(list: GuestbookEntry[], entry: GuestbookEntry): GuestbookEntry[] {
  const rest = list.filter((item) => item.id !== entry.id);
  return [entry, ...rest].slice(0, MAX_ENTRIES);
}

/* ------------------------------------------------------------------ check-in */

/** Data check-in untuk dashboard; filter halaman dilakukan di klien agar RLS tetap menjadi batas akses. */
export async function fetchCheckins(pageId?: number | null, limit = 1000): Promise<Checkin[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('guest_checkins')
    .select(CHECKIN_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const rows = ((data || []) as unknown as Record<string, unknown>[]).map(mapCheckin);
  return typeof pageId === 'number' ? rows.filter((row) => row.entry?.pageId === pageId) : rows;
}

/** Scan QR / tempel token. Idempotent: tamu yang sudah check-in tidak berubah. */
export async function checkInByToken(token: string, method: 'qr' | 'manual' = 'qr'): Promise<CheckinResult> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.rpc('check_in_guest_token', {
    p_token: token,
    p_method: method,
  });
  if (error) throw new Error(error.message);
  return unwrap(data, mapCheckinResult);
}

/** Check-in tamu undangan cetak yang tidak punya QR. */
export async function manualCheckIn(
  pageId: number,
  name: string,
  identityCategory: string,
  phone = '',
): Promise<CheckinResult> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.rpc('manual_check_in', {
    p_page_id: pageId,
    p_name: name,
    p_identity_category: identityCategory,
    p_phone: phone,
  });
  if (error) throw new Error(error.message);
  return unwrap(data, mapCheckinResult);
}

/** Realtime check-in untuk tabel dashboard dan layar sapa. */
export function subscribeCheckins(onChange: (checkin: Checkin) => void): () => void {
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel('checkins:all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'guest_checkins' },
      (payload) => onChange(mapCheckin(payload.new as Record<string, unknown>)),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Data Layar Sapa aman untuk perangkat tanpa login. */
export async function fetchLayarSapa(pageId: number, limit = 12): Promise<SapaGuest[]> {
  if (!supabase || !pageId) return [];
  const { data, error } = await supabase.rpc('layar_sapa', {
    p_page_id: pageId,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  const rows = (Array.isArray(data) ? data : []) as unknown as Record<string, unknown>[];
  return rows.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      name: str(item.name),
      message: str(item.message),
      identityCategory: str(item.identity_category),
      checkedInAt: str(item.checked_in_at),
    };
  });
}
