import { Field } from '../../ui';
import type { PageDraft } from './types';

interface SeoTabProps {
  draft: PageDraft;
  route: string | undefined;
  setField: <K extends keyof PageDraft>(key: K, value: PageDraft[K]) => void;
}

export function SeoTab({ draft, route, setField }: SeoTabProps) {
  return (
    <div className="adm-stack">
      <Field label="Judul halaman (title tag)" hint="Tampil di tab browser dan hasil pencarian.">
        <input
          className="adm-input-plain"
          value={draft.title}
          onChange={(event) => setField('title', event.target.value)}
          placeholder="Judul halaman"
        />
      </Field>
      <Field label="Meta description" hint="Idealnya 120–160 karakter.">
        <textarea
          className="adm-textarea"
          rows={4}
          value={draft.description}
          onChange={(event) => setField('description', event.target.value)}
        />
      </Field>
      <div className="adm-field__hint">{draft.description.length} karakter</div>
      <div className="adm-serp">
        <span>bydreamy.local{route || '/halaman-baru'}</span>
        <strong>{draft.title || draft.label || 'Judul halaman'}</strong>
        <p>{draft.description || 'Deskripsi halaman akan tampil di sini pada hasil pencarian Google.'}</p>
      </div>
    </div>
  );
}
