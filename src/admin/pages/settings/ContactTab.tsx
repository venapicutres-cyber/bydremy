import { ArrowUpRight } from 'lucide-react';
import type { SettingsRecord } from '../../../data/types';
import { Field } from '../../ui';

interface ContactTabProps {
  form: SettingsRecord;
  set: <K extends keyof SettingsRecord>(key: K, value: SettingsRecord[K]) => void;
}

export function ContactTab({ form, set }: ContactTabProps) {
  return (
    <div className="adm-grid adm-grid--settings">
      <section className="adm-panel">
        <h2 className="adm-panel__title">Kontak</h2>
        <p className="adm-panel__desc">Digunakan pada tombol WhatsApp, footer, dan halaman kontak.</p>
        <div className="adm-form-grid">
          <Field label="Nomor WhatsApp" hint="Format internasional tanpa tanda +, contoh 62895406181407.">
            <input className="adm-input-plain" value={form.whatsapp} onChange={(event) => set('whatsapp', event.target.value)} />
          </Field>
          <Field label="Email">
            <input className="adm-input-plain" value={form.email} onChange={(event) => set('email', event.target.value)} />
          </Field>
          <Field label="Instagram URL" full>
            <input className="adm-input-plain" value={form.instagram} onChange={(event) => set('instagram', event.target.value)} />
          </Field>
          <Field label="Alamat" full>
            <input className="adm-input-plain" value={form.address} onChange={(event) => set('address', event.target.value)} />
          </Field>
        </div>
        <div className="adm-inline" style={{ marginTop: 16 }}>
          <a
            className="adm-btn adm-btn--ghost adm-btn--sm"
            href={`https://api.whatsapp.com/send?phone=${form.whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            Tes tautan WhatsApp <ArrowUpRight size={14} />
          </a>
          <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`mailto:${form.email}`}>
            Tes email <ArrowUpRight size={14} />
          </a>
        </div>
      </section>

      <section className="adm-panel">
        <h2 className="adm-panel__title">Pratinjau kontak</h2>
        <div className="adm-contact-preview">
          <strong>{form.siteName}</strong>
          <p>{form.address}</p>
          <p>{form.email}</p>
          <p>+{form.whatsapp}</p>
          <a href={form.instagram} target="_blank" rel="noreferrer">
            Instagram <ArrowUpRight size={13} />
          </a>
        </div>
      </section>
    </div>
  );
}
