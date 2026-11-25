import type { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Save, Sparkles } from 'lucide-react';
import type { CategoryRecord, PageRecord } from '../../../data/types';
import { useDatabase } from '../../../services/store';
import { Field } from '../../ui';
import { WebsitePagesSection } from './WebsitePagesSection';
import type { HomepageDraft } from './types';
import { resolveMediaRef } from '../../../utils/mediaRef';
import { assetUrl } from '../../../utils/assetUrl';

interface HomepageTabProps {
  homePage?: PageRecord;
  templates: PageRecord[];
  categories: CategoryRecord[];
  draft: HomepageDraft;
  setDraft: Dispatch<SetStateAction<HomepageDraft>>;
  onSave: () => void;
}

export function HomepageTab({ homePage, templates, categories, draft, setDraft, onSave }: HomepageTabProps) {
  const db = useDatabase();
  return (
    <>
      <div className="adm-grid adm-grid--settings">
        <section className="adm-panel">
        <h2 className="adm-panel__title">Homepage website</h2>
        <p className="adm-panel__desc">Halaman utama memakai desain asli bydreamy (Elementor canvas).</p>
        {homePage ? (
          <>
            <div className="adm-homepage">
              <img src={resolveMediaRef(homePage.thumb, db.media) || assetUrl('/wp-content/uploads/2026/02/AMEERA-SLIDE-2.webp')} alt="Homepage" />
              <div>
                <strong>{homePage.label}</strong>
                <code>{homePage.route}</code>
                <p>{homePage.description.slice(0, 160) || 'Landing page bydreamy.'}</p>
                <Link to={`/admin/homepage/${homePage.id}`} className="adm-link">
                  Edit konten homepage <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
            <div className="adm-form-grid" style={{ marginTop: 20 }}>
              <Field label="Title tag homepage" full>
                <input className="adm-input-plain" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </Field>
              <Field label="Meta description" full>
                <textarea
                  className="adm-textarea"
                  rows={3}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </Field>
              <Field label="Status homepage">
                <select
                  className="adm-select"
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value as PageRecord['status'] })}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </Field>
            </div>
            <button type="button" className="adm-btn adm-btn--dark" onClick={onSave}>
              <Save size={15} /> Simpan Homepage
            </button>
          </>
        ) : (
          <p className="adm-muted">Belum ada halaman dengan route “/”.</p>
        )}
      </section>

      <section className="adm-panel">
        <h2 className="adm-panel__title">Sorotan homepage</h2>
        <p className="adm-panel__desc">Template unggulan yang tampil di katalog rekomendasi.</p>
        <ul className="adm-highlight-list">
          {templates.slice(0, 5).map((page) => (
            <li key={page.id}>
              <img src={resolveMediaRef(page.thumb, db.media)} alt="" />
              <div>
                <strong>{page.templateName}</strong>
                <small>{categories.find((category) => category.id === page.category)?.name}</small>
              </div>
              <Link to={`/admin/pages/${page.id}`}><ArrowUpRight size={14} /></Link>
            </li>
          ))}
        </ul>
        <div className="adm-note">
          <Sparkles size={14} /> Homepage asli memiliki slider hero, section fitur, dan CTA yang dikelola langsung
          melalui editor halaman.
        </div>
      </section>
      </div>
      <WebsitePagesSection />
    </>
  );
}
