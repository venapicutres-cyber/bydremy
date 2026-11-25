import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="site-container site-empty">
      <p className="site-eyebrow">404</p>
      <h1>Halaman tidak ditemukan.</h1>
      <p>Mungkin undangan sudah berpindah, atau tautan yang kamu buka salah.</p>
      <div className="site-empty__actions">
        <Link className="site-btn site-btn--dark" to="/">
          Kembali ke Home
        </Link>
        <Link className="site-btn site-btn--ghost" to="/katalog">
          Lihat Katalog
        </Link>
      </div>
    </div>
  );
}
