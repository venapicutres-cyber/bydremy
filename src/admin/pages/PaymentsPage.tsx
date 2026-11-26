import { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { reviewPaymentProof } from '../../services/checkout';
import { supabase } from '../../services/supabase';
import { hydrateAdminData } from '../../services/store/persistence';
import { useDatabase } from '../../services/store';
import { rupiah } from '../../utils/format';
import { PageHeader, StatusPill } from '../ui';

export function PaymentsPage() {
  const db = useDatabase();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = useMemo(
    () => db.orders.filter((order) => order.proofPath && order.paymentStatus === 'pending' && !order.activatedAt),
    [db.orders],
  );

  const decide = async (orderId: string, action: 'activate' | 'hold') => {
    setBusyId(orderId);
    setMessage(null);
    setError(null);
    try {
      const result = await reviewPaymentProof(orderId, action);
      await hydrateAdminData();
      setMessage(
        action === 'activate'
          ? result.email_sent === false
            ? `Pesanan ${orderId} diaktifkan, tetapi email pembuatan password gagal dikirim. Kirim tautan aktivasi secara manual.`
            : `Pesanan ${orderId} diaktifkan.`
          : `Pesanan ${orderId} tetap tidak aktif.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Keputusan pembayaran gagal disimpan.');
    } finally {
      setBusyId(null);
    }
  };

  const openProof = async (path: string) => {
    setError(null);
    if (!supabase) return;
    const { data, error: urlError } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 120);
    if (urlError || !data?.signedUrl) {
      setError(urlError?.message || 'Bukti transfer tidak dapat dibuka.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Bisnis"
        title="Pembayaran"
        description="Periksa bukti transfer pelanggan. Aktifkan hanya jika dana sudah masuk; jika belum, biarkan tidak aktif."
      />

      {message && <p className="adm-notice adm-notice--ok" role="status">{message}</p>}
      {error && <p className="adm-notice adm-notice--error" role="alert">{error}</p>}

      <section className="adm-panel">
        <div className="adm-toolbar">
          <h2 className="adm-panel__title">Bukti transfer menunggu pemeriksaan</h2>
          <span className="adm-muted">{pending.length} pesanan</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Pesanan</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Bukti</th>
                <th>Status</th>
                <th className="is-right">Keputusan</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.id}</strong></td>
                  <td>{order.customerName}<small>{order.email}</small></td>
                  <td>{rupiah(order.total)}</td>
                  <td>
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => void openProof(order.proofPath!)}>
                      <ExternalLink size={14} /> Lihat bukti
                    </button>
                    {order.proofUploadedAt && <small>{new Date(order.proofUploadedAt).toLocaleString('id-ID')}</small>}
                  </td>
                  <td><StatusPill status="Menunggu" /></td>
                  <td>
                    <div className="adm-actions is-right">
                      <button
                        type="button"
                        className="adm-btn adm-btn--dark adm-btn--sm"
                        disabled={busyId === order.id}
                        onClick={() => void decide(order.id, 'activate')}
                      >
                        <CheckCircle2 size={14} /> Aktifkan
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        disabled={busyId === order.id}
                        onClick={() => void decide(order.id, 'hold')}
                      >
                        <XCircle size={14} /> Belum masuk
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pending.length === 0 && (
          <div className="adm-empty">
            <h3>Tidak ada bukti yang perlu diperiksa</h3>
            <p>Bukti transfer baru akan muncul di sini setelah pelanggan mengunggahnya.</p>
          </div>
        )}
      </section>
    </div>
  );
}
