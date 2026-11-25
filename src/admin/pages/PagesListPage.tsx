import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Copy,
  Eye,
  FilePenLine,
  LayoutTemplate,
  Search,
  Trash2,
} from 'lucide-react';
import { useDatabase, duplicatePage, deletePage, updatePage } from '../../services/store';
import { ConfirmButton, EmptyState, PageHeader, StatusPill, Toolbar } from '../ui';
import { shortDate } from '../../utils/format';
import { decodeHtmlEntities } from '../../utils/html';
import { resolveMediaRef } from '../../utils/mediaRef';
import { TemplateCreateModal } from './templates/TemplateCreateModal';
import { TemplateGrid } from './templates/TemplateGrid';

type FilterStatus = 'all' | 'published' | 'draft';

export function PagesListPage() {
  const db = useDatabase();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [status, setStatus] = useState<FilterStatus>((params.get('status') as FilterStatus) || 'all');
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [view, setView] = useState<'table' | 'grid'>('grid');
  const [selected, setSelected] = useState<number[]>([]);
  const [sort, setSort] = useState<'recent' | 'az' | 'views'>('recent');
  const [templateOpen, setTemplateOpen] = useState(false);

  const templates = useMemo(() => db.pages.filter((page) => page.kind === 'template'), [db.pages]);

  useEffect(() => {
    const requested = params.get('kind');
    if (requested === 'page' || requested === 'home') {
      navigate('/admin/homepage', { replace: true });
    }
  }, [params, navigate]);

  useEffect(() => {
    setStatus((params.get('status') as FilterStatus) || 'all');
  }, [params]);

  const pages = useMemo(() => {
    const list = templates.filter((page) => {
      if (status !== 'all' && page.status !== status) return false;
      if (category !== 'all' && page.category !== category) return false;
      if (query) {
        const haystack = `${page.label} ${page.title} ${page.route} ${page.slug}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
    return list.sort((a, b) => {
      if (sort === 'az') return a.label.localeCompare(b.label);
      if (sort === 'views') return (b.views || 0) - (a.views || 0);
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [templates, query, status, category, sort]);

  const applyParam = (next: { q?: string; status?: FilterStatus }) => {
    const updated = new URLSearchParams(params);
    if (next.q !== undefined) {
      if (next.q) updated.set('q', next.q);
      else updated.delete('q');
    }
    if (next.status !== undefined) {
      if (next.status !== 'all') updated.set('status', next.status);
      else updated.delete('status');
    }
    setParams(updated, { replace: true });
  };

  const toggleAll = () => {
    setSelected(selected.length === pages.length ? [] : pages.map((page) => page.id));
  };

  const bulk = (action: 'publish' | 'draft' | 'delete') => {
    if (!selected.length) return;
    if (action === 'delete') {
      if (!window.confirm(`Hapus ${selected.length} template? Tindakan tidak bisa dibatalkan.`)) return;
      selected.forEach((id) => deletePage(id));
    } else {
      selected.forEach((id) => updatePage(id, { status: action === 'publish' ? 'published' : 'draft' }));
    }
    setSelected([]);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Konten"
        title="Template Demo"
        description="Kelola 25 template demo bydreamy: status publikasi, route demo, dan konten tiap desain."
        actions={
          <button type="button" className="adm-btn adm-btn--dark" onClick={() => setTemplateOpen(true)}>
            <LayoutTemplate size={15} /> Tambah Template
          </button>
        }
      />

      <section className="adm-panel">
        <Toolbar>
          <div className="adm-search">
            <Search size={16} />
            <input
              value={query}
              placeholder="Cari template, judul, atau route…"
              onChange={(event) => {
                setQuery(event.target.value);
                applyParam({ q: event.target.value });
              }}
            />
          </div>
          <div className="adm-seg">
            {(['all', 'published', 'draft'] as FilterStatus[]).map((item) => (
              <button
                key={item}
                type="button"
                className={status === item ? 'is-active' : undefined}
                onClick={() => {
                  setStatus(item);
                  applyParam({ status: item });
                }}
              >
                {item === 'all' ? 'Semua' : item === 'published' ? 'Published' : 'Draft'}
              </button>
            ))}
          </div>
          <div className="adm-seg">
            <button type="button" className={view === 'grid' ? 'is-active' : undefined} onClick={() => setView('grid')}>
              Galeri
            </button>
            <button type="button" className={view === 'table' ? 'is-active' : undefined} onClick={() => setView('table')}>
              Tabel
            </button>
          </div>
          <select className="adm-select" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Semua kategori</option>
            {db.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select className="adm-select" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
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
          <EmptyState
            title="Belum ada template yang cocok"
            description="Ubah filter atau tambah template demo baru."
            action={
              <button type="button" className="adm-btn adm-btn--dark" onClick={() => setTemplateOpen(true)}>
                <LayoutTemplate size={15} /> Tambah Template
              </button>
            }
          />
        ) : view === 'grid' ? (
          <TemplateGrid templates={pages} />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--pages">
              <thead>
                <tr>
                  <th className="adm-check-col">
                    <input
                      type="checkbox"
                      checked={selected.length === pages.length}
                      onChange={toggleAll}
                      aria-label="Pilih semua"
                    />
                  </th>
                  <th>Template</th>
                  <th>Route demo</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th className="is-right">Views</th>
                  <th className="is-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className={selected.includes(page.id) ? 'is-selected' : undefined}>
                    <td className="adm-check-col">
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
                          <Link to={`/admin/pages/${page.id}`}>{page.label}</Link>
                          <small>{decodeHtmlEntities(page.title)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="adm-code">{page.route}</code>
                    </td>
                    <td>
                      <span className="adm-muted">
                        {db.categories.find((item) => item.id === page.category)?.name || 'Tanpa kategori'}
                      </span>
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
                        <Link to={page.route} target="_blank" title="Lihat template demo">
                          <Eye size={15} />
                        </Link>
                        <Link to={`/admin/pages/${page.id}`} title="Edit">
                          <FilePenLine size={15} />
                        </Link>
                        <button
                          type="button"
                          title="Salin template"
                          aria-label={`Salin template ${page.label}`}
                          onClick={() => {
                            const copy = duplicatePage(page.id);
                            if (copy) navigate(`/admin/pages/${copy.id}`);
                          }}
                        >
                          <Copy size={15} />
                        </button>
                        <ConfirmButton
                          className="adm-icon-btn adm-icon-btn--danger"
                          message={`Hapus template "${page.label}"?`}
                          onConfirm={() => deletePage(page.id)}
                        >
                          <Trash2 size={15} />
                        </ConfirmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="adm-panel__foot">
          <span>
            Menampilkan {pages.length} dari {templates.length} template
          </span>
          <Link to="/admin/homepage" className="adm-link">
            Kelola halaman website <ArrowUpRight size={13} />
          </Link>
        </footer>
      </section>

      <TemplateCreateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />
    </div>
  );
}
