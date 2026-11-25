import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useDatabase } from '../../services/store';

export function SiteHeader() {
  const db = useDatabase();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const nav = db.navigation.filter((item) => item.visible);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      {db.settings.announcementEnabled && db.settings.announcement && (
        <div className="site-announcement">{db.settings.announcement}</div>
      )}
      <header className="site-header">
        <div className="site-container site-header__inner">
          <Link to="/" className="site-wordmark" aria-label="bydreamy home">
            bydreamy
          </Link>
          <nav className={`site-nav ${open ? 'is-open' : ''}`} aria-label="Navigasi utama">
            {nav.map((item) => (
              <NavLink
                key={item.id}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
            <a
              className="site-nav__cta"
              href={`https://api.whatsapp.com/send?phone=${db.settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              Book Now
            </a>
          </nav>
          <button className="site-menu-btn" onClick={() => setOpen((value) => !value)} aria-label="Buka menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
    </>
  );
}
