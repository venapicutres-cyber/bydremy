import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Eye, FilePenLine, LayoutTemplate, Plus, Search, Trash2 } from 'lucide-react';
import { useDatabase, deletePage, duplicatePage, updatePage } from '../../../services/store';
import { shortDate } from '../../../utils/format';
import { decodeHtmlEntities } from '../../../utils/html';
import { isInvitation } from '../../../utils/invitations';
import { resolveMediaRef } from '../../../utils/mediaRef';
import { ConfirmButton, EmptyState, StatusPill, Toolbar } from '../../ui';

type FilterStatus = 'all' | 'published' | 'draft';
type SortMode = 'order' | 'recent' | 'az' | 'views';

export function WebsitePagesSection() {
  const db = useDatabase();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortMode>('order');
  const [selected, setSelected] = useState<number[]>([]);

  const websitePages = useMemo(
    () => db.pages.filter((page) => page.kind !== 'template' && !isInvitation(page)),
    [db.pages],
  );

  const pages = useMemo(() => {
    const list = websitePages.filter((page) => {
      if (status !== 'all' && page.status !== status) return false;
      if (query) {
        const haystack = `${page.label} ${page.title} ${page.route}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
    return list.sort((a, b) => {
      if (sort === 'recent') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      if (sort === 'az') return a.label.localeCompare(b.label);
      if (sort === 'views') return (b.views || 0) - (a.views || 0);
      if (a.kind === 'home') return -1;
      if (b.kind === 'home') return 1;
      return a.order - b.order;
    });
  }, [websitePages, query, status, sort]);

  const selectable = useMemo(() => pages.filter((page) => page.kind !== 'home'), [pages]);

  const toggleAll = () => {
    setSelected(selected.length === selectable.length ? [] : selectable.map((page) => page.id));
  };

  const bulk = (action: 'publish' | 'draft' | 'delete') => {
    if (!selected.length) return;
    if (action === 'delete') {
      if (!window.confirm(`Hapus ${selected.length} halaman website? Tindakan tidak bisa dibatalkan.`)) return;
      selected.forEach((id) => deletePage(id));
    } else {
      selected.forEach((id) => updatePage(id, { status: action === 'publish' ? 'published' : 'draft' }));
    }
    setSelected([]);
  };

  return (
    <section className="adm-panel adm-homepage-pages">
      <header className="adm-panel__head">
        <div>
          <h2 className="adm-panel__title">Halaman website</h2>
          <p className="adm-panel__desc">
            Homepage dan halaman statis situs. Template demo dikelola terpisah di menu Template Demo.
          </p>
        </div>
        <div className="adm-page-head__actions">
          <Link to="/admin/pages?kind=template" className="adm-btn adm-btn--ghost">
            <LayoutTemplate size={15} /> Template Demo
          </Link>
          <Link to="/admin/homepage/new" className="adm-btn adm-btn--dark">
            <Plus size={15} /> Halaman Baru
          </Link>
        </div>
      </header>

      <Toolbar>
        <div className="adm-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari halaman atau route…" />
        </div>
        <div className="adm-seg">
          {(['all', 'published', 'draft'] as FilterStatus[]).map((item) => (
            <button
              key={item}
              type="button"
              className={status === item ? 'is-active' : undefined}
              onClick={() => setStatus(item)}
            >
              {item === 'all' ? 'Semua' : item === 'published' ? 'Published' : 'Draft'}
            </button>
          ))}
        </div>
        <select className="adm-select" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
          <option value="order">Urutan halaman</option>
          <option value="recent">Terbaru diubah</option>
          <option value="az">Nama A–Z</option>
          <option value="views">Paling dilihat</option>
        </select>
      </Toolbar>

      {selected.length > 0 && (
        <div className="adm-bulkbar">
          <span>{selected.length} dipilih</span>
          <button type="button" onClick={() => bulk('publish')}>
            Publish
          </button>
          <button type="button" onClick={() => bulk('draft')}>
            Jadikan draft
          </button>
          <button type="button" className="is-danger" onClick={() => bulk('delete')}>
            Hapus
          </button>
          <button type="button" className="adm-bulkbar__clear" onClick={() => setSelected([])}>
            Batal
          </button>
        </div>
      )}

      {pages.length === 0 ? (
        <EmptyState title="Tidak ada halaman yang cocok" description="Ubah kata kunci atau filter status." />
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--pages">
            <thead>
              <tr>
                <th className="adm-check-col">
                  <input
                    type="checkbox"
                    checked={selectable.length > 0 && selected.length === selectable.length}
                    onChange={toggleAll}
                    aria-label="Pilih semua halaman statis"
                  />
                </th>
                <th>Halaman</th>
                <th>Route</th>
                <th>Tipe</th>
                <th>Status</th>
                <th>Diperbarui</th>
                <th className="is-right">Views</th>
                <th className="is-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const isHome = page.kind === 'home';
                return (
                  <tr key={page.id} className={selected.includes(page.id) ? 'is-selected' : undefined}>
                    <td className="adm-check-col">
                      {!isHome && (
                        <input
                          type="checkbox"
                          checked={selected.includes(page.id)}
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked ? [...current, page.id] : current.filter((id) => id !== page.id),
                            )
                          }
                          aria-label={`Pilih ${page.label}`}
                        />
                      )}
                    </td>
                    <td>
                      <div className="adm-row-title">
                        {page.thumb ? (
                          <img src={resolveMediaRef(page.thumb, db.media)} alt="" />
                        ) : (
                          <span className="adm-row-title__icon">
                            <LayoutTemplate size={15} />
                          </span>
                        )}
                        <div>
                          <Link to={`/admin/homepage/${page.id}`}>{page.label}</Link>
                          <small>{decodeHtmlEntities(page.title)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="adm-code">{page.route}</code>
                    </td>
                    <td>
                      <span className="adm-muted">{isHome ? 'Homepage' : 'Halaman'}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="adm-status-btn"
                        title="Klik untuk mengganti status"
                        onClick={() =>
                          updatePage(page.id, { status: page.status === 'published' ? 'draft' : 'published' })
                        }
                      >
                        <StatusPill status={page.status} />
                      </button>
                    </td>
                    <td className="adm-muted">{shortDate(page.updatedAt)}</td>
                    <td className="is-right">{(page.views || 0).toLocaleString('id-ID')}</td>
                    <td className="is-right">
                      <div className="adm-actions">
                        <Link to={page.route} target="_blank" title="Lihat halaman">
                          <Eye size={15} />
                        </Link>
                        <Link to={`/admin/homepage/${page.id}`} title="Edit">
                          <FilePenLine size={15} />
                        </Link>
                        <button
                          type="button"
                          title="Duplikat"
                          onClick={() => {
                            const copy = duplicatePage(page.id);
                            if (copy) window.alert(`Duplikat dibuat: ${copy.label}`);
                          }}
                        >
                          <Copy size={15} />
                        </button>
                        {isHome ? (
                          <button type="button" className="adm-icon-btn adm-icon-btn--danger" disabled title="Homepage tidak bisa dihapus">
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <ConfirmButton
                            className="adm-icon-btn adm-icon-btn--danger"
                            message={`Hapus halaman "${page.label}"?`}
                            onConfirm={() => deletePage(page.id)}
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
      )}

      <footer className="adm-panel__foot">
        <span>
          Menampilkan {pages.length} dari {websitePages.length} halaman website
        </span>
      </footer>
    </section>
  );
}
