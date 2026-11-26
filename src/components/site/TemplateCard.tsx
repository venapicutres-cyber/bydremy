import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useDatabase } from '../../services/store';
import type { PageRecord } from '../../data/types';
import { rupiah } from '../../utils/format';
import { resolveMediaRef } from '../../utils/mediaRef';

export function TemplateCard({ template, index = 0 }: { template: PageRecord; index?: number }) {
  const db = useDatabase();
  const category = db.categories.find((item) => item.id === template.category);

  return (
    <article className="template-card" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <Link to={`/template/${template.slug}`} className="template-card__media">
        <img src={resolveMediaRef(template.thumb, db.media)} alt={`Template undangan ${template.label}`} loading="lazy" />
        <span className="template-card__badge">{category?.name || 'Template'}</span>
        <span className="template-card__hover">
          Lihat Template <ArrowUpRight size={16} />
        </span>
        {template.status === 'draft' && <span className="template-card__draft">Draft</span>}
      </Link>
      <div className="template-card__meta">
        <div>
          <h3>{template.templateName || template.label}</h3>
          <p>{category?.tagline}</p>
          <p className="template-card__price">
            {template.price && template.price > 0 ? (
              <>
                {template.priceCompare && template.priceCompare > template.price && <s>{rupiah(template.priceCompare)}</s>}
                <strong>{rupiah(template.price)}</strong>
              </>
            ) : (
              <span>Harga belum diisi</span>
            )}
          </p>
        </div>
        <Link to={`/template/${template.slug}`} className="template-card__arrow" aria-label={`Lihat ${template.label}`}>
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </article>
  );
}
