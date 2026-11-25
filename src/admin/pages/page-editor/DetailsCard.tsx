import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useDatabase } from '../../../services/store';
import type { CategoryRecord } from '../../../data/types';
import { Field, MediaPicker } from '../../ui';
import type { PageDraft } from './types';
import { mediaRefValue, resolveMediaRef, toMediaRef } from '../../../utils/mediaRef';

interface DetailsCardProps {
  draft: PageDraft;
  categories: CategoryRecord[];
  setField: <K extends keyof PageDraft>(key: K, value: PageDraft[K]) => void;
}

export function DetailsCard({ draft, categories, setField }: DetailsCardProps) {
  const db = useDatabase();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="adm-side-card">
      <h3>Detail halaman</h3>
      <Field label="Nama halaman">
        <input className="adm-input-plain" value={draft.label} onChange={(event) => setField('label', event.target.value)} />
      </Field>
      <Field label="Judul">
        <input className="adm-input-plain" value={draft.title} onChange={(event) => setField('title', event.target.value)} />
      </Field>
      <Field label="Kategori">
        <select className="adm-select" value={draft.category} onChange={(event) => setField('category', event.target.value)}>
          <option value="">Tanpa kategori</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Thumbnail URL">
        <div className="adm-inline">
          <input className="adm-input-plain" value={mediaRefValue(draft.thumb, db.media)} onChange={(event) => setField('thumb', event.target.value)} />
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setPickerOpen(true)}>
            <ImageIcon size={14} /> Pilih
          </button>
        </div>
      </Field>
      {draft.thumb && <img className="adm-thumb-preview" src={resolveMediaRef(draft.thumb, db.media)} alt="Preview thumbnail" />}
      <Field label="Nama template">
        <input
          className="adm-input-plain"
          value={draft.templateName}
          onChange={(event) => setField('templateName', event.target.value)}
          placeholder="Opsional"
        />
      </Field>
      <Field label="Harga (Rp)">
        <input
          className="adm-input-plain"
          type="number"
          inputMode="numeric"
          value={draft.price}
          onChange={(event) => setField('price', event.target.value)}
          placeholder="Mis. 199000"
        />
      </Field>
      <Field label="Harga coret (Rp)">
        <input
          className="adm-input-plain"
          type="number"
          inputMode="numeric"
          value={draft.priceCompare}
          onChange={(event) => setField('priceCompare', event.target.value)}
          placeholder="Mis. 398000"
        />
      </Field>
      <Field label="Deskripsi singkat">
        <textarea
          className="adm-textarea"
          rows={3}
          value={draft.description}
          onChange={(event) => setField('description', event.target.value)}
        />
      </Field>

      <MediaPicker
        open={pickerOpen}
        selected={draft.thumb}
        title="Pilih thumbnail halaman"
        description="Thumbnail dipakai pada kartu template dan daftar halaman."
        onClose={() => setPickerOpen(false)}
        onSelect={(url, picked) => setField('thumb', picked ? toMediaRef(picked.id) : url)}
      />
    </div>
  );
}
