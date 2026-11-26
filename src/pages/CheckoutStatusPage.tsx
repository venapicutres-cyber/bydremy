import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Landmark, XCircle } from 'lucide-react';
import { getCheckoutStatus, submitPaymentProof, type CheckoutStatus } from '../services/checkout';
import { useDatabase } from '../services/store';
import { rupiah } from '../utils/format';

const COPY: Record<CheckoutStatus['payment_status'], { title: string; detail: string }> = {
  unpaid: { title: 'Menunggu transfer', detail: 'Transfer ke rekening berikut, lalu unggah bukti transfermu.' },
  pending: { title: 'Bukti transfer menunggu pemeriksaan', detail: 'Admin akan memeriksa bukti transfermu. Akun aktif setelah dana dinyatakan masuk.' },
  settlement: { title: 'Pembayaran disetujui admin', detail: 'Akun sedang disiapkan.' },
  failed: { title: 'Pembayaran belum berhasil', detail: 'Silakan mulai checkout kembali.' },
  expired: { title: 'Sesi pembayaran kedaluwarsa', detail: 'Silakan mulai checkout kembali untuk membuat pesanan baru.' },
};

export function CheckoutStatusPage() {
  const db = useDatabase();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const order = params.get('order') || '';
  const token = params.get('token') || '';

  const refresh = useCallback(async () => {
    if (!order || !token) return;
    try {
      const next = await getCheckoutStatus(order, token);
      if (next) {
        setStatus(next);
        setNotFound(false);
        setError(null);
      } else {
        setNotFound(true);
        setError('Sesi pembayaran tidak ditemukan.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Status pembayaran tidak dapat diperiksa.');
    }
  }, [order, token]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setUploadError('Pilih bukti transfer terlebih dahulu.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await submitPaymentProof(order, token, file);
      setUploaded(true);
      setFile(null);
      await refresh();
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : 'Bukti transfer tidak dapat diunggah.');
    } finally {
      setUploading(false);
    }
  };

  if (!order || !token || notFound) {
    return (
      <main className="checkout-status">
        <div className="checkout-status__card">
          <XCircle size={42} />
          <h1>Sesi pembayaran tidak ditemukan</h1>
          <p>Buka tautan status dari halaman checkout, atau mulai checkout kembali.</p>
          <Link className="site-btn site-btn--dark" to="/katalog">Kembali ke katalog</Link>
        </div>
      </main>
    );
  }

  const state = status ? COPY[status.payment_status] : { title: 'Memeriksa pesanan…', detail: 'Mohon tunggu sebentar.' };
  const Icon = status?.payment_status === 'settlement' ? CheckCircle2 : status?.payment_status === 'failed' || status?.payment_status === 'expired' ? XCircle : Clock3;
  const bank = db.settings;
  const hasBank = Boolean(bank.bankName || bank.bankAccountNumber || bank.bankAccountHolder);
  const canUpload = status ? status.payment_status === 'unpaid' || status.payment_status === 'pending' : false;

  return (
    <main className="checkout-status">
      <div className="checkout-status__card">
        <Icon size={42} />
        <p className="site-eyebrow">Status pesanan</p>
        <h1>{state.title}</h1>
        <p role="status">{error || state.detail}</p>
        {status && <p className="checkout-status__amount">{status.customer_name} · {rupiah(status.total || 0)}</p>}
        {status?.activated && <p className="checkout-status__notice">Cek email untuk membuat password, lalu masuk untuk mengelola undangan.</p>}

        <section className="checkout-bank" aria-label="Rekening tujuan transfer">
          <p className="checkout-bank__title"><Landmark size={16} /> Rekening tujuan transfer</p>
          {hasBank ? (
            <>
              <strong>{bank.bankName}</strong>
              <p className="checkout-bank__number">{bank.bankAccountNumber}</p>
              <p>a.n. {bank.bankAccountHolder}</p>
            </>
          ) : (
            <p className="checkout-bank__empty">Rekening belum diisi admin. Hubungi admin sebelum transfer.</p>
          )}
        </section>

        {canUpload && (
          <form className="proof-form" onSubmit={upload} noValidate>
            <h2>Unggah bukti transfer</h2>
            <p>Format gambar atau PDF, maksimal 5 MB. Bukti hanya bisa dilihat admin.</p>
            <input
              type="file"
              accept="image/*,application/pdf"
              aria-label="Pilih bukti transfer"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setUploadError(null);
                setUploaded(false);
              }}
            />
            {uploadError && <p className="proof-form__error" role="alert">{uploadError}</p>}
            {uploaded && <p className="proof-form__ok" role="status">Bukti transfer berhasil dikirim. Menunggu pemeriksaan admin.</p>}
            {status?.proof_path && !uploaded && <p className="proof-form__hint" role="status">Bukti sudah dikirim. Kamu bisa menggantinya sebelum akun diaktifkan.</p>}
            <button className="site-btn site-btn--dark" type="submit" disabled={uploading || !file}>
              {uploading ? 'Mengunggah…' : 'Kirim Bukti Transfer'}
            </button>
          </form>
        )}

        <Link className="site-btn site-btn--dark" to="/katalog">Kembali ke katalog</Link>
      </div>
    </main>
  );
}
