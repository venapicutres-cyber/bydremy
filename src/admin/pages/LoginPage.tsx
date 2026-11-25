import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { login, type AdminSession } from '../auth';
import { assetUrl } from '../../utils/assetUrl';

export function LoginPage({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (result.ok && result.session) onLogin(result.session);
    else setError(result.error || 'Tidak bisa masuk.');
  };

  return (
    <div className="adm-login">
      <aside className="adm-login__art">
        <Link to="/" className="adm-wordmark adm-wordmark--light">
          bydreamy
        </Link>
        <div className="adm-login__art-copy">
          <p className="adm-eyebrow">Content Studio</p>
          <h1>
            Kelola seluruh undangan dari <em>satu tempat.</em>
          </h1>
          <p>
            Dashboard resmi bydreamy untuk mengatur halaman, 25 demo template, katalog, pesanan, dan seluruh
            konten website secara langsung.
          </p>
          <ul>
            <li>
              <Sparkles size={15} /> Edit konten & section tanpa menyentuh kode
            </li>
            <li>
              <ShieldCheck size={15} /> Preview sebelum publish, kapan saja
            </li>
          </ul>
        </div>
        <figure className="adm-login__art-photo">
          <img src={assetUrl('/wp-content/uploads/2026/02/AMEERA-SLIDE-2.webp')} alt="bydreamy" />
          <figcaption>Heritage Series · Ameera</figcaption>
        </figure>
      </aside>

      <main className="adm-login__panel">
        <form className="adm-login__form" onSubmit={submit}>
          <p className="adm-eyebrow">Selamat datang kembali</p>
          <h2>Masuk ke Dashboard</h2>
          <p className="adm-login__lead">Gunakan akun administrator untuk mengelola website bydreamy.</p>

          {error && (
            <div className="adm-alert adm-alert--error" role="alert">
              {error}
            </div>
          )}

          <label className="adm-input">
            <span>Email</span>
            <div className="adm-input__shell">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@bydreamy.local"
                required
              />
            </div>
          </label>

          <label className="adm-input">
            <span>Password</span>
            <div className="adm-input__shell">
              <Lock size={16} />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
              <button type="button" className="adm-input__eye" onClick={() => setShow((value) => !value)} aria-label="Lihat password">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="adm-login__row">
            <span className="adm-login__hint">Lupa password? Hubungi developer.</span>
          </div>

          <button type="submit" className="adm-btn adm-btn--dark adm-btn--block" disabled={busy}>
            {busy ? 'Memeriksa…' : 'Masuk Dashboard'} <ArrowRight size={16} />
          </button>

          <Link to="/" className="adm-login__back">
            ← Kembali ke website
          </Link>
        </form>
      </main>
    </div>
  );
}
