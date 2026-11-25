import { useEffect, useState } from 'react';
import type { PageRecord } from '../data/types';

const loaders = import.meta.glob('../content/pages/*.html', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export function usePageHtml(page: PageRecord | undefined) {
  const [html, setHtml] = useState<string | null>(page?.contentHtml || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!page) {
      setHtml(null);
      return;
    }
    if (page.contentHtml) {
      setHtml(page.contentHtml);
      return;
    }
    const loader = loaders[`../content/pages/${page.file}`];
    if (!loader) {
      setError(`Konten untuk halaman ${page.label} tidak ditemukan.`);
      return;
    }
    setHtml(null);
    loader()
      .then((value) => {
        if (alive) setHtml(value);
      })
      .catch((err) => {
        if (alive) setError(String(err));
      });
    return () => {
      alive = false;
    };
  }, [page?.id, page?.file, page?.contentHtml]);

  return { html, error };
}
