import { decodeHtmlEntities } from '../../utils/html';
import type { ClonedPageContext } from './types';

function textTarget(root: HTMLElement, key: string): HTMLElement | null {
  const separator = key.indexOf('::path:');
  const widgetId = separator < 0 ? key : key.slice(0, separator);
  let target = root.querySelector<HTMLElement>(`[data-id="${widgetId}"]`);
  if (!target || separator < 0) return target;

  const path = key.slice(separator + '::path:'.length);
  for (const indexText of path.split('.')) {
    const index = Number(indexText);
    if (!Number.isInteger(index)) return null;
    target = target.children.item(index) as HTMLElement | null;
    if (!target) return null;
  }
  return target;
}

function setTextPreservingChildElements(target: HTMLElement, text: string) {
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const firstText = walker.nextNode();
  if (!firstText) {
    target.prepend(document.createTextNode(text));
    return;
  }

  firstText.textContent = text;
  let nextText = walker.nextNode();
  while (nextText) {
    nextText.textContent = '';
    nextText = walker.nextNode();
  }
}

/**
 * Mirrors the document state a fresh WordPress request would have: body
 * classes, page title, scroll position, section visibility and copy edits.
 */
export function applyPageState({ page, root, cleanups }: ClonedPageContext) {
  const previousBodyClass = document.body.className;
  document.body.className = [
    'cloned-body',
    'wp-singular',
    'page-template',
    'elementor-default',
    'elementor-template-canvas',
    'elementor-kit-7',
    'elementor-page',
    `elementor-page-${page.id}`,
    `page-id-${page.id}`,
  ].join(' ');

  document.title = decodeHtmlEntities(page.title);

  window.scrollTo(0, 0);

  (page.hiddenSectionIds || []).forEach((id) => {
    root.querySelectorAll(`[data-id="${id}"]`).forEach((element) => {
      (element as HTMLElement).style.display = 'none';
    });
  });

  Object.entries(page.textOverrides || {}).forEach(([id, text]) => {
    const separator = id.indexOf('::path:');
    const widget = root.querySelector<HTMLElement>(`[data-id="${separator < 0 ? id : id.slice(0, separator)}"]`);
    if (!widget) return;
    if (separator >= 0) {
      const target = textTarget(root, id);
      if (target) setTextPreservingChildElements(target, text);
      return;
    }
    const target =
      widget.querySelector<HTMLElement>('.elementor-heading-title') ||
      widget.querySelector<HTMLElement>('.elementor-text-editor') ||
      widget.querySelector<HTMLElement>('.elementor-widget-container') ||
      widget;
    target.textContent = text;
  });

  Object.entries(page.linkOverrides || {}).forEach(([from, to]) => {
    // Override per widget dipakai karena beberapa tombol bisa punya URL
    // placeholder yang sama (misal dua "@username" pada section couple).
    if (from.endsWith('::link')) {
      const widgetId = from.slice(0, -'::link'.length);
      const widget = root.querySelector<HTMLElement>(`[data-id="${widgetId}"]`);
      widget?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => anchor.setAttribute('href', to));
      return;
    }
    root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
      if (anchor.getAttribute('href') === from) anchor.setAttribute('href', to);
    });
  });

  cleanups.push(() => {
    document.body.className = previousBodyClass;
    document.body.style.overflow = '';
    document.body.style.overflowY = '';
    window.onscroll = null;
  });
}
