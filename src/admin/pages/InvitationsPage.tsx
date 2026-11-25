import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Eye, FilePenLine, Mail, Plus, Search, Trash2 } from 'lucide-react';
import { deletePage, useDatabase } from '../../services/store';
import { shortDate } from '../../utils/format';
import { isInvitation } from '../../utils/invitations';
import { resolveMediaRef } from '../../utils/mediaRef';
import { ConfirmButton, EmptyState, PageHeader, StatusPill, Toolbar } from '../ui';

type FilterStatus = 'all' | 'published' | 'draft';

export function InvitationsPage() {
  const db = useDatabase();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FilterStatus>('all');

  const invitations = useMemo(() => {
    const list = db.pages.filter(isInvitation).filter((page) => {
      if (status !== 'all' && page.status !== status) return false;
      if (!query) return true;
      return `${page.label} ${page.templateName || ''} ${page.route}`.toLowerCase().includes(query.toLowerCase());
    });
    return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [db.pages, query, status]);

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Undangan Klien"
        title="Undangan"
        description="Buat undangan dari template demo, sunting isinya, lalu bagikan tautannya ke tamu."
        actions={
          <Link to="/admin/invitations/new" className="adm-btn adm-btn--dark">
            <Plus size={15} /> Buat Undangan
          </Link>
        }
      />

      <section className="adm-panel">
        <Toolbar>
          <div className="adm-search">
            <Search size={16} />
            <input
              value={query}
              placeholder="Cari nama acara, template, atau tautan…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="adm-seg">
            {(['all', 'published', 'draft'] as FilterStatus[]).map((item) => (
              <button
                key={item}
                type="button"
                className={status === item ? 'is-active' : undefined}
                onClick={() => setStatus(item)}
              >
                {item === 'all' ? 'Semua' : item === 'published' ? 'Terbit' : 'Draf'}
              </button>
            ))}
          </div>
        </Toolbar>

        {invitations.length === 0 ? (
          <EmptyState
            title="Belum ada undangan"
            description="Pilih template demo, isi data acara, lalu undangan siap dibagikan."
            action={
              <Link to="/admin/invitations/new" className="adm-btn adm-btn--dark">
                <Plus size={15} /> Buat Undangan
              </Link>
            }
          />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--pages">
              <thead>
                <tr>
                  <th>Undangan</th>
                  <th>Template</th>
                  <th>Tautan</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th className="is-right">Dilihat</th>
                  <th className="is-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((page) => (
                  <tr key={page.id}>
                    <td>
                      <div className="adm-row-title">
                        {page.thumb ? (
                          <img src={resolveMediaRef(page.thumb, db.media)} alt="" />
                        ) : (
                          <span className="adm-row-title__icon">
                            <Mail size={15} />
                          </span>
                        )}
                        <div>
                          <Link to={`/admin/invitations/${page.id}`}>{page.label}</Link>
                          <small>{page.title}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="adm-muted">{page.templateName || '—'}</span>
                    </td>
                    <td>
                      <code className="adm-code">{page.route}</code>
                    </td>
                    <td>
                      <StatusPill status={page.status} />
                    </td>
                    <td className="adm-muted">{shortDate(page.updatedAt)}</td>
                    <td className="is-right">{(page.views || 0).toLocaleString('id-ID')}</td>
                    <td className="is-right">
                      <div className="adm-actions">
                        <Link to={`/admin/preview/${page.id}`} title="Pratinjau">
                          <Eye size={15} />
                        </Link>
                        {page.status === 'published' && (
                          <Link to={page.route} target="_blank" title="Buka undangan">
                            <ArrowUpRight size={15} />
                          </Link>
                        )}
                        <Link to={`/admin/invitations/${page.id}`} title="Edit undangan">
                          <FilePenLine size={15} />
                        </Link>
                        <ConfirmButton
                          className="adm-icon-btn adm-icon-btn--danger"
                          message={`Hapus undangan "${page.label}"? Tindakan tidak bisa dibatalkan.`}
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
          <span>{invitations.length} undangan</span>
          <Link to="/admin/pages?kind=template" className="adm-link">
            Lihat template demo <ArrowUpRight size={13} />
          </Link>
        </footer>
      </section>
    </div>
  );
}
