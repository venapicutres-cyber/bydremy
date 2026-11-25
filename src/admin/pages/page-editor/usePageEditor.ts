import { useEffect, useState } from 'react';
import type { PageRecord } from '../../../data/types';
import { createPage, updatePage } from '../../../services/store';
import { slugify } from '../../../utils/format';
import { emptyDraft, type PageDraft } from './types';

function draftFromPage(page: PageRecord): PageDraft {
  return {
    label: page.label,
    title: page.title,
    slug: page.slug,
    route: page.route,
    description: page.description || '',
    category: page.category || '',
    templateName: page.templateName || '',
    price: page.price != null ? String(page.price) : '',
    priceCompare: page.priceCompare != null ? String(page.priceCompare) : '',
    thumb: page.thumb || '',
    status: page.status,
    order: page.order,
  };
}

interface PageEditorOptions {
  page: PageRecord | undefined;
  isNew: boolean;
  navigate: (path: string) => void;
}

export function usePageEditor({ page, isNew, navigate }: PageEditorOptions) {
  const [draft, setDraft] = useState<PageDraft>(() => (page ? draftFromPage(page) : { ...emptyDraft }));
  const [hidden, setHidden] = useState<string[]>(page?.hiddenSectionIds || []);
  const [overrides, setOverrides] = useState<Record<string, string>>(page?.textOverrides || {});
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>(page?.imageOverrides || {});
  const [linkOverrides, setLinkOverrides] = useState<Record<string, string>>(page?.linkOverrides || {});
  const [extraHtml, setExtraHtml] = useState(page?.extraHtml || '');
  const [useCustomHtml, setUseCustomHtml] = useState(Boolean(page?.contentHtml));
  const [customHtml, setCustomHtml] = useState(page?.contentHtml || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!page) return;
    setDraft(draftFromPage(page));
    setHidden(page.hiddenSectionIds || []);
    setOverrides(page.textOverrides || {});
    setImageOverrides(page.imageOverrides || {});
    setLinkOverrides(page.linkOverrides || {});
    setExtraHtml(page.extraHtml || '');
    setUseCustomHtml(Boolean(page.contentHtml));
    setCustomHtml(page.contentHtml || '');
  }, [page?.id]);

  const setField = <K extends keyof PageDraft>(key: K, value: PageDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!draft.label.trim()) {
      window.alert('Nama halaman wajib diisi.');
      return;
    }
    const route = draft.route.startsWith('/') ? draft.route : `/${draft.route || slugify(draft.label)}`;

    if (isNew) {
      const created = createPage({
        label: draft.label,
        title: draft.title || draft.label,
        slug: draft.slug || slugify(draft.label),
        route,
        description: draft.description,
        category: draft.category || null,
        templateName: draft.templateName || null,
        thumb: draft.thumb,
        status: draft.status,
        order: Number(draft.order) || 99,
        kind: 'page',
        contentHtml: `<section style="padding:120px 24px;text-align:center;font-family:Poppins,sans-serif"><h1 style="font-size:42px;margin:0 0 16px">${draft.label}</h1><p style="color:#555">${
          draft.description || 'Halaman ini dibuat dari dashboard admin.'
        }</p></section>`,
      });
      navigate(`/admin/homepage/${created.id}`);
      return;
    }

    if (!page) return;
    updatePage(page.id, {
      label: draft.label,
      title: draft.title || draft.label,
      slug: draft.slug || slugify(draft.label),
      route,
      description: draft.description,
      category: draft.category || null,
      templateName: draft.templateName || null,
      price: draft.price.trim() ? Number(draft.price) : undefined,
      priceCompare: draft.priceCompare.trim() ? Number(draft.priceCompare) : undefined,
      thumb: draft.thumb,
      status: draft.status,
      order: Number(draft.order) || 0,
      hiddenSectionIds: hidden,
      textOverrides: overrides,
      imageOverrides,
      linkOverrides,
      extraHtml,
      contentHtml: useCustomHtml ? customHtml : undefined,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return {
    draft,
    setField,
    hidden,
    setHidden,
    overrides,
    setOverrides,
    imageOverrides,
    setImageOverrides,
    linkOverrides,
    setLinkOverrides,
    extraHtml,
    setExtraHtml,
    useCustomHtml,
    setUseCustomHtml,
    customHtml,
    setCustomHtml,
    saved,
    save,
  };
}
