import type { CustomerRecord, OrderRecord } from '../../data/types';
import { getDatabase, setDatabase, stamp } from './persistence';

/** Status yang dihitung sebagai pendapatan (uang masuk). */
const PAID: OrderRecord['status'][] = ['paid', 'completed'];
/** Status yang berarti belum ada uang masuk sama sekali. */
const UNPAID: OrderRecord['status'][] = ['pending', 'cancelled'];

/** Uang yang benar-benar sudah diterima. Data lama tanpa `paid` mengikuti statusnya. */
export function orderPaid(order: OrderRecord): number {
  if (typeof order.paid === 'number') return order.paid;
  return PAID.includes(order.status) ? order.total : 0;
}

/** Sisa tagihan yang belum dibayar. Pesanan batal dianggap tidak ada tagihan. */
export function orderOutstanding(order: OrderRecord): number {
  if (order.status === 'cancelled') return 0;
  return Math.max(0, order.total - orderPaid(order));
}

/** Nilai `paid` yang otomatis mengikuti status saat status diubah. */
export function paidForStatus(status: OrderRecord['status'], total: number): number | undefined {
  if (PAID.includes(status)) return total;
  if (UNPAID.includes(status)) return 0;
  return undefined;
}

/** Email adalah kunci penghubung pesanan dengan pelanggan, jadi dinormalkan. */
export function normalizeEmail(email: string | undefined): string {
  return (email || '').trim().toLowerCase();
}

export interface CustomerSummary {
  /** Jumlah seluruh pesanan, apa pun statusnya. */
  count: number;
  /** Total uang yang sudah diterima dari pesanan pelanggan ini. */
  value: number;
  /** Total nilai pesanan yang belum dibayar. */
  outstanding: number;
  /** Tanggal pesanan terbaru. */
  lastOrder: string;
}

/**
 * Ringkasan pelanggan dihitung dari daftar pesanan, bukan disimpan terpisah,
 * supaya angka di halaman Pesanan dan Pelanggan selalu cocok.
 */
export function customerSummaries(orders: OrderRecord[]): Map<string, CustomerSummary> {
  const summaries = new Map<string, CustomerSummary>();
  orders.forEach((order) => {
    const key = normalizeEmail(order.email);
    if (!key) return;
    const summary = summaries.get(key) ?? { count: 0, value: 0, outstanding: 0, lastOrder: '' };
    summary.count += 1;
    summary.value += orderPaid(order);
    summary.outstanding += orderOutstanding(order);
    if (order.date > summary.lastOrder) summary.lastOrder = order.date;
    summaries.set(key, summary);
  });
  return summaries;
}

export const EMPTY_SUMMARY: CustomerSummary = { count: 0, value: 0, outstanding: 0, lastOrder: '' };

/** Nomor pesanan berurutan mengikuti format seed (ATT-2401, ATT-2402, …). */
export function nextOrderId(orders: OrderRecord[]): string {
  const highest = orders.reduce((max, order) => {
    const match = order.id.match(/^ATT-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 2400);
  return `ATT-${highest + 1}`;
}

export function createOrder(input: Partial<OrderRecord>): OrderRecord {
  const record: OrderRecord = {
    id: input.id ?? nextOrderId(getDatabase().orders),
    customerName: input.customerName ?? 'Pelanggan Baru',
    email: input.email ?? '',
    phone: input.phone ?? '',
    templateId: input.templateId ?? null,
    packageName: input.packageName ?? 'Premium',
    status: input.status ?? 'pending',
    total: input.total ?? 399000,
    date: input.date ?? stamp().slice(0, 10),
    notes: input.notes ?? '',
  };
  // `paid` sengaja hanya ditulis kalau ada nilainya, supaya data lama
  // (tanpa field ini) tetap dihitung dari statusnya.
  if (input.paid !== undefined) record.paid = input.paid;
  if (input.paidAt) record.paidAt = input.paidAt;
  setDatabase((db) => ({
    ...db,
    orders: [record, ...db.orders],
    customers: withCustomer(db.customers, {
      name: record.customerName,
      email: record.email,
      phone: record.phone,
      joined: record.date,
    }),
  }));
  return record;
}

export function updateOrder(id: string, patch: Partial<OrderRecord>) {
  setDatabase((db) => {
    const orders = db.orders.map((order) => (order.id === id ? { ...order, ...patch } : order));
    const updated = orders.find((order) => order.id === id);
    if (!updated) return { ...db, orders };
    // Kalau email pesanan diganti, pelanggan barunya ikut didaftarkan agar tetap sinkron.
    return {
      ...db,
      orders,
      customers: withCustomer(db.customers, {
        name: updated.customerName,
        email: updated.email,
        phone: updated.phone,
        joined: updated.date,
      }),
    };
  });
}

export function deleteOrder(id: string) {
  setDatabase((db) => ({ ...db, orders: db.orders.filter((order) => order.id !== id) }));
}

export function createCustomer(input: Partial<CustomerRecord>): CustomerRecord {
  const record: CustomerRecord = {
    id: Date.now(),
    name: input.name ?? 'Pelanggan Baru',
    email: input.email ?? '',
    phone: input.phone ?? '',
    joined: input.joined ?? new Date().toISOString().slice(0, 10),
  };
  setDatabase((db) => ({ ...db, customers: withCustomer(db.customers, record) }));
  return record;
}

export function updateCustomer(id: number, patch: Partial<CustomerRecord>) {
  setDatabase((db) => ({
    ...db,
    customers: db.customers.map((customer) => (customer.id === id ? { ...customer, ...patch } : customer)),
  }));
}

export function deleteCustomer(id: number) {
  setDatabase((db) => ({ ...db, customers: db.customers.filter((customer) => customer.id !== id) }));
}

/** Menambahkan pelanggan hanya jika emailnya belum terdaftar. */
function withCustomer(customers: CustomerRecord[], data: Omit<CustomerRecord, 'id'>): CustomerRecord[] {
  const key = normalizeEmail(data.email);
  if (!key || customers.some((customer) => normalizeEmail(customer.email) === key)) return customers;
  return [...customers, { id: Date.now(), ...data }];
}
