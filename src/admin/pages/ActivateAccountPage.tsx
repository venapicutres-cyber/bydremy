import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { supabase } from '../../services/supabase';

export function ActivateAccountPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) return setError('Password minimal 8 karakter.');
    if (password !== confirmPassword) return setError('Konfirmasi password belum sama.');
    if (!supabase) return setError('Akun belum dapat diaktifkan saat ini.');
    setBusy(true); setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError(updateError.message);
    setComplete(true);
  };

  if (complete) return <div className="adm-login"><main className="adm-login__panel"><div className="adm-login__form"><CheckCircle2 size={40} /><h2>Akun siap digunakan</h2><p className="adm-login__lead">Password tersimpan. Masuk untuk mulai mengedit undanganmu.</p><Link className="adm-btn adm-btn--dark adm-btn--block" to="/admin">Buka Editor Undangan</Link></div></main></div>;
  return <div className="adm-login"><main className="adm-login__panel"><form className="adm-login__form" onSubmit={submit}><p className="adm-eyebrow">Aktivasi akun</p><h2>Buat password akunmu</h2><p className="adm-login__lead">Password ini dipakai untuk masuk dan mengelola undangan pribadi.</p>{error && <div className="adm-alert adm-alert--error" role="alert">{error}</div>}<label className="adm-input"><span>Password baru</span><div className="adm-input__shell"><LockKeyhole size={16} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></div></label><label className="adm-input"><span>Ulangi password</span><div className="adm-input__shell"><LockKeyhole size={16} /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></div></label><button type="submit" className="adm-btn adm-btn--dark adm-btn--block" disabled={busy}>{busy ? 'Menyimpan…' : 'Aktifkan Akun'}</button></form></main></div>;
}
