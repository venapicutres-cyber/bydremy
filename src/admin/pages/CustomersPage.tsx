import { useMemo, useState } from 'react';
import { History, Mail, MessageCircle, Plus, Search, Trash2, Users } from 'lucide-react';
import {
  createCustomer,
  customerSummaries,
  deleteCustomer,
  EMPTY_SUMMARY,
  normalizeEmail,
  orderOutstanding,
  orderPaid,
  updateCustomer,
  useDatabase,
} from '../../services/store';
import type { CustomerRecord } from '../../data/types';
import { ConfirmButton, Field, Modal, PageHeader } from '../ui';
import { rupiah, shortDate } from '../../utils/format';
import { statusLabel } from '../../utils/nota';

const blank = { name: '', email: '', phone: '', joined: new Date().toISOString().slice(0, 10) };

export function CustomersPage() {
  const db = useDatabase();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [form, setForm] = useState(blank);
  const [history, setHistory] = useState<CustomerRecord | null>(null);

  // Jumlah pesanan & nilai dihitung dari pesanan supaya selalu sama dengan halaman Pesanan.
  const summaries = useMemo(() => customerSummaries(db.orders), [db.orders]);
  const summaryOf = (email: string) => summaries.get(normalizeEmail(email)) ?? EMPTY_SUMMARY;
  const ordersOf = (email: string) => {
    const key = normalizeEmail(email);
    return db.orders.filter((order) => normalizeEmail(order.email) === key).sort((a, b) => (a.date < b.date ? 1 : -1));
  };

  const customers = useMemo(
    () =>
      db.customers
        .filter((customer) =>
          query ? `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase()) : true,
        )
        .sort((a, b) => summaryOf(b.email).count - summaryOf(a.email).count),
    [db.customers, query, summaries],
  );

  const totalValue = db.customers.reduce((sum, customer) => sum + summaryOf(customer.email).value, 0);
  const totalOrders = db.customers.reduce((sum, customer) => sum + summaryOf(customer.email).count, 0);

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (customer: CustomerRecord) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      joined: customer.joined,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) return;
    // Email dinormalkan saat disimpan agar tautan pesanan↔pelanggan tetap cocok.
    const payload = { ...form, email: normalizeEmail(form.email) };
    if (editing) updateCustomer(editing.id, payload);
    else createCustomer(payload);
    setOpen(false);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Bisnis"
        title="Pelanggan"
        description="Data pasangan yang pernah atau sedang memesan undangan bydreamy."
        actions={
          <button type="button" className="adm-btn adm-btn--dark" onClick={openCreate}>
            <Plus size={15} /> Pelanggan Baru
          </button>
        }
      />

      <div className="adm-stats adm-stats--compact">
        <div className="adm-mini-stat">
          <span><Users size={14} /> Total pelanggan</span>
          <strong>{db.customers.length}</strong>
        </div>
        <div className="adm-mini-stat">
          <span>Pelanggan berulang</span>
          <strong>{db.customers.filter((customer) => summaryOf(customer.email).count > 1).length}</strong>
        </div>
        <div className="adm-mini-stat">
          <span>Total nilai pelanggan</span>
          <strong>{rupiah(totalValue)}</strong>
        </div>
        <div className="adm-mini-stat">
          <span>Rata-rata pesanan</span>
          <strong>{(totalOrders / Math.max(1, db.customers.length)).toFixed(1)}×</strong>
        </div>
      </div>

      <section className="adm-panel">
        <div className="adm-toolbar">
          <div className="adm-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, email, atau nomor…" />
          </div>
          <span className="adm-toolbar__count">{customers.length} pelanggan</span>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Pelanggan</th>
                <th>Kontak</th>
                <th className="is-center">Pesanan</th>
                <th className="is-right">Nilai</th>
                <th>Bergabung</th>
                <th className="is-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const summary = summaryOf(customer.email);
                return (
                  <tr key={customer.id}>
                    <td>
                      <div className="adm-person">
                        <span className="adm-avatar adm-avatar--sm">{customer.name.slice(0, 1)}</span>
                        <div>
                          <button
                            type="button"
                            className="adm-person__name"
                            title="Lihat riwayat pesanan"
                            onClick={() => setHistory(customer)}
                          >
                            {customer.name}
                            <History size={11} />
                          </button>
                          <small>{customer.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="adm-contact">
                        <a href={`mailto:${customer.email}`} title={customer.email}>
                          <Mail size={14} />
                        </a>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${customer.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          title={customer.phone}
                        >
                          <MessageCircle size={14} />
                        </a>
                        <span>{customer.phone}</span>
                      </div>
                    </td>
                    <td className="is-center">
                      <span className="adm-count">{summary.count}</span>
                    </td>
                    <td className="is-right">
                      {rupiah(summary.value)}
                      {summary.outstanding > 0 && <small className="adm-muted">Sisa {rupiah(summary.outstanding)}</small>}
                    </td>
                    <td className="adm-muted">{summary.lastOrder ? shortDate(summary.lastOrder) : shortDate(customer.joined)}</td>
                    <td className="is-right">
                      <div className="adm-actions">
                        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openEdit(customer)}>
                          Edit
                        </button>
                        {summary.count > 0 ? (
                          <button
                            type="button"
                            className="adm-btn adm-btn--ghost adm-btn--sm"
                            title="Pelanggan masih punya pesanan"
                            onClick={() => {
                              const key = normalizeEmail(customer.email);
                              const linked = db.orders.filter((order) => normalizeEmail(order.email) === key);
                              window.alert(
                                `${customer.name} masih memiliki ${summary.count} pesanan:\n\n` +
                                  linked.map((order) => `• ${order.id} — ${order.packageName} (${rupiah(order.total)})`).join('\n') +
                                  '\n\nHapus atau alihkan pesanan tersebut dulu agar data tetap sinkron.',
                              );
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <ConfirmButton
                            className="adm-icon-btn adm-icon-btn--danger"
                            message={`Hapus pelanggan "${customer.name}"?`}
                            onConfirm={() => deleteCustomer(customer.id)}
                          >
                            <Trash2 size={15} />
                          </ConfirmButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && <div className="adm-empty"><h3>Tidak ada pelanggan</h3></div>}
      </section>

      <Modal
        open={open}
        title={editing ? 'Edit pelanggan' : 'Pelanggan baru'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button type="button" className="adm-btn adm-btn--dark" onClick={submit} disabled={!form.name.trim()}>
              {editing ? 'Simpan' : 'Tambahkan'}
            </button>
          </>
        }
      >
        <div className="adm-form-grid">
          <Field label="Nama lengkap">
            <input className="adm-input-plain" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Email">
            <input
              className="adm-input-plain"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="dipakai untuk mencocokkan pesanan"
            />
          </Field>
          <Field label="No. WhatsApp">
            <input className="adm-input-plain" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label="Tanggal bergabung">
            <input type="date" className="adm-input-plain" value={form.joined} onChange={(event) => setForm({ ...form, joined: event.target.value })} />
          </Field>
        </div>
        {editing && (
          <div className="adm-inline" style={{ marginTop: 16 }}>
            <span className="adm-muted">
              {summaryOf(editing.email).count} pesanan · {rupiah(summaryOf(editing.email).value)} terbayar
            </span>
          </div>
        )}
      </Modal>

      {history && (
        <Modal
          open
          wide
          title={`Riwayat pesanan — ${history.name}`}
          description={`${summaryOf(history.email).count} pesanan · ${rupiah(summaryOf(history.email).value)} terbayar · ${rupiah(summaryOf(history.email).outstanding)} belum dibayar`}
          onClose={() => setHistory(null)}
          footer={
            <button type="button" className="adm-btn adm-btn--dark" onClick={() => setHistory(null)}>
              Tutup
            </button>
          }
        >
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Paket</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th className="is-right">Total</th>
                  <th className="is-right">Terbayar</th>
                </tr>
              </thead>
              <tbody>
                {ordersOf(history.email).map((order) => {
                  const paid = orderPaid(order);
                  return (
                    <tr key={order.id}>
                      <td><strong>{order.id}</strong></td>
                      <td>{order.packageName}</td>
                      <td>{statusLabel(order.status)}</td>
                      <td className="adm-muted">{shortDate(order.date)}</td>
                      <td className="is-right">{rupiah(order.total)}</td>
                      <td className="is-right">
                        {rupiah(paid)}
                        {paid < order.total && order.status !== 'cancelled' && (
                          <small className="adm-muted">Sisa {rupiah(orderOutstanding(order))}</small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {summaryOf(history.email).count === 0 && (
            <div className="adm-empty">
              <h3>Belum ada pesanan</h3>
              <p>Pelanggan ini belum memiliki transaksi. Buat pesanan baru di halaman Pesanan lalu pilih namanya.</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
