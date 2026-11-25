import { useEffect, useMemo, useState } from 'react';
import type { PageRecord } from '../../../data/types';
import { assetUrl } from '../../../utils/assetUrl';
import { collectPageImages } from '../../../utils/pageAssets';

const cssCache = new Map<string, Promise<string>>();

function loadCss(css: string): Promise<string> {
  let request = cssCache.get(css);
  if (!request) {
    request = fetch(assetUrl(`/site-css/${css}`))
      .then((response) => (response.ok ? response.text() : ''))
      .catch(() => '');
    cssCache.set(css, request);
  }
  return request;
}

export function usePageAssets(page: PageRecord | undefined, html: string | null) {
  const [cssText, setCssText] = useState('');
  const [cssLoading, setCssLoading] = useState(false);
  const css = page?.css && page.file ? page.css : '';

  useEffect(() => {
    let alive = true;
    setCssText('');
    if (!css) {
      setCssLoading(false);
      return;
    }
    setCssLoading(true);
    loadCss(css).then((text) => {
      if (!alive) return;
      setCssText(text);
      setCssLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [css]);

  const groups = useMemo(() => collectPageImages(html || '', cssText), [html, cssText]);

  return { groups, cssText, cssLoading };
}
