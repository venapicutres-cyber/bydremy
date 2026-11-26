import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircleDollarSign, Clock, MessageCircle, Plus, Printer, Search, Trash2, Wallet } from 'lucide-react';
import {
  createOrder,
  deleteOrder,
  normalizeEmail,
  orderOutstanding,
  orderPaid,
  paidForStatus,
  updateOrder,
  useDatabase,
} from '../../services/store';
import type { OrderRecord } from '../../data/types';
import { ConfirmButton, Field, Modal, PageHeader, StatusPill } from '../ui';
import { rupiah, shortDate } from '../../utils/format';
import { orderText, printNota, whatsappLink } from '../../utils/nota';

const STATUSES: OrderRecord['status'][] = ['pending', 'paid', 'in_progress', 'completed', 'cancelled'];

const blank = {
  customerName: '',
  email: '',
  phone: '',
  templateId: '',
  packageName: 'Premium',
  status: 'pending' as OrderRecord['status'],
  total: 399000,
  // '' berarti "ikut status pesanan"; angka 0 berarti benar-benar belum dibayar.
  paid: '' as number | '',
  paidAt: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
};

export function OrdersPage() {
  const db = useDatabase();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | OrderRecord['status']>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrderRecord | null>(null);
  const [form, setForm] = useState(blank);
  // '' = pelanggan baru (isi manual). Kalau diisi, data pelanggan mengikuti yang dipilih.
  const [customerId, setCustomerId] = useState('');
  const [params, setParams] = useSearchParams();

  // Tombol "Pesanan Baru" di dashboard mengarah ke sini dengan ?new=1.
  useEffect(() => {
    if (params.get('new') !== '1') return;
    setEditing(null);
    setForm(blank);
    setCustomerId('');
    setOpen(true);
    setParams({}, { replace: true });
  }, [params, setParams]);

  const orders = useMemo(
    () =>
      [...db.orders]
        .filter((order) => (status === 'all' ? true : order.status === status))
        .filter((order) =>
          query ? `${order.id} ${order.customerName} ${order.email} ${order.packageName}`.toLowerCase().includes(query.toLowerCase()) : true,
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [db.orders, query, status],
  );

  // Pendapatan hanya menghitung uang yang benar-benar sudah masuk (DP ikut dihitung).
  const revenue = db.orders.reduce((sum, order) => sum + orderPaid(order), 0);
  const outstanding = db.orders.reduce((sum, order) => sum + orderOutstanding(order), 0);
  const billable = db.orders.filter((order) => order.status !== 'cancelled');
  const average = billable.reduce((sum, order) => sum + order.total, 0) / Math.max(1, billable.length);

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setCustomerId('');
    setOpen(true);
  };

  const openEdit = (order: OrderRecord) => {
    const match = db.customers.find((customer) => normalizeEmail(customer.email) === normalizeEmail(order.email));
    setEditing(order);
    setCustomerId(match ? String(match.id) : '');
    setForm({
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      templateId: order.templateId ? String(order.templateId) : '',
      packageName: order.packageName,
      status: order.status,
      total: order.total,
      paid: order.paid ?? '',
      paidAt: order.paidAt ?? '',
      date: order.date,
      notes: order.notes || '',
    });
    setOpen(true);
  };

  // Memilih pelanggan lama menyamakan email persis, agar pesanan pasti tertaut.
  const chooseCustomer = (value: string) => {
    setCustomerId(value);
    if (!value) return;
    const customer = db.customers.find((item) => String(item.id) === value);
    if (customer) setForm((current) => ({ ...current, customerName: customer.name, email: customer.email, phone: customer.phone }));
  };

  const submit = () => {
    const name = form.customerName.trim();
    if (!name) {
      window.alert('Nama pelanggan wajib diisi.');
      return;
    }
    const email = normalizeEmail(form.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      window.alert('Format email tidak valid.');
      return;
    }
    const total = Number(form.total);
    if (!Number.isFinite(total) || total <= 0) {
      window.alert('Total pesanan harus lebih dari 0.');
      return;
    }
    const paid = form.paid === '' ? undefined : Number(form.paid);
    if (paid !== undefined && (!Number.isFinite(paid) || paid < 0)) {
      window.alert('Jumlah pembayaran tidak valid.');
      return;
    }
    if (paid !== undefined && paid > total) {
      window.alert('Jumlah pembayaran tidak boleh melebihi total pesanan.');
      return;
    }
    const payload = {
      customerName: name,
      email,
      phone: form.phone,
      templateId: form.templateId ? Number(form.templateId) : null,
      packageName: form.packageName,
      status: form.status,
      total,
      // Kosong = ikut status pesanan, supaya data lama tetap terhitung benar.
      paid,
      paidAt: form.paidAt || undefined,
      date: form.date,
      notes: form.notes,
    };
    if (editing) updateOrder(editing.id, payload);
    else createOrder(payload);
    setOpen(false);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Bisnis"
        title="Pesanan"
        description="Kelola transaksi undangan, status pembayaran, dan catatan pelanggan."
        actions={
          <button type="button" className="adm-btn adm-btn--dark" onClick={openCreate}>
            <Plus size={15} /> Pesanan Baru
          </button>
        }
      />

      <div className="adm-stats adm-stats--compact">
        <div className="adm-mini-stat">
          <span><Wallet size={14} /> Pendapatan</span>
          <strong>{rupiah(revenue)}</strong>
        </div>
        <div className="adm-mini-stat">
          <span><Clock size={14} /> Belum dibayar</span>
          <strong>{rupiah(outstanding)}</strong>
        </div>
        <div className="adm-mini-stat">
          <span><CircleDollarSign size={14} /> Total pesanan</span>
          <strong>{db.orders.length}</strong>
        </div>
        <div className="adm-mini-stat">
          <span>Rata-rata transaksi</span>
          <strong>{rupiah(Math.round(average))}</strong>
        </div>
      </div>

      <section className="adm-panel">
        <div className="adm-toolbar">
          <div className="adm-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari ID, nama, atau email…" />
          </div>
          <div className="adm-filter-tabs">
            <button type="button" className={status === 'all' ? 'is-active' : undefined} onClick={() => setStatus('all')}>
              Semua
            </button>
            {STATUSES.map((item) => (
              <button key={item} type="button" className={status === item ? 'is-active' : undefined} onClick={() => setStatus(item)}>
                {item.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Pelanggan</th>
                <th>Template</th>
                <th>Paket</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th className="is-right">Total</th>
                <th className="is-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const template = db.pages.find((page) => page.id === order.templateId);
                const paid = orderPaid(order);
                const partial = paid > 0 && paid < order.total;
                const brand = db.settings.siteName || 'bydreamy';
                return (
                  <tr key={order.id}>
                    <td><strong>{order.id}</strong>{order.notes && <small title={order.notes}>Catatan</small>}</td>
                    <td>
                      {order.customerName}
                      <small>{order.email}</small>
                    </td>
                    <td>{template ? template.templateName || template.label : <span className="adm-muted">—</span>}</td>
                    <td>{order.packageName}</td>
                    <td>
                      <select
                        className={`adm-status-select is-${order.status}`}
                        value={order.status}
                        onChange={(event) => {
                          // Status menentukan jumlah terbayar, kecuali saat dikerjakan (DP diisi manual).
                          const next = event.target.value as OrderRecord['status'];
                          const synced = paidForStatus(next, order.total);
                          updateOrder(order.id, synced === undefined ? { status: next } : { status: next, paid: synced });
                        }}
                      >
                        {STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {item.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="adm-muted">{shortDate(order.date)}</td>
                    <td className="is-right">
                      {rupiah(order.total)}
                      {partial && <small className="adm-muted">DP {rupiah(paid)}</small>}
                    </td>
                    <td className="is-right">
                      <div className="adm-actions">
                        <a
                          className="adm-icon-btn"
                          title="Kirim ringkasan via WhatsApp"
                          href={whatsappLink(order.phone, orderText(order, brand, paid))}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle size={15} />
                        </a>
                        <button
                          type="button"
                          className="adm-icon-btn"
                          title="Cetak nota"
                          onClick={() => printNota(order, paid, db.settings, template ? template.templateName || template.label : '')}
                        >
                          <Printer size={15} />
                        </button>
                        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openEdit(order)}>
                          Edit
                        </button>
                        <ConfirmButton
                          className="adm-icon-btn adm-icon-btn--danger"
                          message={`Hapus pesanan ${order.id}?`}
                          onConfirm={() => deleteOrder(order.id)}
                        >
                          <Trash2 size={15} />
                        </ConfirmButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <div className="adm-empty"><h3>Tidak ada pesanan</h3><p>Ubah filter atau tambahkan pesanan baru.</p></div>}
      </section>

      <Modal
        open={open}
        wide
        title={editing ? `Edit pesanan ${editing.id}` : 'Pesanan baru'}
        description="Data pelanggan baru otomatis masuk ke daftar pelanggan."
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button type="button" className="adm-btn adm-btn--dark" onClick={submit} disabled={!form.customerName.trim()}>
              {editing ? 'Simpan Pesanan' : 'Buat Pesanan'}
            </button>
          </>
        }
      >
        <div className="adm-form-grid">
          <Field label="Pelanggan" full>
            <select className="adm-select" value={customerId} onChange={(event) => chooseCustomer(event.target.value)}>
              <option value="">Pelanggan baru…</option>
              {db.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} — {customer.email}
                </option>
              ))}
            </select>
          </Field>
          {customerId ? (
            <Field label="Kontak pelanggan" full>
              <div className="adm-inline">
                <strong>{form.customerName}</strong>
                <span className="adm-muted">
                  {form.email || 'tanpa email'} · {form.phone || 'tanpa nomor'}
                </span>
              </div>
            </Field>
          ) : (
            <>
              <Field label="Nama pelanggan">
                <input className="adm-input-plain" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
              </Field>
              <Field label="Email">
                <input className="adm-input-plain" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="No. WhatsApp">
                <input className="adm-input-plain" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
            </>
          )}
          <Field label="Template">
            <select
              className="adm-select"
              value={form.templateId}
              onChange={(event) => setForm({ ...form, templateId: event.target.value })}
            >
              <option value="">Tanpa template</option>
              {db.pages
                .filter((page) => page.kind === 'template')
                .map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.templateName || page.label}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Paket">
            <input className="adm-input-plain" value={form.packageName} onChange={(event) => setForm({ ...form, packageName: event.target.value })} />
          </Field>
          <Field label="Status">
            <select
              className="adm-select"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as OrderRecord['status'] })}
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total (Rp)">
            <input
              type="number"
              className="adm-input-plain"
              value={form.total}
              onChange={(event) => setForm({ ...form, total: Number(event.target.value) })}
            />
          </Field>
          <Field label="Sudah dibayar (Rp)" hint="Isi sebagian untuk DP. Kosongkan bila ingin mengikuti status pesanan.">
            <input
              type="number"
              className="adm-input-plain"
              placeholder="0"
              value={form.paid}
              onChange={(event) =>
                setForm({ ...form, paid: event.target.value === '' ? '' : Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Tanggal bayar">
            <input
              type="date"
              className="adm-input-plain"
              value={form.paidAt}
              onChange={(event) => setForm({ ...form, paidAt: event.target.value })}
            />
          </Field>
          <Field label="Tanggal">
            <input type="date" className="adm-input-plain" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </Field>
          <Field label="Catatan" full>
            <textarea className="adm-textarea" rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </Field>
        </div>
        {editing && (
          <div className="adm-inline" style={{ marginTop: 16 }}>
            <StatusPill status={editing.status} />
            <span className="adm-muted">Dibuat {shortDate(editing.date)}</span>
          </div>
        )}
      </Modal>
    </div>
  );
}
