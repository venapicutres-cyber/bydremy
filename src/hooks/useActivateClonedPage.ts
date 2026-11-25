import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PageRecord } from '../data/types';
import { activateClonedPage } from '../services/cloned';

export function useActivateClonedPage(
  rootRef: React.RefObject<HTMLElement>,
  page: PageRecord | undefined,
  htmlLoaded: boolean,
) {
  const navigate = useNavigate();
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!rootRef.current || !page || !htmlLoaded) return;
    // Let React commit the injected markup before wiring it up.
    const id = window.setTimeout(() => {
      if (rootRef.current) cleanup.current = activateClonedPage({ page, root: rootRef.current, navigate });
    }, 0);
    return () => {
      window.clearTimeout(id);
      // Template undangan mengunci scroll lewat `body.style.overflowY` dan
      // `window.onscroll`; tanpa ini, halaman admin berikutnya ikut terkunci.
      cleanup.current?.();
      cleanup.current = null;
    };
  }, [
    rootRef,
    page?.id,
    page?.contentHtml,
    page?.hiddenSectionIds,
    page?.textOverrides,
    page?.extraHtml,
    htmlLoaded,
    navigate,
  ]);
}
