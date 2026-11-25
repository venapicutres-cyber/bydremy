import { Check } from 'lucide-react';
import type { SettingsRecord } from '../../../data/types';
import { Field, Toggle } from '../../ui';

interface AnnouncementTabProps {
  form: SettingsRecord;
  set: <K extends keyof SettingsRecord>(key: K, value: SettingsRecord[K]) => void;
}

export function AnnouncementTab({ form, set }: AnnouncementTabProps) {
  return (
    <section className="adm-panel adm-panel--narrow">
      <h2 className="adm-panel__title">Pengumuman situs</h2>
      <p className="adm-panel__desc">Bar promo tipis di atas header halaman React.</p>
      <Toggle
        checked={form.announcementEnabled}
        label={form.announcementEnabled ? 'Pengumuman aktif' : 'Pengumuman nonaktif'}
        onChange={(value) => set('announcementEnabled', value)}
      />
      <Field label="Isi pengumuman" full>
        <input className="adm-input-plain" value={form.announcement} onChange={(event) => set('announcement', event.target.value)} />
      </Field>
      {form.announcementEnabled && form.announcement && (
        <div className="adm-announcement-preview">{form.announcement}</div>
      )}
      <div className="adm-inline" style={{ marginTop: 16 }}>
        <Check size={14} />
        <span className="adm-muted">Perubahan tampil setelah pengaturan disimpan.</span>
      </div>
    </section>
  );
}
