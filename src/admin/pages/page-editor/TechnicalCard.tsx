import { LayoutTemplate } from 'lucide-react';
import type { OrderRecord, PageRecord } from '../../../data/types';
import { rupiah } from '../../../utils/format';

interface TechnicalCardProps {
  page: PageRecord;
  orders: OrderRecord[];
  hidden: string[];
  overrides: Record<string, string>;
  imageOverrides: Record<string, string>;
}

export function TechnicalCard({ page, orders, hidden, overrides, imageOverrides }: TechnicalCardProps) {
  const relatedOrders = orders.filter((order) => order.templateId === page.id);

  return (
    <div className="adm-side-card">
      <h3>Info teknis</h3>
      <dl className="adm-side-meta">
        <div>
          <dt>File konten</dt>
          <dd>
            <code>{page.file}</code>
          </dd>
        </div>
        <div>
          <dt>Stylesheet</dt>
          <dd>
            <code>{page.css}</code>
          </dd>
        </div>
        <div>
          <dt>Tipe</dt>
          <dd>
            <LayoutTemplate size={13} /> {page.kind}
          </dd>
        </div>
        <div>
          <dt>Section tersembunyi</dt>
          <dd>{hidden.length}</dd>
        </div>
        <div>
          <dt>Teks diubah</dt>
          <dd>{Object.keys(overrides).length}</dd>
        </div>
        <div>
          <dt>URL gambar diganti</dt>
          <dd>{Object.keys(imageOverrides).length}</dd>
        </div>
      </dl>
      {page.kind === 'template' && page.templateName && (
        <p className="adm-muted">Pesanan terkait: {relatedOrders.length}</p>
      )}
      {page.kind === 'template' && (
        <p className="adm-muted">
          Nilai paket rata-rata:{' '}
          {rupiah(relatedOrders.reduce((sum, order) => sum + order.total, 0) / Math.max(1, relatedOrders.length))}
        </p>
      )}
    </div>
  );
}
