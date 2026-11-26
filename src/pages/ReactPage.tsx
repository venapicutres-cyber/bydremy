import { useEffect, useMemo, useRef, type ComponentType } from 'react';
import { useActivateClonedPage } from '../hooks/useActivateClonedPage';
import { usePageStylesheet } from '../hooks/usePageStylesheet';
import type { PageRecord } from '../data/types';
import { useDatabase } from '../services/store';
import { rewriteAssetRefs, assetUrl } from '../utils/assetUrl';
import { decodeHtmlEntities } from '../utils/html';
import { applyImageOverrides, resolveImageOverrides } from '../utils/imageOverrides';

export interface MarkupProps {
  rewrite: (value: string) => string;
}

interface ReactPageProps {
  page: PageRecord;
  Markup: ComponentType<MarkupProps>;
}

/** Renders a cloned page as React while keeping its Elementor styling and widgets. */
export function ReactPage({ page, Markup }: ReactPageProps) {
  const db = useDatabase();
  const rootRef = useRef<HTMLDivElement>(null);
  const resolvedOverrides = useMemo(
    () => resolveImageOverrides(page.imageOverrides, db.media),
    [page.imageOverrides, db.media],
  );
  const rewrite = useMemo(
    () => (value: string) => rewriteAssetRefs(applyImageOverrides(value, resolvedOverrides)),
    [resolvedOverrides],
  );
  const cssReady = usePageStylesheet(page.css && page.file ? page.css : undefined, true, resolvedOverrides);

  useActivateClonedPage(rootRef, page, cssReady);

  useEffect(() => {
    const previous = document.title;
    document.title = decodeHtmlEntities(page.title);
    return () => {
      document.title = previous;
    };
  }, [page.id]);

  return (
    <div className="bydreamy-cloned-shell">
      {!cssReady && (
        <div className="bydreamy-loader">
          <img src={assetUrl('/wp-content/uploads/2026/02/Logo-Invite-Me-150x150.webp')} alt="bydreamy" />
          <span>Menyiapkan undangan…</span>
        </div>
      )}
      <div ref={rootRef} className="bydreamy-cloned" data-page-id={page.id}>
        <Markup rewrite={rewrite} />
        {page.extraHtml && <div dangerouslySetInnerHTML={{ __html: rewrite(page.extraHtml) }} />}
      </div>
    </div>
  );
}
