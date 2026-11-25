import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Eye, RefreshCw, Save } from 'lucide-react';
import { deletePage, useDatabase } from '../../services/store';
import { usePageHtml } from '../../hooks/usePageHtml';
import { buildCatalogSync } from '../../utils/catalogSync';
import { StatusPill } from '../ui';
import { AdvancedTab } from './page-editor/AdvancedTab';
import { ContentTab } from './page-editor/ContentTab';
import { DetailsCard } from './page-editor/DetailsCard';
import { ImagesTab } from './page-editor/ImagesTab';
import { parseSections } from './page-editor/parseSections';
import { PublicationCard } from './page-editor/PublicationCard';
import { SectionsTab } from './page-editor/SectionsTab';
import { SeoTab } from './page-editor/SeoTab';
import { TechnicalCard } from './page-editor/TechnicalCard';
import { usePageAssets } from './page-editor/usePageAssets';
import { usePageEditor } from './page-editor/usePageEditor';

type EditorTab = 'sections' | 'images' | 'content' | 'seo' | 'advanced';

export function PageEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = useDatabase();
  const isNew = !id;
  const page = isNew ? undefined : db.pages.find((item) => item.id === Number(id));
  const backTo = page?.kind === 'template' ? '/admin/pages' : '/admin/homepage';
  const backLabel = page?.kind === 'template' ? 'Template Demo' : 'Halaman Website';
  const { html } = usePageHtml(page);
  const editor = usePageEditor({ page, isNew, navigate });
  const [tab, setTab] = useState<EditorTab>('sections');

  const assets = usePageAssets(page, html);
  const sections = useMemo(() => (html ? parseSections(html, assets.cssText) : []), [html, assets.cssText]);
  const category = db.categories.find((item) => item.id === page?.category);
  const hasCatalog = Boolean(html && html.includes('id="sp-catalog"'));

  const syncCatalog = () => {
    if (!html) return;
    const result = buildCatalogSync(html, db.pages);
    if (result.matched === 0) {
      window.alert('Section "Choose Your Design" tidak ditemukan di halaman ini.');
      return;
    }
    editor.setOverrides((current) => ({ ...current, ...result.textOverrides }));
    editor.setLinkOverrides((current) => ({ ...current, ...result.linkOverrides }));
    window.alert(
      `Katalog disinkronkan dari ${result.matched} template demo. Tekan Simpan Perubahan untuk menerapkan.` +
        (result.unmatched.length ? `\nTemplate tidak dikenali: ${result.unmatched.join(', ')}` : ''),
    );
  };

  if (!isNew && !page) {
    return (
      <div className="adm-page">
        <div className="adm-empty">
          <h3>Halaman tidak ditemukan</h3>
          <Link className="adm-btn adm-btn--dark" to="/admin/pages">
            Kembali ke Template Demo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page adm-page--editor">
      <div className="adm-editor-head">
        <Link to={backTo} className="adm-back">
          <ArrowLeft size={15} /> {backLabel}
        </Link>
        <div>
          <p className="adm-eyebrow">
            {isNew ? 'Halaman Baru' : page?.kind === 'template' ? 'Template Demo' : 'Editor Halaman'}
          </p>
          <h1>{editor.draft.label || 'Halaman Tanpa Judul'}</h1>
          <div className="adm-editor-head__meta">
            {!isNew && <StatusPill status={editor.draft.status} />}
            {!isNew && <code className="adm-code">{page?.route}</code>}
            {category && <span className="adm-muted">{category.name} Series</span>}
            {editor.saved && <span className="adm-saved">Tersimpan ✓</span>}
          </div>
        </div>
        <div className="adm-editor-head__actions">
          {!isNew && (
            <Link to={`/admin/preview/${page!.id}`} className="adm-btn adm-btn--ghost">
              <Eye size={15} /> Preview
            </Link>
          )}
          {!isNew && page?.status === 'published' && (
            <Link to={page.route} target="_blank" className="adm-btn adm-btn--ghost">
              <ArrowUpRight size={15} /> Buka
            </Link>
          )}
          {!isNew && hasCatalog && (
            <button type="button" className="adm-btn adm-btn--ghost" onClick={syncCatalog} title="Ambil harga dan tautan dari Template Demo">
              <RefreshCw size={15} /> Sinkronkan Katalog
            </button>
          )}
          <button type="button" className="adm-btn adm-btn--dark" onClick={editor.save}>
            <Save size={15} /> {isNew ? 'Buat Halaman' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      <div className="adm-editor">
        <div className="adm-editor__main">
          <div className="adm-tabs">
            {(['sections', 'images', 'content', 'seo', 'advanced'] as const).map((item) => (
              <button key={item} type="button" className={tab === item ? 'is-active' : undefined} onClick={() => setTab(item)}>
                {item === 'sections'
                  ? `Section & Teks (${sections.length})`
                  : item === 'images'
                    ? `Gambar & Aset (${assets.groups.length})`
                    : item === 'content'
                      ? 'Konten HTML'
                      : item === 'seo'
                        ? 'SEO'
                        : 'Lanjutan'}
              </button>
            ))}
          </div>

          {tab === 'sections' && (
            <SectionsTab
              sections={sections}
              isNew={isNew}
              hidden={editor.hidden}
              setHidden={editor.setHidden}
              overrides={editor.overrides}
              setOverrides={editor.setOverrides}
              linkOverrides={editor.linkOverrides}
              setLinkOverrides={editor.setLinkOverrides}
              media={db.media}
              imageOverrides={editor.imageOverrides}
              setImageOverrides={editor.setImageOverrides}
            />
          )}

          {tab === 'images' && (
            <ImagesTab
              groups={assets.groups}
              media={db.media}
              loading={assets.cssLoading}
              overrides={editor.imageOverrides}
              setOverrides={editor.setImageOverrides}
            />
          )}

          {tab === 'content' && (
            <ContentTab
              page={page}
              useCustomHtml={editor.useCustomHtml}
              setUseCustomHtml={editor.setUseCustomHtml}
              customHtml={editor.customHtml}
              setCustomHtml={editor.setCustomHtml}
              extraHtml={editor.extraHtml}
              setExtraHtml={editor.setExtraHtml}
            />
          )}

          {tab === 'seo' && <SeoTab draft={editor.draft} route={page?.route} setField={editor.setField} />}

          {tab === 'advanced' && (
            <AdvancedTab
              draft={editor.draft}
              page={page}
              isNew={isNew}
              setField={editor.setField}
              onDelete={() => {
                if (!page) return;
                deletePage(page.id);
                navigate(backTo);
              }}
            />
          )}
        </div>

        <aside className="adm-editor__side">
          <PublicationCard
            draft={editor.draft}
            page={page}
            isNew={isNew}
            setField={editor.setField}
            save={editor.save}
          />
          <DetailsCard draft={editor.draft} categories={db.categories} setField={editor.setField} />
          {!isNew && page && (
            <TechnicalCard
              page={page}
              orders={db.orders}
              hidden={editor.hidden}
              overrides={editor.overrides}
              imageOverrides={editor.imageOverrides}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
