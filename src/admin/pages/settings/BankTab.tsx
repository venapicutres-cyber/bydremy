import type { SettingsRecord } from '../../../data/types';
import { Field } from '../../ui';

interface BankTabProps {
  form: SettingsRecord;
  set: <K extends keyof SettingsRecord>(key: K, value: SettingsRecord[K]) => void;
}

export function BankTab({ form, set }: BankTabProps) {
  return (
    <div className="adm-grid adm-grid--settings">
      <section className="adm-panel">
        <h2 className="adm-panel__title">Rekening Transfer</h2>
        <p className="adm-panel__desc">
          Tampil di halaman checkout. Pelanggan transfer ke rekening ini lalu mengunggah bukti; akun baru aktif
          setelah admin memeriksa dan menekan Aktifkan.
        </p>
        <div className="adm-form-grid">
          <Field label="Nama Bank" hint="Contoh: BCA, Mandiri, BNI.">
            <input className="adm-input-plain" value={form.bankName} onChange={(event) => set('bankName', event.target.value)} />
          </Field>
          <Field label="Nomor Rekening" hint="Isi tanpa spasi, contoh 1234567890.">
            <input
              className="adm-input-plain"
              inputMode="numeric"
              autoCorrect="off"
              spellCheck={false}
              value={form.bankAccountNumber}
              onChange={(event) => set('bankAccountNumber', event.target.value)}
            />
          </Field>
          <Field label="Atas Nama" full>
            <input
              className="adm-input-plain"
              value={form.bankAccountHolder}
              onChange={(event) => set('bankAccountHolder', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="adm-panel">
        <h2 className="adm-panel__title">Pratinjau rekening</h2>
        <div className="adm-contact-preview">
          <strong>{form.bankName || 'Nama bank'}</strong>
          <p>{form.bankAccountNumber || '0000000000'}</p>
          <p>a.n. {form.bankAccountHolder || 'Nama pemilik rekening'}</p>
        </div>
      </section>
    </div>
  );
}
