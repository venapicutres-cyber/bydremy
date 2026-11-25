import { Trash2 } from 'lucide-react';
import type { PageRecord } from '../../../data/types';
import { slugify } from '../../../utils/format';
import { ConfirmButton, Field } from '../../ui';
import type { PageDraft } from './types';

interface AdvancedTabProps {
  draft: PageDraft;
  page: PageRecord | undefined;
  isNew: boolean;
  setField: <K extends keyof PageDraft>(key: K, value: PageDraft[K]) => void;
  onDelete: () => void;
}

export function AdvancedTab({ draft, page, isNew, setField, onDelete }: AdvancedTabProps) {
  return (
    <div className="adm-stack">
      <div className="adm-grid adm-grid--2 adm-fields">
        <Field label="Slug">
          <input
            className="adm-input-plain"
            value={draft.slug}
            onChange={(event) => setField('slug', slugify(event.target.value))}
          />
        </Field>
        <Field label="Route URL">
          <input
            className="adm-input-plain"
            value={draft.route}
            onChange={(event) => setField('route', event.target.value)}
          />
        </Field>
        <Field label="Urutan tampil">
          <input
            type="number"
            className="adm-input-plain"
            value={draft.order}
            onChange={(event) => setField('order', Number(event.target.value))}
          />
        </Field>
        <Field label="Jumlah views">
          <input className="adm-input-plain" value={page?.views || 0} readOnly />
        </Field>
      </div>
      {!isNew && page?.kind === 'template' && (
        <div className="adm-note">
          Template ini terhubung ke pesanan. Menghapusnya tidak menghapus data pesanan, tetapi tautan template pada
          pesanan akan kosong.
        </div>
      )}
      {!isNew && (
        <div className="adm-danger">
          <div>
            <strong>Hapus halaman</strong>
            <p>Halaman akan dihapus permanen dari website dan dashboard.</p>
          </div>
          <ConfirmButton
            className="adm-btn adm-btn--danger"
            message={`Hapus "${page?.label}" secara permanen?`}
            onConfirm={onDelete}
          >
            <Trash2 size={15} /> Hapus Halaman
          </ConfirmButton>
        </div>
      )}
    </div>
  );
}
