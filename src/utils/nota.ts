import type { OrderRecord, SettingsRecord } from '../data/types';
import { rupiah, shortDate } from './format';

const STATUS_LABEL: Record<OrderRecord['status'], string> = {
  pending: 'Menunggu pembayaran',
  paid: 'Sudah dibayar',
  in_progress: 'Sedang dikerjakan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export function statusLabel(status: OrderRecord['status']): string {
  return STATUS_LABEL[status];
}

/** 0812… / +62 812… / 62 812… → 62812… supaya bisa dipakai tautan wa.me. */
export function waNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  return `62${digits.replace(/^0+/, '')}`;
}

/** Ringkasan pesanan siap kirim sebagai pesan WhatsApp. */
export function orderText(order: OrderRecord, brand: string, paid: number): string {
  const lines = [
    `Halo ${order.customerName}, berikut ringkasan pesanan undangan Anda di ${brand}.`,
    '',
    `No. pesanan: ${order.id}`,
    `Paket: ${order.packageName}`,
    `Tanggal: ${shortDate(order.date)}`,
    `Total: ${rupiah(order.total)}`,
    `Status: ${STATUS_LABEL[order.status]}`,
  ];
  if (paid > 0 && paid < order.total) {
    lines.push(`Sudah dibayar: ${rupiah(paid)}`, `Sisa: ${rupiah(order.total - paid)}`);
  }
  if (order.notes) lines.push('', `Catatan: ${order.notes}`);
  lines.push('', 'Terima kasih.');
  return lines.join('\n');
}

export function whatsappLink(phone: string, text: string): string {
  const query = new URLSearchParams({ text }).toString();
  const number = waNumber(phone);
  return number ? `https://wa.me/${number}?${query}` : `https://wa.me/?${query}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Membuka jendela cetak berisi nota. Dipakai untuk simpan PDF lewat
 * dialog cetak browser (tanpa pustaka tambahan).
 */
export function printNota(order: OrderRecord, paid: number, settings: SettingsRecord, templateName: string): boolean {
  const win = window.open('', '_blank', 'width=760,height=920');
  if (!win) return false;
  const remaining = Math.max(0, order.total - paid);
  const rows = [
    ['Paket', order.packageName],
    ['Template', templateName || '—'],
    ['Tanggal pesanan', shortDate(order.date)],
    ['Status', STATUS_LABEL[order.status]],
  ];
  const money = [
    ['Total', rupiah(order.total)],
    ['Sudah dibayar', rupiah(paid)],
    ['Sisa tagihan', rupiah(remaining)],
  ];
  win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8" />
<title>Nota ${escapeHtml(order.id)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px; font: 14px/1.6 Helvetica, Arial, sans-serif; color: #1f1d1a; }
  h1 { margin: 0; font-size: 20px; letter-spacing: 0.08em; text-transform: uppercase; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${escapeHtml(settings.primaryColor || '#1f1d1a')}; padding-bottom: 16px; }
  .muted { color: #7a7370; font-size: 12px; }
  .code { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
  dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; }
  dt { color: #7a7370; } dd { margin: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  td { padding: 7px 0; border-bottom: 1px solid #eee7dd; }
  td:last-child { text-align: right; font-weight: 600; }
  .total td { border-bottom: 2px solid ${escapeHtml(settings.primaryColor || '#1f1d1a')}; font-size: 16px; }
  .foot { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee7dd; color: #7a7370; font-size: 12px; }
  @media print { body { padding: 0; } }
</style></head><body>
<div class="head">
  <div>
    <h1>${escapeHtml(settings.siteName || 'bydreamy')}</h1>
    <div class="muted">${escapeHtml(settings.tagline || 'Undangan Digital')}</div>
  </div>
  <div style="text-align:right">
    <div class="muted">No. pesanan</div>
    <div class="code">${escapeHtml(order.id)}</div>
  </div>
</div>
<div class="grid">
  <div>
    <div class="muted">Ditagihkan kepada</div>
    <dl>
      <dt>Nama</dt><dd>${escapeHtml(order.customerName)}</dd>
      <dt>Email</dt><dd>${escapeHtml(order.email || '—')}</dd>
      <dt>WhatsApp</dt><dd>${escapeHtml(order.phone || '—')}</dd>
    </dl>
  </div>
  <div>
    <dl>${rows.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>
  </div>
</div>
<table>${money.map(([key, value], index) => `<tr class="${index === 0 ? 'total' : ''}"><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`).join('')}</table>
${order.notes ? `<div class="foot"><strong>Catatan</strong><br />${escapeHtml(order.notes)}</div>` : ''}
<div class="foot">
  ${escapeHtml(settings.email || '')} ${settings.whatsapp ? `· ${escapeHtml(settings.whatsapp)}` : ''}
  ${settings.address ? `<br />${escapeHtml(settings.address)}` : ''}
</div>
</body></html>`);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
