import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { hydrateAdminData, hydrateFromSupabase } from '../services/store/persistence';

export interface AdminSession {
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  /** Undangan yang boleh diedit; diisi hanya untuk akun editor pengantin. */
  pageId?: number;
  loginAt: string;
}

/** Email akun administrator. Password tidak pernah disimpan di repo. */
export const ADMIN_EMAIL = 'admin@bydreamy.local';

export interface LoginResult {
  ok: boolean;
  error?: string;
  session?: AdminSession;
}

function sessionFromUser(user: User): AdminSession {
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
  const role =
    appMeta.role === 'admin' ? 'admin' : appMeta.role === 'viewer' ? 'viewer' : 'editor';
  const name = typeof meta.full_name === 'string' && meta.full_name.trim() ? meta.full_name : 'Admin bydreamy';
  const pageId = Number(appMeta.page_id);
  return {
    email: user.email || '',
    name,
    role,
    pageId: Number.isFinite(pageId) && pageId > 0 ? pageId : undefined,
    loginAt: user.last_sign_in_at || new Date().toISOString(),
  };
}

/** Sesi yang sedang aktif, dipakai komponen untuk membatasi menu dan aksi. */
export const SessionContext = createContext<AdminSession | null>(null);

export function useAdminSession(): AdminSession | null {
  return useContext(SessionContext);
}

/** Sesi aktif dari Supabase Auth, null bila belum login. */
export async function getSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ? sessionFromUser(data.session.user) : null;
}

/** Masuk dengan email + password Supabase Auth, lalu muat data bisnis admin. */
export async function login(email: string, password: string): Promise<LoginResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase belum dikonfigurasi.' };
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'Email wajib diisi.' };
  if (!password) return { ok: false, error: 'Password wajib diisi.' };

  const { data, error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
  if (error || !data.user) {
    const message = error?.message || '';
    if (/invalid login credentials/i.test(message)) {
      return { ok: false, error: 'Email atau password salah. Coba lagi.' };
    }
    if (/email not confirmed/i.test(message)) {
      return { ok: false, error: 'Email belum dikonfirmasi.' };
    }
    return { ok: false, error: 'Tidak bisa masuk. Periksa email dan password.' };
  }

  const session = sessionFromUser(data.user);
  // Editor pengantin tidak punya akses ke tabel bisnis, jadi jangan dimuat.
  if (session.role === 'admin') await hydrateAdminData();
  else await hydrateFromSupabase();
  return { ok: true, session };
}

/** Keluar dan hapus sesi Supabase di browser. */
export async function logout(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

/**
 * Ganti password akun yang sedang login. Password lama diverifikasi ulang lewat
 * signInWithPassword sebelum password baru ditulis ke Supabase Auth.
 */
export async function changePassword(currentPassword: string, nextPassword: string): Promise<LoginResult> {
  if (!supabase) return { ok: false, error: 'Supabase belum dikonfigurasi.' };
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return { ok: false, error: 'Sesi tidak ditemukan. Silakan login ulang.' };

  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (verifyError) return { ok: false, error: 'Password saat ini salah.' };

  const { error } = await supabase.auth.updateUser({ password: nextPassword });
  if (error) {
    if (/at least|minimum/i.test(error.message)) {
      return { ok: false, error: 'Password baru terlalu pendek.' };
    }
    return { ok: false, error: 'Gagal mengganti password. Coba lagi.' };
  }
  return { ok: true };
}

/** Pantau perubahan status auth (logout dari tab lain, token kedaluwarsa, dsb). */
export function subscribeAuth(callback: (session: AdminSession | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? sessionFromUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}
