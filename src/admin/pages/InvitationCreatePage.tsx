import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutTemplate, Plus, Search } from 'lucide-react';
import type { PageRecord } from '../../data/types';
import { createPage, useDatabase } from '../../services/store';
import { slugify } from '../../utils/format';
import { INVITATION_PREFIX, invitationRoute } from '../../utils/invitations';
import { resolveMediaRef } from '../../utils/mediaRef';
import { Card, Field, StatusPill, Toolbar } from '../ui';

export function InvitationCreatePage() {
  const db = useDatabase();
  const navigate = useNavigate();
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<PageRecord['status']>('draft');
  const [query, setQuery] = useState('');

  const templates = useMemo(() => {
    const list = db.pages.filter((page) => page.kind === 'template');
    const filtered = query
      ? list.filter((page) =>
          `${page.label} ${page.templateName || ''} ${page.category || ''}`.toLowerCase().includes(query.toLowerCase()),
        )
      : list;
    return filtered.sort((a, b) => a.order - b.order);
  }, [db.pages, query]);

  const template = db.pages.find((page) => page.id === templateId);

  /** Slug undangan harus unik karena dipakai langsung sebagai route publik. */
  const uniqueSlug = (base: string) => {
    const taken = new Set(db.pages.map((page) => page.slug));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n += 1;
    return `${base}-${n}`;
  };

  const create = () => {
    if (!template) {
      window.alert('Pilih template undangan dulu.');
      return;
    }
    const name = label.trim();
    if (!name) {
      window.alert('Nama acara wajib diisi.');
      return;
    }
    const finalSlug = uniqueSlug(slugify(slug || name) || `undangan-${Date.now()}`);
    const created = createPage({
      label: name,
      title: name,
      slug: finalSlug,
      route: invitationRoute(finalSlug),
      description: '',
      category: null,
      templateName: template.templateName || template.label,
      thumb: template.thumb,
      file: template.file,
      css: template.css,
      status,
      kind: 'page',
      order: 99,
      // Kosong supaya undangan memakai HTML template lewat `file`, bukan halaman kosong.
      contentHtml: '',
    });
    navigate(`/admin/invitations/${created.id}`);
  };

  return (
    <div className="adm-page">
      <div className="adm-editor-head">
        <Link to="/admin/invitations" className="adm-back">
          <ArrowLeft size={15} /> Undangan
        </Link>
        <div>
          <p className="adm-eyebrow">Undangan Baru</p>
          <h1>Pilih template, lalu isi data acara</h1>
        </div>
        <div className="adm-editor-head__actions">
          <button type="button" className="adm-btn adm-btn--dark" onClick={create}>
            <Plus size={15} /> Buat Undangan
          </button>
        </div>
      </div>

      <div className="adm-stack">
        <Card title="1. Data acara" subtitle="Nama acara dipakai di daftar pengelola, slug jadi tautan undangan.">
          <div className="adm-form-grid">
            <Field label="Nama acara" hint="Contoh: Bagas & Naila">
              <input
                className="adm-input-plain"
                value={label}
                placeholder="Bagas & Naila"
                onChange={(event) => setLabel(event.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                className="adm-select"
                value={status}
                onChange={(event) => setStatus(event.target.value as PageRecord['status'])}
              >
                <option value="draft">Draf</option>
                <option value="published">Terbit</option>
              </select>
            </Field>
            <Field label="Slug tautan" hint={`Tautan tamu: ${INVITATION_PREFIX}${slugify(slug || label) || 'nama-acara'}`} full>
              <input
                className="adm-input-plain"
                value={slug}
                placeholder={slugify(label) || 'nama-acara'}
                onChange={(event) => setSlug(event.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card
          title={`2. Pilih template (${templates.length})`}
          subtitle="Isi undangan nanti mengikuti susunan template yang dipilih."
        >
          <Toolbar>
            <div className="adm-search">
              <Search size={16} />
              <input
                value={query}
                placeholder="Cari template atau kategori…"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </Toolbar>

          {templates.length === 0 ? (
            <p className="adm-note">Tidak ada template demo yang cocok. Tambah template dulu di menu Template Demo.</p>
          ) : (
            <div className="adm-template-grid">
              {templates.map((item) => {
                const cat = db.categories.find((entry) => entry.id === item.category);
                return (
                  <article
                    key={item.id}
                    className={`adm-template is-pickable ${item.id === templateId ? 'is-picked' : ''}`}
                    onClick={() => setTemplateId(item.id)}
                  >
                    <div className="adm-template__media">
                      {item.thumb ? (
                        <img src={resolveMediaRef(item.thumb, db.media)} alt={item.label} />
                      ) : (
                        <span className="adm-row-title__icon">
                          <LayoutTemplate size={26} />
                        </span>
                      )}
                      <span className="adm-template__cat" style={{ background: cat?.accent }}>
                        {cat?.name || 'Template'}
                      </span>
                      <StatusPill status={item.status} />
                    </div>
                    <div className="adm-template__body">
                      <div>
                        <h3>{item.templateName || item.label}</h3>
                        <code>{item.route}</code>
                      </div>
                      <div className="adm-template__actions">
                        <span className="adm-muted">{item.id === templateId ? 'Dipilih' : 'Pilih'}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
