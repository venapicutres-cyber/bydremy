import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Eye, MessageSquareHeart, Save } from 'lucide-react';
import type { PageRecord } from '../../data/types';
import { useAdminSession } from '../auth';
import { usePageHtml } from '../../hooks/usePageHtml';
import { updatePage, useDatabase } from '../../services/store';
import { saveInvitationPage } from '../../services/supabase';
import { slugify } from '../../utils/format';
import { INVITATION_PREFIX, invitationRoute, isInvitation } from '../../utils/invitations';
import { resolveMediaRef } from '../../utils/mediaRef';
import { Card, Field, StatusPill } from '../ui';
import { parseSections } from './page-editor/parseSections';
import { SectionsTab } from './page-editor/SectionsTab';
import { usePageAssets } from './page-editor/usePageAssets';

interface InvitationDraft {
  label: string;
  title: string;
  description: string;
  slug: string;
  status: PageRecord['status'];
}

export function InvitationEditorPage() {
  const { id } = useParams();
  const db = useDatabase();
  const session = useAdminSession();
  const page = db.pages.find((item) => item.id === Number(id));
  // Editor hanya boleh mengelola undangan yang tercatat di akunnya. RPC juga
  // memaksa aturan ini di server; pemeriksaan ini merapikan tampilannya.
  const assignedToEditor = session?.role !== 'editor' || !session.pageId || page?.id === session.pageId;
  const invitation = page && isInvitation(page) && assignedToEditor ? page : undefined;
  const { html, error } = usePageHtml(invitation);

  const [draft, setDraft] = useState<InvitationDraft | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({});
  const [linkOverrides, setLinkOverrides] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!invitation) return;
    setDraft({
      label: invitation.label,
      title: invitation.title,
      description: invitation.description || '',
      slug: invitation.slug,
      status: invitation.status,
    });
    setHidden(invitation.hiddenSectionIds || []);
    setOverrides(invitation.textOverrides || {});
    setImageOverrides(invitation.imageOverrides || {});
    setLinkOverrides(invitation.linkOverrides || {});
  }, [invitation?.id]);

  const assets = usePageAssets(invitation, html);
  const sections = useMemo(() => (html ? parseSections(html, assets.cssText) : []), [html, assets.cssText]);
  const slug = slugify(draft?.slug || draft?.label || '');

  const setField = <K extends keyof InvitationDraft>(key: K, value: InvitationDraft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  const save = async () => {
    if (!invitation || !draft) return;
    const label = draft.label.trim();
    if (!label) {
      window.alert('Nama acara wajib diisi.');
      return;
    }
    const title = draft.title.trim() || label;
    const slug = slugify(draft.slug || label) || invitation.slug;
    const route = invitationRoute(slug);
    // Admin menyimpan lewat snapshot penuh pada updatePage di bawah. Editor
    // memakai RPC satu halaman supaya tidak menimpa seluruh data situs.
    if (session?.role !== 'admin') {
      try {
        await saveInvitationPage(invitation.id, {
          label,
          title,
          description: draft.description,
          slug,
          route,
          status: draft.status,
          hidden_section_ids: hidden,
          text_overrides: overrides,
          image_overrides: imageOverrides,
          link_overrides: linkOverrides,
        });
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan undangan.');
        return;
      }
    }
    updatePage(invitation.id, {
      label,
      title,
      description: draft.description,
      slug,
      route,
      status: draft.status,
      hiddenSectionIds: hidden,
      textOverrides: overrides,
      imageOverrides,
      linkOverrides,
    });
    if (slug !== draft.slug) setField('slug', slug);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  if (!invitation || !draft) {
    return (
      <div className="adm-page">
        <div className="adm-empty">
          <h3>Undangan tidak ditemukan</h3>
          <Link className="adm-btn adm-btn--dark" to="/admin/invitations">
            Kembali ke Undangan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page adm-page--editor">
      <div className="adm-editor-head">
        <Link to="/admin/invitations" className="adm-back">
          <ArrowLeft size={15} /> Undangan
        </Link>
        <div>
          <p className="adm-eyebrow">{invitation.templateName || 'Undangan'}</p>
          <h1>{draft.label || 'Undangan Tanpa Judul'}</h1>
          <div className="adm-editor-head__meta">
            <StatusPill status={draft.status} />
            <code className="adm-code">{invitationRoute(slug || invitation.slug)}</code>
            {saved && <span className="adm-saved">Tersimpan ✓</span>}
          </div>
        </div>
        <div className="adm-editor-head__actions">
          <Link to={`/admin/preview/${invitation.id}`} className="adm-btn adm-btn--ghost">
            <Eye size={15} /> Pratinjau
          </Link>
          {invitation.status === 'published' && (
            <Link to={invitation.route} target="_blank" className="adm-btn adm-btn--ghost">
              <ArrowUpRight size={15} /> Buka
            </Link>
          )}
          <button type="button" className="adm-btn adm-btn--dark" onClick={save}>
            <Save size={15} /> Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="adm-editor">
        <div className="adm-editor__main">
          <div className="adm-stack">
            <Card title="Info undangan" subtitle="Dipakai di daftar pengelola, tautan tamu, dan mesin pencari.">
              <div className="adm-form-grid">
                <Field label="Nama acara" hint="Contoh: Bagas & Naila">
                  <input
                    className="adm-input-plain"
                    value={draft.label}
                    onChange={(event) => setField('label', event.target.value)}
                  />
                </Field>
                <Field label="Slug tautan" hint={`Tautan tamu: ${INVITATION_PREFIX}${slug || 'nama-acara'}`}>
                  <input
                    className="adm-input-plain"
                    value={draft.slug}
                    onChange={(event) => setField('slug', event.target.value)}
                  />
                </Field>
                <Field label="Judul SEO">
                  <input
                    className="adm-input-plain"
                    value={draft.title}
                    onChange={(event) => setField('title', event.target.value)}
                  />
                </Field>
                <Field label="Deskripsi">
                  <input
                    className="adm-input-plain"
                    value={draft.description}
                    onChange={(event) => setField('description', event.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card
              title={`Isi undangan (${sections.length} bagian)`}
              subtitle="Form ini mengikuti susunan template yang dipilih. Ubah teks, foto, atau sembunyikan bagian."
            >
              {error && <p className="adm-note">{error}</p>}
              <SectionsTab
                sections={sections}
                isNew={false}
                hidden={hidden}
                setHidden={setHidden}
                overrides={overrides}
                setOverrides={setOverrides}
                linkOverrides={linkOverrides}
                setLinkOverrides={setLinkOverrides}
                media={db.media}
                imageOverrides={imageOverrides}
                setImageOverrides={setImageOverrides}
                uploadPageId={invitation.id}
              />
            </Card>
          </div>
        </div>

        <aside className="adm-editor__side">
          <Card title="Buku Tamu" subtitle="Ucapan dan konfirmasi kehadiran dari tamu undangan ini.">
            <Link to={`/admin/guestbook?page=${invitation.id}`} className="adm-btn adm-btn--ghost">
              <MessageSquareHeart size={15} /> Lihat Ucapan & RSVP
            </Link>
          </Card>

          <Card title="Template dipilih">
            {invitation.thumb ? (
              <img className="adm-cover-preview" src={resolveMediaRef(invitation.thumb, db.media)} alt="" />
            ) : (
              <p className="adm-note">Template ini belum punya thumbnail.</p>
            )}
            <p className="adm-note adm-note--compact">
              <strong>{invitation.templateName || 'Tanpa nama template'}</strong>
            </p>
          </Card>

          <Card title="Publikasi" subtitle="Undangan draf hanya bisa dilihat lewat pratinjau.">
            <Field label="Status">
              <select
                className="adm-select"
                value={draft.status}
                onChange={(event) => setField('status', event.target.value as PageRecord['status'])}
              >
                <option value="draft">Draf</option>
                <option value="published">Terbit</option>
              </select>
            </Field>
            <button type="button" className="adm-btn adm-btn--dark" onClick={save}>
              <Save size={15} /> Simpan Perubahan
            </button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
