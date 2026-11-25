import type { PageRecord } from '../../data/types';
import { getDatabase, setDatabase, stamp } from './persistence';

export function updatePage(id: number, patch: Partial<PageRecord>) {
  setDatabase((db) => ({
    ...db,
    pages: db.pages.map((page) => (page.id === id ? { ...page, ...patch, updatedAt: stamp() } : page)),
  }));
}

export function createPage(input: Partial<PageRecord>): PageRecord {
  const id = input.id ?? Date.now();
  const record: PageRecord = {
    id,
    slug: input.slug ?? `halaman-baru-${id}`,
    route: input.route ?? `/halaman-baru-${id}`,
    label: input.label ?? 'Halaman Baru',
    title: input.title ?? 'Halaman Baru',
    description: input.description ?? '',
    category: input.category ?? null,
    order: input.order ?? 99,
    templateName: input.templateName ?? null,
    file: input.file ?? '',
    css: input.css ?? '',
    thumb: input.thumb ?? '',
    status: input.status ?? 'draft',
    kind: input.kind ?? 'page',
    price: input.price,
    priceCompare: input.priceCompare,
    contentHtml:
      'contentHtml' in input
        ? input.contentHtml
        : '<div style="padding:80px 24px;text-align:center;font-family:Poppins,sans-serif"><h1>Halaman Baru</h1><p>Edit konten halaman ini dari dashboard admin.</p></div>',
    hiddenSectionIds: [...(input.hiddenSectionIds || [])],
    textOverrides: { ...(input.textOverrides || {}) },
    imageOverrides: { ...(input.imageOverrides || {}) },
    linkOverrides: { ...(input.linkOverrides || {}) },
    extraHtml: input.extraHtml,
    updatedAt: stamp(),
    views: 0,
  };
  setDatabase((db) => ({ ...db, pages: [...db.pages, record] }));
  return record;
}

export function duplicatePage(id: number): PageRecord | undefined {
  const database = getDatabase();
  const source = database.pages.find((page) => page.id === id);
  if (!source) return undefined;

  let copyNumber = 1;
  let label = `${source.label} Copy`;
  let slug = `${source.slug}-copy`;
  let route = `${source.route}-copy`;
  while (database.pages.some((page) => page.label === label || page.slug === slug || page.route === route)) {
    copyNumber += 1;
    label = `${source.label} Copy ${copyNumber}`;
    slug = `${source.slug}-copy-${copyNumber}`;
    route = `${source.route}-copy-${copyNumber}`;
  }

  return createPage({
    ...source,
    id: Math.max(Date.now(), ...database.pages.map((page) => page.id + 1)),
    slug,
    route,
    label,
    title: `${source.title} Copy`,
    templateName: `${source.templateName || source.label} Copy`,
    status: 'draft',
    views: 0,
    contentHtml: source.contentHtml,
  });
}

export function deletePage(id: number) {
  setDatabase((db) => ({
    ...db,
    pages: db.pages.filter((page) => page.id !== id),
    deletedPageIds: Array.from(new Set([...(db.deletedPageIds || []), id])),
  }));
}
