import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDatabase } from '../services/store';
import { assetUrl } from '../utils/assetUrl';
import { resolveMediaRef } from '../utils/mediaRef';
import { TemplateCard } from '../components/site/TemplateCard';

export function CatalogPage() {
  const db = useDatabase();
  const { category } = useParams();
  const activeCategory = db.categories.find((item) => item.slug === category);
  const templates = useMemo(() => {
    const list = db.pages.filter((item) => item.kind === 'template' && item.status === 'published');
    return list.filter((item) => (activeCategory ? item.category === activeCategory.id : true)).sort((a, b) => a.order - b.order);
  }, [db.pages, activeCategory]);
  const publishedTemplateCount = db.pages.filter((item) => item.kind === 'template' && item.status === 'published').length;
  const activeCategoryCount = activeCategory
    ? templates.filter((item) => item.category === activeCategory.id).length
    : 0;

  return (
    <div className="catalog">
      {activeCategory ? (
        <section className="catalog-hero catalog-hero--category" style={{ backgroundImage: `url('${resolveMediaRef(activeCategory.cover, db.media)}')` }}>
          <div className="catalog-hero__veil" />
          <div className="site-container catalog-hero__inner">
            <p className="site-eyebrow">bydreamy · {activeCategory.name} Series</p>
            <h1>{activeCategory.tagline}</h1>
            <p className="catalog-hero__copy">{activeCategory.description}</p>
            <div className="catalog-hero__meta">
              <span>{activeCategoryCount} desain</span>
              <span>Preview langsung</span>
              <span>Dapat dikelola dari dashboard</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="catalog-hero">
          <div className="site-container catalog-hero__inner catalog-hero__inner--split">
            <div>
              <p className="site-eyebrow">bydreamy Catalogue · 25 Desain</p>
              <h1>
                Choose Your <em>Design</em>
              </h1>
              <p className="catalog-hero__copy">
                Dari warisan klasik hingga komposisi sinematik, setiap desain dibuat orisinal dan disesuaikan dengan
                cerita pasangan Indonesia. Temukan yang paling terasa seperti kalian.
              </p>
            </div>
            <img src={assetUrl('/wp-content/uploads/2026/02/AMEERA-SLIDE-2.webp')} alt="Preview undangan bydreamy" />
          </div>
        </section>
      )}

      <section className="catalog-body">
        <div className="site-container">
          <div className="catalog-toolbar">
            <div className="catalog-filters">
              <Link to="/katalog" className={!activeCategory ? 'is-active' : undefined}>
                Semua <span>{publishedTemplateCount}</span>
              </Link>
              {db.categories.map((item) => (
                <Link key={item.id} to={`/katalog/${item.slug}`} className={activeCategory?.id === item.id ? 'is-active' : undefined}>
                    {item.name} <span>{db.pages.filter((page) => page.kind === 'template' && page.status === 'published' && page.category === item.id).length}</span>
                </Link>
              ))}
            </div>
            <p className="catalog-count">{templates.length} template</p>
          </div>

          <div className="template-grid">
            {templates.map((template, index) => (
              <TemplateCard key={template.id} template={template} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="catalog-cta">
        <div className="site-container catalog-cta__inner">
          <p className="site-eyebrow">Butuh bantuan memilih?</p>
          <h2>Konsultasikan tema pernikahanmu bersama bydreamy.</h2>
          <p>Tim kami membantu memilih desain, menyiapkan konten, dan mengatur undangan sampai siap dibagikan.</p>
          <a
            className="site-btn site-btn--gold"
            href={`https://api.whatsapp.com/send?phone=${db.settings.whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            Chat via WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
