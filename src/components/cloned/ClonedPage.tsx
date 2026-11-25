import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../../services/store';
import { useActivateClonedPage } from '../../hooks/useActivateClonedPage';
import { usePageHtml } from '../../hooks/usePageHtml';
import { usePageStylesheet } from '../../hooks/usePageStylesheet';
import { decodeHtmlEntities } from '../../utils/html';
import { assetUrl, rewriteAssetRefs } from '../../utils/assetUrl';
import { applyImageOverrides, resolveImageOverrides } from '../../utils/imageOverrides';
import { editorPathForPage } from '../../utils/invitations';

interface ClonedPageProps {
  pageId: number;
  preview?: boolean;
}

export function ClonedPage({ pageId, preview = false }: ClonedPageProps) {
  const db = useDatabase();
  const page = db.pages.find((item) => item.id === pageId);
  const { html, error } = usePageHtml(page);
  const rootRef = useRef<HTMLDivElement>(null);
  const resolvedOverrides = useMemo(
    () => resolveImageOverrides(page?.imageOverrides, db.media),
    [page?.imageOverrides, db.media],
  );
  const displayHtml = useMemo(
    () => (html ? rewriteAssetRefs(applyImageOverrides(html + (page?.extraHtml || ''), resolvedOverrides)) : null),
    [html, page?.extraHtml, resolvedOverrides],
  );
  const cssReady = usePageStylesheet(
    page?.css && page.file ? page.css : undefined,
    Boolean(displayHtml),
    resolvedOverrides,
  );
  const isPublished = !page || page.status === 'published' || preview;
  useActivateClonedPage(rootRef, isPublished ? page : undefined, Boolean(displayHtml) && cssReady);

  useEffect(() => {
    if (!page) return;
    const previous = document.title;
    document.title = decodeHtmlEntities(page.title);
    return () => {
      document.title = previous;
    };
  }, [page?.id]);

  if (!page) {
    return (
      <div className="bydreamy-state">
        <p className="bydreamy-state__eyebrow">404</p>
        <h1>Halaman tidak ditemukan</h1>
        <p>Halaman yang kamu cari sudah dipindahkan atau belum dipublikasikan.</p>
        <Link className="bydreamy-btn" to="/">
          Kembali ke Home
        </Link>
      </div>
    );
  }

  if (!preview && page.status !== 'published') {
    return (
      <div className="bydreamy-state">
        <p className="bydreamy-state__eyebrow">Draft</p>
        <h1>{page.title}</h1>
        <p>Halaman ini sedang berstatus draft dan belum dipublikasikan.</p>
        <Link className="bydreamy-btn" to="/admin/pages">
          Kelola di Dashboard
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bydreamy-state">
        <p className="bydreamy-state__eyebrow">Konten</p>
        <h1>Konten belum tersedia</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bydreamy-cloned-shell">
      {preview && (
        <div className="bydreamy-preview-bar">
          <span>
            Preview: <strong>{page.label}</strong> · {page.status === 'published' ? 'Published' : 'Draft'}
          </span>
          <Link to={editorPathForPage(page)}>Kembali ke editor</Link>
        </div>
      )}
      {(!displayHtml || !cssReady) && (
        <div className="bydreamy-loader">
          <img src={assetUrl('/wp-content/uploads/2026/02/Logo-Invite-Me-150x150.webp')} alt="bydreamy" />
          <span>Menyiapkan undangan…</span>
        </div>
      )}
      {displayHtml && (
        <div
          ref={rootRef}
          className="bydreamy-cloned"
          data-page-id={page.id}
          dangerouslySetInnerHTML={{ __html: displayHtml }}
        />
      )}
    </div>
  );
}
