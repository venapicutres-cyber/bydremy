import { supabase } from './supabase';

export interface CheckoutInput {
  templateId: number;
  customerName: string;
  email: string;
  phone: string;
}

export interface CheckoutStatus {
  payment_status: 'unpaid' | 'pending' | 'settlement' | 'failed' | 'expired';
  invitation_route: string | null;
  activated: boolean;
  total: number;
  customer_name: string;
  proof_path: string | null;
}

export function newCheckoutKey(): string {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Browser tidak mendukung checkout aman.');
  }
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function beginCheckout(
  input: CheckoutInput,
  checkoutKey = newCheckoutKey(),
): Promise<{ orderId: string; token: string }> {
  if (!supabase) throw new Error('Checkout belum dikonfigurasi.');
  const { data, error } = await supabase.functions.invoke('create-checkout-order', {
    body: { ...input, checkoutKey },
  });
  if (error || !data?.orderId || !data?.token) {
    throw new Error(data?.error || error?.message || 'Sesi checkout tidak dapat dibuat.');
  }
  return { orderId: data.orderId, token: data.token };
}

export async function getCheckoutStatus(orderId: string, token: string): Promise<CheckoutStatus | null> {
  if (!supabase || !orderId || !token) return null;
  const { data, error } = await supabase.rpc('checkout_status', { p_order_id: orderId, p_checkout_token: token });
  if (error) throw new Error(error.message);
  return data?.[0] || null;
}

const MAX_PROOF_BYTES = 5 * 1024 * 1024;

/** Unggah bukti transfer ke bucket privat, lalu daftarkan ke pesanan. */
export async function submitPaymentProof(orderId: string, token: string, file: File): Promise<void> {
  if (!supabase) throw new Error('Upload bukti transfer belum dikonfigurasi.');
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    throw new Error('Bukti transfer harus berupa gambar atau PDF.');
  }
  if (file.size > MAX_PROOF_BYTES) throw new Error('Ukuran bukti transfer maksimal 5 MB.');

  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-80) || 'bukti';
  const path = `orders/${orderId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase.rpc('submit_payment_proof', {
    p_order_id: orderId,
    p_checkout_token: token,
    p_proof_path: path,
  });
  if (error || !data) throw new Error(error?.message || 'Bukti transfer tidak dapat disimpan.');
}

export interface ReviewResult {
  activated: boolean;
  invitation_id?: number | null;
  email_sent?: boolean;
}

/** Dipanggil admin setelah memeriksa bukti transfer dan dana masuk. */
export async function reviewPaymentProof(orderId: string, action: 'activate' | 'hold'): Promise<ReviewResult> {
  if (!supabase) throw new Error('Pemeriksaan pembayaran belum dikonfigurasi.');
  const { data, error } = await supabase.functions.invoke('review-payment-proof', {
    body: { orderId, action },
  });
  if (error || data?.error) throw new Error(data?.error || error?.message || 'Keputusan pembayaran tidak dapat disimpan.');
  return data as ReviewResult;
}
