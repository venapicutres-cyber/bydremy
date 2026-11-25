import { useEffect, useState } from 'react';
import { assetUrl, rewriteAssetRefs } from '../utils/assetUrl';
import { applyImageOverrides, type ImageOverrideMap } from '../utils/imageOverrides';

/**
 * Stylesheet halaman diambil dari Storage Supabase, lalu isinya diproses urut:
 * override gambar admin dulu (kuncinya masih path asli), baru referensi aset
 * dipetakan ke Storage. Urutan ini menjaga override lama tetap cocok.
 */
export function usePageStylesheet(css: string | undefined, enabled: boolean, overrides?: ImageOverrideMap) {
  const [ready, setReady] = useState(!enabled || !css);
  const hasOverrides = Boolean(overrides && Object.keys(overrides).length);

  useEffect(() => {
    if (!enabled || !css) {
      setReady(true);
      return;
    }

    setReady(false);
    let alive = true;
    const style = document.createElement('style');
    style.dataset.bydreamyPageStyle = css;

    fetch(assetUrl(`/site-css/${css}`))
      .then((response) => {
        if (!response.ok) throw new Error(`Stylesheet ${css} tidak ditemukan`);
        return response.text();
      })
      .then((text) => {
        if (!alive) return;
        const patched = hasOverrides ? applyImageOverrides(text, overrides) : text;
        style.textContent = rewriteAssetRefs(patched);
        document.head.appendChild(style);
        setReady(true);
      })
      .catch((error) => {
        if (!alive) return;
        console.error(`[assets] gagal memuat stylesheet ${css}`, error);
        setReady(true);
      });

    return () => {
      alive = false;
      style.remove();
    };
  }, [css, enabled, hasOverrides, overrides]);

  return ready;
}
