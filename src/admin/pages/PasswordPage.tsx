import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { changePassword } from '../auth';
import { Field, PageHeader } from '../ui';

function PasswordField({
  label,
  value,
  onChange,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint} full>
      <div className="adm-input__shell">
        <Lock size={16} />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          required
        />
        <button
          type="button"
          className="adm-input__eye"
          onClick={() => setShow((value) => !value)}
          aria-label={show ? 'Sembunyikan password' : 'Lihat password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

export function PasswordPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setDone(false);

    if (next.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }
    if (next !== confirm) {
      setError('Konfirmasi password tidak sama.');
      return;
    }
    if (next === current) {
      setError('Password baru harus berbeda dari password saat ini.');
      return;
    }

    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);
    if (result.ok) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(true);
    } else {
      setError(result.error || 'Gagal mengganti password.');
    }
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Sistem"
        title="Ganti Password"
        description="Perbarui password akun administrator yang sedang login."
      />

      <form className="adm-panel adm-panel--narrow" onSubmit={submit}>
        <div>
          <h2 className="adm-panel__title">Password Akun</h2>
          <p className="adm-panel__desc">Login dashboard memakai Supabase Auth. Gunakan password baru pada login berikutnya.</p>
        </div>

        {error && (
          <div className="adm-alert adm-alert--error" role="alert">
            {error}
          </div>
        )}
        {done && (
          <div className="adm-alert adm-alert--success" role="status">
            Password berhasil diganti.
          </div>
        )}

        <div className="adm-form-grid">
          <PasswordField
            label="Password saat ini"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />
          <PasswordField
            label="Password baru"
            value={next}
            onChange={setNext}
            hint="Minimal 8 karakter."
            autoComplete="new-password"
          />
          <PasswordField
            label="Konfirmasi password baru"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />
        </div>

        <p className="adm-note">
          Setelah password diganti, sesi yang sedang aktif tetap berjalan. Gunakan password baru saat login berikutnya.
        </p>

        <button type="submit" className="adm-btn adm-btn--dark" disabled={busy}>
          <KeyRound size={15} /> {busy ? 'Menyimpan…' : 'Simpan Password'}
        </button>
      </form>
    </div>
  );
}
