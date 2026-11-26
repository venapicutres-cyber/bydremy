import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Save, Search, TriangleAlert } from 'lucide-react';
import { decodeHtmlEntities } from '../../utils/html';
import { isInvitation } from '../../utils/invitations';
import { useDatabase, updateSettings } from '../../services/store';
import { PageHeader, StatusPill } from '../ui';

export function SeoPage() {
  const db = useDatabase();
  const [form, setForm] = useState({ seoTitle: db.settings.seoTitle, seoDescription: db.settings.seoDescription, seoKeywords: db.settings.seoKeywords });
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setForm({
      seoTitle: db.settings.seoTitle,
      seoDescription: db.settings.seoDescription,
      seoKeywords: db.settings.seoKeywords,
    });
  }, [db.settings]);

  const save = () => {
    updateSettings(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  // Hanya halaman website: template demo memakai noindex dan undangan punya
  // metadata sendiri, jadi keduanya tidak ditinjau di sini.
  const pages = db.pages
    .filter((page) => page.kind !== 'template' && !isInvitation(page))
    .filter((page) => (query ? `${page.label} ${page.route}`.toLowerCase().includes(query.toLowerCase()) : true))
    .slice(0, 40);

  const titleOk = form.seoTitle.length >= 30 && form.seoTitle.length <= 65;
  const descOk = form.seoDescription.length >= 100 && form.seoDescription.length <= 165;

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Website"
        title="SEO & Metadata"
        description="Atur metadata default website dan tinjau judul setiap halaman."
        actions={
          <>
            {saved && <span className="adm-saved">Tersimpan ✓</span>}
            <button type="button" className="adm-btn adm-btn--dark" onClick={save}>
              <Save size={15} /> Simpan SEO
            </button>
          </>
        }
      />

      <div className="adm-grid adm-grid--seo">
        <section className="adm-panel">
          <h2 className="adm-panel__title">Metadata utama</h2>
          <p className="adm-panel__desc">Dipakai pada halaman React dan sebagai fallback halaman lain.</p>
          <label className="adm-input-block">
            <span>SEO title <em className={titleOk ? 'is-ok' : 'is-warn'}>{form.seoTitle.length}/65</em></span>
            <input value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} />
          </label>
          <label className="adm-input-block">
            <span>Meta description <em className={descOk ? 'is-ok' : 'is-warn'}>{form.seoDescription.length}/165</em></span>
            <textarea rows={4} value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} />
          </label>
          <label className="adm-input-block">
            <span>Keywords</span>
            <input value={form.seoKeywords} onChange={(event) => setForm({ ...form, seoKeywords: event.target.value })} />
          </label>
          <div className="adm-seo-checks">
            <span className={titleOk ? 'is-ok' : 'is-warn'}>
              {titleOk ? <CheckCircle2 size={14} /> : <TriangleAlert size={14} />} Panjang title
            </span>
            <span className={descOk ? 'is-ok' : 'is-warn'}>
              {descOk ? <CheckCircle2 size={14} /> : <TriangleAlert size={14} />} Panjang description
            </span>
            <span className={form.seoKeywords ? 'is-ok' : 'is-warn'}>
              {form.seoKeywords ? <CheckCircle2 size={14} /> : <TriangleAlert size={14} />} Keywords terisi
            </span>
          </div>
        </section>

        <section className="adm-panel">
          <h2 className="adm-panel__title">Pratinjau Google</h2>
          <p className="adm-panel__desc">Perkiraan tampilan hasil pencarian.</p>
          <div className="adm-serp adm-serp--large">
            <span>https://bydreamy.local</span>
            <strong>{form.seoTitle || 'Judul website'}</strong>
            <p>{form.seoDescription || 'Deskripsi website akan tampil di sini.'}</p>
          </div>
          <div className="adm-note">
            Halaman demo template memakai <code>noindex</code> pada situs asli. Untuk versi rebuild, metadata per
            halaman dapat diubah dari editor masing-masing.
          </div>
        </section>
      </div>

      <section className="adm-panel">
        <header className="adm-panel__head">
          <div>
            <h2 className="adm-panel__title">Metadata halaman</h2>
            <p className="adm-panel__desc">Tinjau title dan description setiap halaman website.</p>
          </div>
          <div className="adm-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari halaman…" />
          </div>
        </header>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Halaman</th>
                <th>Title tag</th>
                <th>Description</th>
                <th>Status</th>
                <th className="is-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <strong>{page.label}</strong>
                    <small><code>{page.route}</code></small>
                  </td>
                  <td className="adm-muted">{decodeHtmlEntities(page.title).slice(0, 62)}{page.title.length > 62 ? '…' : ''}</td>
                  <td className="adm-muted">{page.description ? `${page.description.slice(0, 90)}…` : '—'}</td>
                  <td><StatusPill status={page.status} /></td>
                  <td className="is-right">
                    <Link to={`/admin/homepage/${page.id}`} className="adm-icon-btn" title="Edit metadata">
                      <ArrowUpRight size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
