import { isSupabaseConfigured, supabase } from './supabase';

/** Satu ucapan/RSVP dari tamu undangan. */
export interface GuestbookEntry {
  id: number;
  pageId: number;
  name: string;
  message: string;
  attendance: string;
  createdAt: string;
}

export interface GuestbookInput {
  pageId: number;
  name: string;
  message: string;
  attendance?: string;
}

const COLUMNS = 'id, page_id, name, message, attendance, created_at';
const MAX_ENTRIES = 100;

export const hasGuestbookBackend = isSupabaseConfigured;

function mapEntry(row: Record<string, unknown>): GuestbookEntry {
  return {
    id: Number(row.id),
    pageId: Number(row.page_id),
    name: typeof row.name === 'string' ? row.name : '',
    message: typeof row.message === 'string' ? row.message : '',
    attendance: typeof row.attendance === 'string' ? row.attendance : '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
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

/**
 * Kirim ucapan lewat RPC yang memvalidasi isi. Tabel tidak bisa di-insert
 * langsung dengan anon key, jadi satu-satunya jalur tulis ada di sini.
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
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row) throw new Error('Server tidak mengembalikan data ucapan.');
  return mapEntry(row);
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
