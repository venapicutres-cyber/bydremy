import { useMemo, useState } from 'react';
import { Save, Search } from 'lucide-react';
import type { PageRecord } from '../../data/types';
import { rupiah } from '../../utils/format';
import { updatePage, useDatabase } from '../../services/store';
import { PageHeader, StatusPill } from '../ui';

interface PriceDraft {
  price: string;
  priceCompare: string;
}

function draftFromPage(page: PageRecord): PriceDraft {
  return {
    price: page.price ? String(page.price) : '',
    priceCompare: page.priceCompare ? String(page.priceCompare) : '',
  };
}

export function PricesPage() {
  const db = useDatabase();
  const [drafts, setDrafts] = useState<Record<number, PriceDraft>>({});
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templates = useMemo(
    () => db.pages.filter((page) => page.kind === 'template').sort((a, b) => a.order - b.order),
    [db.pages],
  );
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((page) => `${page.label} ${page.templateName || ''} ${page.slug}`.toLowerCase().includes(term));
  }, [templates, query]);

  const draftFor = (page: PageRecord) => drafts[page.id] ?? draftFromPage(page);
  const changedCount = templates.filter((page) => {
    const draft = drafts[page.id];
    if (!draft) return false;
    const initial = draftFromPage(page);
    return draft.price !== initial.price || draft.priceCompare !== initial.priceCompare;
  }).length;

  const setDraft = (page: PageRecord, patch: Partial<PriceDraft>) => {
    setDrafts((current) => ({ ...current, [page.id]: { ...(current[page.id] ?? draftFromPage(page)), ...patch } }));
    setNotice(null);
    setError(null);
  };

  const save = () => {
    const changes: { id: number; price: number; priceCompare: number | null }[] = [];
    for (const page of templates) {
      const draft = drafts[page.id];
      if (!draft) continue;
      const price = Number(draft.price);
      if (!Number.isInteger(price) || price <= 0) {
        setError(`Harga ${page.label} harus berupa angka lebih dari 0.`);
        return;
      }
      const priceCompare = draft.priceCompare.trim() === '' ? null : Number(draft.priceCompare);
      if (priceCompare !== null && (!Number.isInteger(priceCompare) || priceCompare <= price)) {
        setError(`Harga coret ${page.label} harus kosong atau lebih besar dari harga jual.`);
        return;
      }
      changes.push({ id: page.id, price, priceCompare });
    }
    changes.forEach(({ id, price, priceCompare }) => updatePage(id, { price, priceCompare }));
    setDrafts({});
    setNotice(`${changes.length} harga template tersimpan dan tersinkron ke website.`);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Bisnis"
        title="Kelola Harga"
        description="Atur harga jual dan harga coret setiap template. Nilai ini tampil di katalog, halaman detail, dan checkout."
        actions={
          <button type="button" className="adm-btn adm-btn--dark" onClick={save} disabled={!changedCount}>
            <Save size={15} /> Simpan Harga{changedCount > 0 ? ` (${changedCount})` : ''}
          </button>
        }
      />

      {notice && <p className="adm-notice adm-notice--ok" role="status">{notice}</p>}
      {error && <p className="adm-notice adm-notice--error" role="alert">{error}</p>}

      <section className="adm-panel">
        <div className="adm-toolbar">
          <div className="adm-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari template…" aria-label="Cari template" />
          </div>
          <p className="adm-price-summary">
            {templates.length} template · {templates.filter((page) => (page.price ?? 0) > 0).length} sudah ada harga
          </p>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Status</th>
                <th className="is-right">Harga jual (Rp)</th>
                <th className="is-right">Harga coret (Rp)</th>
                <th className="is-right">Tampil di katalog</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((page) => {
                const draft = draftFor(page);
                const preview = Number(draft.price) || 0;
                return (
                  <tr key={page.id}>
                    <td>
                      <strong>{page.templateName || page.label}</strong>
                      <small>{page.slug}</small>
                    </td>
                    <td><StatusPill status={page.status === 'published' ? 'published' : 'draft'} /></td>
                    <td className="is-right">
                      <input
                        className="adm-input-plain adm-price-input"
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={draft.price}
                        onChange={(event) => setDraft(page, { price: event.target.value })}
                        aria-label={`Harga jual ${page.label}`}
                      />
                    </td>
                    <td className="is-right">
                      <input
                        className="adm-input-plain adm-price-input"
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={draft.priceCompare}
                        onChange={(event) => setDraft(page, { priceCompare: event.target.value })}
                        aria-label={`Harga coret ${page.label}`}
                      />
                    </td>
                    <td className="is-right">
                      {preview > 0 ? (
                        <strong className="adm-price-preview">{rupiah(preview)}</strong>
                      ) : (
                        <small>Belum ada harga</small>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="adm-note">
        Klik <strong>Simpan Harga</strong> setelah mengubah satu atau beberapa baris. Perubahan tersimpan otomatis ke database
        dan langsung dipakai pengunjung katalog.
      </div>
    </div>
  );
}
