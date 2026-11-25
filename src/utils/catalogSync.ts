import type { PageRecord } from '../data/types';

export interface CatalogSyncResult {
  textOverrides: Record<string, string>;
  linkOverrides: Record<string, string>;
  matched: number;
  unmatched: string[];
}

const SCRATCH = /^\//;

function slugFromHref(href: string): string {
  return href.replace(SCRATCH, '').split(/[/?#]/)[0];
}

function formatRupiah(value: number, prefix: string): string {
  return `${prefix}${value.toLocaleString('id-ID')}`;
}

/**
 * Section "Choose Your Design" pada halaman Home berisi kartu template yang
 * ditulis statis: nama, harga, dan tautan PREVIEW/PORTFOLIO. Fungsi ini membaca
 * ulang bagian tersebut, mencocokkan tiap kartu dengan Template Demo lewat slug
 * pada tautan PREVIEW-nya, lalu menyusun override harga + tautan agar kartu
 * selalu mengikuti data template yang asli.
 */
export function buildCatalogSync(html: string, pages: PageRecord[]): CatalogSyncResult {
  const textOverrides: Record<string, string> = {};
  const linkOverrides: Record<string, string> = {};
  const unmatched: string[] = [];
  if (typeof window === 'undefined') return { textOverrides, linkOverrides, matched: 0, unmatched };

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const catalog = doc.getElementById('sp-catalog') || doc.querySelector('[data-id="09ae512"]');
  if (!catalog) return { textOverrides, linkOverrides, matched: 0, unmatched };

  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const cards = Array.from(catalog.querySelectorAll('.e-grid > .e-con-full'));
  let matched = 0;

  cards.forEach((card) => {
    const anchors = Array.from(card.querySelectorAll<HTMLAnchorElement>('a[href]'));
    const demoLinks = anchors.filter((anchor) => slugFromHref(anchor.getAttribute('href') || '').startsWith('demo-'));
    if (demoLinks.length === 0) return;

    const template = bySlug.get(slugFromHref(demoLinks[0].getAttribute('href') || ''));
    if (!template) {
      unmatched.push(slugFromHref(demoLinks[0].getAttribute('href') || ''));
      return;
    }
    matched += 1;

    // Tautan: arahkan PREVIEW ke route template saat ini, query string dipertahankan.
    demoLinks.forEach((anchor) => {
      const from = anchor.getAttribute('href') || '';
      const target = bySlug.get(slugFromHref(from));
      if (!target) return;
      const queryIndex = from.indexOf('?');
      const next = `${target.route}${queryIndex >= 0 ? from.slice(queryIndex) : ''}`;
      if (next !== from) linkOverrides[from] = next;
    });

    // Harga: dua heading __width-auto pada kartu = harga jual lalu harga coret.
    const priceWidgets = Array.from(card.querySelectorAll<HTMLElement>('[data-widget_type="heading.default"]')).filter((widget) =>
      widget.classList.contains('elementor-widget__width-auto'),
    );
    [template.price, template.priceCompare].forEach((value, index) => {
      if (typeof value !== 'number' || value <= 0) return;
      const widget = priceWidgets[index];
      const id = widget?.getAttribute('data-id');
      if (!widget || !id) return;
      const existing = (widget.querySelector('.elementor-heading-title')?.textContent || '').trim();
      const prefix = /^Rp\.\s/.test(existing) ? 'Rp. ' : 'Rp ';
      textOverrides[id] = formatRupiah(value, prefix);
    });
  });

  return { textOverrides, linkOverrides, matched, unmatched };
}
