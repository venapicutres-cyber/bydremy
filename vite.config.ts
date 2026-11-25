import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Referensi aset di index.html (CSS, JS, favicon) diarahkan ke bucket Storage
 * Supabase supaya berkas disajikan online, sementara path di sumber tetap asli.
 * Ditambah penanda versi agar cache/CDN Storage tidak menyajikan salinan lama.
 */
const ASSET_VERSION = '2';

function rewriteCloneAssets(assetBase: string): Plugin {
  const pattern = /(["'(])\/(wp-content|wp-includes|site-css)\//g;
  const basePattern = new RegExp(`(${assetBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^"')]+)`, 'g');
  return {
    name: 'bydreamy-rewrite-clone-assets',
    transformIndexHtml(html) {
      if (!assetBase) return html;
      const rewritten = html.replace(pattern, (_match, quote: string, prefix: string) => `${quote}${assetBase}/${prefix}/`);
      return rewritten.replace(basePattern, `$1?v=${ASSET_VERSION}`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const assetBase = (env.VITE_ASSET_BASE || '').replace(/\/+$/, '');
  return {
    plugins: [react(), rewriteCloneAssets(assetBase)],
    server: {
      port: 3000,
      open: false,
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 2000,
    },
  };
});
