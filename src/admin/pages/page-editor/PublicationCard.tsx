import { Link } from 'react-router-dom';
import { Eye, Save } from 'lucide-react';
import type { PageRecord } from '../../../data/types';
import type { PageDraft } from './types';

interface PublicationCardProps {
  draft: PageDraft;
  page: PageRecord | undefined;
  isNew: boolean;
  setField: <K extends keyof PageDraft>(key: K, value: PageDraft[K]) => void;
  save: () => void;
}

export function PublicationCard({ draft, page, isNew, setField, save }: PublicationCardProps) {
  return (
    <div className="adm-side-card">
      <h3>Publikasi</h3>
      <div className="adm-side-field">
        <span>Status</span>
        <select
          className="adm-select"
          value={draft.status}
          onChange={(event) => setField('status', event.target.value as PageRecord['status'])}
        >
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      <div className="adm-side-actions">
        <button type="button" className="adm-btn adm-btn--dark adm-btn--block" onClick={save}>
          <Save size={15} /> Simpan
        </button>
        {!isNew && (
          <Link to={`/admin/preview/${page!.id}`} className="adm-btn adm-btn--ghost adm-btn--block">
            <Eye size={15} /> Preview halaman
          </Link>
        )}
      </div>
      {!isNew && (
        <dl className="adm-side-meta">
          <div>
            <dt>Dibuat</dt>
            <dd>{page?.updatedAt ? new Date(page.updatedAt).toLocaleDateString('id-ID') : '—'}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{page?.id}</dd>
          </div>
          <div>
            <dt>Views</dt>
            <dd>{(page?.views || 0).toLocaleString('id-ID')}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
