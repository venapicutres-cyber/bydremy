import { Link } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';
import { useDatabase } from '../../services/store';

export function SiteFooter() {
  const db = useDatabase();

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link to="/" className="site-wordmark site-wordmark--light">
              bydreamy
            </Link>
            <p>{db.settings.description}</p>
            <div className="site-footer__social">
              <a href={db.settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram size={17} />
              </a>
              <a
                href={`https://api.whatsapp.com/send?phone=${db.settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle size={17} />
              </a>
            </div>
          </div>
          {db.footer.map((column) => (
            <div key={column.id} className="site-footer__col">
              <h4>{column.title}</h4>
              {column.links.map((link) => (
                <Link key={link.label} to={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="site-footer__col site-footer__contact">
            <h4>Kontak</h4>
            <p>{db.settings.email}</p>
            <p>{db.settings.address}</p>
            <a href={`https://api.whatsapp.com/send?phone=${db.settings.whatsapp}`} target="_blank" rel="noreferrer">
              +{db.settings.whatsapp}
            </a>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>{db.settings.footerText}</span>
          <Link to="/admin">Admin Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
