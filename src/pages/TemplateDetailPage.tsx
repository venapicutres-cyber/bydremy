import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, ExternalLink, Monitor, Smartphone } from 'lucide-react';
import { useDatabase } from '../services/store';
import { rupiah } from '../utils/format';
import { resolveMediaRef } from '../utils/mediaRef';
import { TemplateCard } from '../components/site/TemplateCard';

export function TemplateDetailPage() {
  const db = useDatabase();
  const { slug } = useParams();
  const template = db.pages.find((item) => item.kind === 'template' && item.status === 'published' && item.slug === slug);
  const category = db.categories.find((item) => item.id === template?.category);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const related = db.pages
    .filter((item) => item.kind === 'template' && item.status === 'published' && item.category === template?.category && item.id !== template?.id)
    .slice(0, 3);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!template) {
    return (
      <div className="site-container site-empty">
        <p className="site-eyebrow">Template</p>
        <h1>Template tidak ditemukan</h1>
        <Link className="site-btn" to="/katalog">
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  const features = [
    'Cover pembuka & musik undangan',
    'Countdown acara & save the date',
    'RSVP, konfirmasi kehadiran & ucapan',
    'Galeri foto pre-wedding',
    'Lokasi acara & petunjuk arah',
    'Amplop digital & QR check-in',
  ];

  return (
    <div className="template-detail">
      <div className="site-container">
        <div className="template-detail__crumbs">
          <Link to="/katalog">
            <ArrowLeft size={15} /> Katalog
          </Link>
          <span>/</span>
          <Link to={`/katalog/${category?.slug}`}>{category?.name}</Link>
          <span>/</span>
          <span>{template.templateName}</span>
        </div>

        <div className="template-detail__intro">
          <div className="template-detail__copy">
            <p className="site-eyebrow">{category?.name} Series · {category?.tagline}</p>
            <h1>
              {template.templateName}
              <span>Undangan Pernikahan Digital</span>
            </h1>
            <p>{template.description || category?.description}</p>
            <div className="template-detail__price">
              {template.price && template.price > 0 ? (
                <>
                  {template.priceCompare && template.priceCompare > template.price && <s>{rupiah(template.priceCompare)}</s>}
                  <strong>{rupiah(template.price)}</strong>
                  <span>sudah termasuk editor undangan</span>
                </>
              ) : (
                <strong>Harga belum diisi</strong>
              )}
            </div>
            <div className="template-detail__actions">
              {template.status === 'published' ? (
                <Link className="site-btn site-btn--dark" to={template.route}>
                  Buka Demo <ExternalLink size={15} />
                </Link>
              ) : (
                <span className="site-btn site-btn--dark is-disabled" aria-disabled="true">
                  Draft — belum dipublikasikan
                </span>
              )}
              <Link className="site-btn site-btn--ghost" to={`/checkout/${template.slug}`}>
                Pilih Template Ini
              </Link>
            </div>
            <dl className="template-detail__facts">
              <div>
                <dt>Kategori</dt>
                <dd>{category?.name}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{template.status === 'published' ? 'Siap dipakai' : 'Draft'}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>Mobile first</dd>
              </div>
            </dl>
          </div>
          <div className="template-detail__cover">
            <img src={resolveMediaRef(template.thumb, db.media)} alt={template.templateName || template.label} />
            <div className="template-detail__cover-tag">{category?.name}</div>
          </div>
        </div>
      </div>

      <section className="template-preview">
        <div className="site-container">
          <div className="template-preview__head">
            <div>
              <p className="site-eyebrow">Live Preview</p>
              <h2>Rasakan undangan sesungguhnya.</h2>
            </div>
            <div className="template-preview__controls">
              <button className={device === 'desktop' ? 'is-active' : undefined} onClick={() => setDevice('desktop')}>
                <Monitor size={16} /> Desktop
              </button>
              <button className={device === 'mobile' ? 'is-active' : undefined} onClick={() => setDevice('mobile')}>
                <Smartphone size={16} /> Mobile
              </button>
            </div>
          </div>
          <div className={`template-frame template-frame--${device}`}>
            <div className="template-frame__chrome">
              <span />
              <span />
              <span />
              <em>{`bydreamy.local${template.route}`}</em>
            </div>
            {!previewLoaded ? (
              <button className="template-frame__placeholder" onClick={() => setPreviewLoaded(true)}>
                <img src={resolveMediaRef(template.thumb, db.media)} alt="" />
                <span>
                  Muat live preview <ArrowUpRight size={16} />
                </span>
              </button>
            ) : (
              <iframe title={`Preview ${template.templateName}`} src={template.route} loading="lazy" />
            )}
          </div>
        </div>
      </section>

      <section className="template-features">
        <div className="site-container template-features__grid">
          <div>
            <p className="site-eyebrow">Fitur Undangan</p>
            <h2>Semua yang kamu butuhkan, dalam satu genggaman.</h2>
            <p>
              Setiap template bydreamy membawa fitur inti yang sama. Desain, tipografi, ornamen, dan animasinya
              tetap khas masing-masing seri.
            </p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}>
                <Check size={15} /> {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="template-related">
          <div className="site-container">
            <div className="template-related__head">
              <div>
                <p className="site-eyebrow">Masih di seri {category?.name}</p>
                <h2>Desain lain yang mungkin kamu suka.</h2>
              </div>
              <Link to={`/katalog/${category?.slug}`} className="site-link">
                Lihat semua <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="template-grid template-grid--three">
              {related.map((item, index) => (
                <TemplateCard key={item.id} template={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
