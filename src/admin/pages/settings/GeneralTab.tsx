import type { SettingsRecord } from '../../../data/types';
import { useDatabase } from '../../../services/store';
import { Field } from '../../ui';
import { mediaRefValue, resolveMediaRef } from '../../../utils/mediaRef';

interface GeneralTabProps {
  form: SettingsRecord;
  set: <K extends keyof SettingsRecord>(key: K, value: SettingsRecord[K]) => void;
}

export function GeneralTab({ form, set }: GeneralTabProps) {
  const db = useDatabase();
  return (
    <div className="adm-grid adm-grid--settings">
      <section className="adm-panel">
        <h2 className="adm-panel__title">Identitas</h2>
        <p className="adm-panel__desc">Tampil pada header, footer, dan metadata website.</p>
        <div className="adm-form-grid">
          <Field label="Nama website">
            <input className="adm-input-plain" value={form.siteName} onChange={(event) => set('siteName', event.target.value)} />
          </Field>
          <Field label="Tagline">
            <input className="adm-input-plain" value={form.tagline} onChange={(event) => set('tagline', event.target.value)} />
          </Field>
          <Field label="Deskripsi singkat" full hint="Dipakai pada footer dan meta description default.">
            <textarea className="adm-textarea" rows={3} value={form.description} onChange={(event) => set('description', event.target.value)} />
          </Field>
          <Field label="Logo URL" full>
            <input className="adm-input-plain" value={mediaRefValue(form.logo, db.media)} onChange={(event) => set('logo', event.target.value)} />
          </Field>
          <Field label="Teks footer">
            <input className="adm-input-plain" value={form.footerText} onChange={(event) => set('footerText', event.target.value)} />
          </Field>
        </div>
        {form.logo && <img className="adm-logo-preview" src={resolveMediaRef(form.logo, db.media)} alt="Logo website" />}
      </section>

      <section className="adm-panel">
        <h2 className="adm-panel__title">Warna brand</h2>
        <p className="adm-panel__desc">Dipakai oleh komponen React (katalog, detail, admin).</p>
        <div className="adm-form-grid">
          <Field label="Warna utama">
            <div className="adm-color">
              <input type="color" value={form.primaryColor} onChange={(event) => set('primaryColor', event.target.value)} />
              <input className="adm-input-plain" value={form.primaryColor} onChange={(event) => set('primaryColor', event.target.value)} />
            </div>
          </Field>
          <Field label="Warna aksen">
            <div className="adm-color">
              <input type="color" value={form.accentColor} onChange={(event) => set('accentColor', event.target.value)} />
              <input className="adm-input-plain" value={form.accentColor} onChange={(event) => set('accentColor', event.target.value)} />
            </div>
          </Field>
        </div>
        <div className="adm-swatches">
          <span style={{ background: form.primaryColor }} />
          <span style={{ background: form.accentColor }} />
          <span style={{ background: '#fffbf6' }} />
          <span style={{ background: '#562231' }} />
        </div>
      </section>
    </div>
  );
}
