import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Copy, Eye, FilePenLine, LayoutTemplate } from 'lucide-react';
import type { PageRecord } from '../../../data/types';
import { duplicatePage, updatePage, useDatabase } from '../../../services/store';
import { StatusPill } from '../../ui';
import { resolveMediaRef } from '../../../utils/mediaRef';

export function TemplateGrid({ templates }: { templates: PageRecord[] }) {
  const db = useDatabase();
  const navigate = useNavigate();

  return (
    <div className="adm-template-grid">
      {templates.map((template) => {
        const cat = db.categories.find((item) => item.id === template.category);
        return (
          <article key={template.id} className="adm-template">
            <div className="adm-template__media">
              {template.thumb ? (
                <img src={resolveMediaRef(template.thumb, db.media)} alt={template.label} />
              ) : (
                <span className="adm-row-title__icon">
                  <LayoutTemplate size={26} />
                </span>
              )}
              <span className="adm-template__cat" style={{ background: cat?.accent }}>
                {cat?.name || 'Template'}
              </span>
              <StatusPill status={template.status} />
              <div className="adm-template__hover">
                <Link to={template.route} target="_blank">
                  <Eye size={15} /> Demo
                </Link>
                <Link to={`/admin/pages/${template.id}`}>
                  <FilePenLine size={15} /> Edit
                </Link>
              </div>
            </div>
            <div className="adm-template__body">
              <div>
                <h3>{template.templateName || template.label}</h3>
                <code>{template.route}</code>
              </div>
              <div className="adm-template__actions">
                <button
                  type="button"
                  title={template.status === 'published' ? 'Jadikan draft' : 'Publish'}
                  onClick={() =>
                    updatePage(template.id, { status: template.status === 'published' ? 'draft' : 'published' })
                  }
                >
                  {template.status === 'published' ? <Eye size={15} /> : <ArrowUpRight size={15} />}
                </button>
                <button
                  type="button"
                  title="Salin template"
                  aria-label={`Salin template ${template.label}`}
                  onClick={() => {
                    const copy = duplicatePage(template.id);
                    if (copy) navigate(`/admin/pages/${copy.id}`);
                  }}
                >
                  <Copy size={15} />
                </button>
                <Link to={`/admin/pages/${template.id}`} title="Edit">
                  <FilePenLine size={15} />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
