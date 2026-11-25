import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchLayarSapa, type SapaGuest } from '../services/guestbook';
import { useDatabase } from '../services/store';
import { dateTime } from '../utils/format';
import { isInvitation } from '../utils/invitations';

/**
 * Layar sambutan untuk dipasang di resepsionis. Tidak memakai header/footer
 * website dan tidak membutuhkan login — data yang ditampilkan sudah dibatasi
 * RPC `layar_sapa` (tanpa token QR maupun nomor telepon).
 */
export function LayarSapaPage() {
  const db = useDatabase();
  const [params] = useSearchParams();
  const pageId = Number(params.get('page')) || db.pages.find(isInvitation)?.id || 0;
  const [guests, setGuests] = useState<SapaGuest[]>([]);
  const [index, setIndex] = useState(0);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    document.title = 'Layar Sapa · bydreamy Digital Guestbook';
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void fetchLayarSapa(pageId, 12)
        .then((rows) => {
          if (!active) return;
          setGuests(rows);
          setOffline(false);
        })
        .catch(() => {
          if (active) setOffline(true);
        });
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pageId]);

  useEffect(() => {
    if (guests.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % guests.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [guests.length]);

  const active = guests.length ? guests[index % guests.length] : null;

  return (
    <div className="sapa">
      <header className="sapa__top">
        <span className="sapa__brand">bydreamy</span>
        <span className="sapa__label">Layar Sapa · Digital Guestbook</span>
        <Link className="sapa__back" to="/digital-guestbook">
          Keluar
        </Link>
      </header>

      <main className="sapa__stage">
        {active ? (
          <div key={`${active.name}-${active.checkedInAt}`}>
            <p className="sapa__welcome">Selamat Datang</p>
            <h1 className="sapa__name">{active.name}</h1>
            <p className="sapa__meta">
              {active.identityCategory ? `${active.identityCategory} · ` : ''}
              Check-in {dateTime(active.checkedInAt)}
            </p>
          </div>
        ) : (
          <h1 className="sapa__empty">Menunggu tamu pertama…</h1>
        )}
      </main>

      <footer className="sapa__bottom">
        <div className="sapa__ticker">
          {guests.slice(0, 8).map((guest, position) => (
            <span key={`${guest.name}-${position}`}>{guest.name}</span>
          ))}
        </div>
        <span className="sapa__hint">
          {offline ? 'Data belum tersedia · periksa koneksi' : 'Scan QR di pintu masuk · bydreamy'}
        </span>
      </footer>
    </div>
  );
}
