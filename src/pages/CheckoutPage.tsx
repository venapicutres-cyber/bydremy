import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Landmark } from 'lucide-react';
import { useDatabase } from '../services/store';
import { beginCheckout, newCheckoutKey } from '../services/checkout';
import { rupiah } from '../utils/format';
import { resolveMediaRef } from '../utils/mediaRef';

export function CheckoutPage() {
  const db = useDatabase();
  const { slug } = useParams();
  const navigate = useNavigate();
  const template = db.pages.find((page) => page.kind === 'template' && page.status === 'published' && page.slug === slug);
  const [form, setForm] = useState({ customerName: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Kunci idempotensi dibuat sekali per halaman: klik ganda memakai kunci yang
  // sama sehingga RPC hanya membuat satu pesanan.
  const checkoutKeyRef = useRef<string | null>(null);
  if (!checkoutKeyRef.current) checkoutKeyRef.current = newCheckoutKey();

  if (!template) {
    return <div className="site-container site-empty"><h1>Template tidak ditemukan</h1><Link className="site-btn" to="/katalog">Kembali ke katalog</Link></div>;
  }

  const bank = db.settings;
  const hasBank = Boolean(bank.bankName || bank.bankAccountNumber || bank.bankAccountHolder);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await beginCheckout({ templateId: template.id, ...form }, checkoutKeyRef.current!);
      navigate(`/checkout/status?order=${encodeURIComponent(session.orderId)}&token=${encodeURIComponent(session.token)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout tidak dapat diproses.');
      setBusy(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="site-container checkout-page__grid">
        <section className="checkout-page__main" aria-labelledby="checkout-title">
          <button type="button" className="checkout-page__back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Kembali ke template</button>
          <p className="site-eyebrow">Checkout transfer manual</p>
          <h1 id="checkout-title">Siapkan akses undanganmu.</h1>
          <p className="checkout-page__lead">Transfer ke rekening di bawah, unggah bukti transfer, lalu admin akan memeriksa dan mengaktifkan akunmu setelah dana masuk.</p>

          <form className="checkout-form" onSubmit={submit}>
            <fieldset>
              <legend>Data pemesan</legend>
              <label htmlFor="checkout-name">Nama lengkap <span aria-hidden="true">*</span></label>
              <input id="checkout-name" name="name" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} autoComplete="name" required minLength={2} maxLength={100} enterKeyHint="next" />
              <label htmlFor="checkout-email">Email untuk akses akun <span aria-hidden="true">*</span></label>
              <input id="checkout-email" name="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" autoCapitalize="none" spellCheck="false" required enterKeyHint="next" />
              <p className="checkout-form__hint">Tautan pembuatan password dikirim ke email ini setelah admin mengaktifkan pesanan.</p>
              <label htmlFor="checkout-phone">Nomor WhatsApp <span aria-hidden="true">*</span></label>
              <input id="checkout-phone" name="tel" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} autoComplete="tel" inputMode="tel" required minLength={8} maxLength={30} enterKeyHint="done" />
            </fieldset>
            {error && <p className="checkout-form__error" role="alert">{error}</p>}
            <button className="site-btn site-btn--dark checkout-form__submit" type="submit" disabled={busy}>
              {busy ? 'Membuat pesanan…' : <>Lanjut ke Pembayaran <ArrowRight size={16} /></>}
            </button>
            <p className="checkout-form__secure"><Landmark size={15} /> Pembayaran dilakukan dengan transfer manual. Tidak ada pembayaran otomatis.</p>
          </form>
        </section>

        <aside className="checkout-summary" aria-label="Ringkasan pesanan">
          <img src={resolveMediaRef(template.thumb, db.media)} alt="" />
          <p>Template pilihan</p>
          <h2>{template.templateName || template.label}</h2>
          <dl><div><dt>Harga</dt><dd>{rupiah(template.price || 0)}</dd></div><div><dt>Akses</dt><dd>Aktif setelah admin konfirmasi</dd></div></dl>
          <ul><li><Check size={15} /> Editor undangan pribadi</li><li><Check size={15} /> RSVP & buku tamu</li><li><Check size={15} /> Link undangan siap dibagikan</li></ul>
          <div className="checkout-bank">
            <p className="checkout-bank__title">Rekening tujuan transfer</p>
            {hasBank ? (
              <>
                <strong>{bank.bankName}</strong>
                <p className="checkout-bank__number">{bank.bankAccountNumber}</p>
                <p>a.n. {bank.bankAccountHolder}</p>
              </>
            ) : (
              <p className="checkout-bank__empty">Rekening belum diisi. Silakan hubungi admin sebelum transfer.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
