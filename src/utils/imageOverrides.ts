import { mediaRefId } from './mediaRef';

export type ImageOverrideMap = Record<string, string>;

/**
 * Nilai override boleh berupa URL langsung atau token `media:<id>` agar aset
 * unggahan hanya disimpan sekali di Media.
 */
export function resolveImageOverrides(
  overrides: ImageOverrideMap | undefined,
  media: { id: number; url: string }[] | undefined,
): ImageOverrideMap {
  if (!overrides) return {};
  const byId = new Map((media || []).map((item) => [item.id, item.url]));
  const resolved: ImageOverrideMap = {};
  Object.entries(overrides).forEach(([from, to]) => {
    if (!from || !to) return;
    const id = mediaRefId(to);
    if (id !== null) {
      const url = byId.get(id);
      if (url) resolved[from] = url;
      return;
    }
    resolved[from] = to;
  });
  return resolved;
}

/**
 * Ganti referensi gambar asli (HTML maupun CSS) dengan aset pilihan admin.
 * Semua URL dalam satu grup (src, srcset, background) dipetakan ke URL yang sama,
 * sehingga varian ukuran WordPress ikut terganti tanpa mengubah markup lain.
 */
export function applyImageOverrides(markup: string, overrides?: ImageOverrideMap): string {
  if (!overrides) return markup;
  const entries = Object.entries(overrides).filter(([from, to]) => from && to && from !== to);
  if (!entries.length) return markup;

  let output = markup;
  entries
    .sort(([a], [b]) => b.length - a.length)
    .forEach(([from, to]) => {
      output = output.split(from).join(to);
      // Elementor menyimpan URL di `data-settings` sebagai JSON dengan slash
      // ter-escape (`https:\/\/...`). Ganti juga bentuk itu agar video dan
      // background video ikut berubah.
      const escaped = from.replace(/\//g, '\\/');
      if (escaped !== from) output = output.split(escaped).join(to);
    });
  return output;
}
