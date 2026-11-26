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

function resolveTextTarget(root: HTMLElement, id: string): HTMLElement | null {
  const separator = id.indexOf('::path:');
  const widget = root.querySelector<HTMLElement>(`[data-id="${separator < 0 ? id : id.slice(0, separator)}"]`);
  if (!widget) return null;
  if (separator >= 0) return textTarget(root, id);
  return (
    widget.querySelector<HTMLElement>('.elementor-heading-title') ||
    widget.querySelector<HTMLElement>('.elementor-text-editor') ||
    widget.querySelector<HTMLElement>('.elementor-widget-container') ||
    widget
  );
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

function captureText(target: HTMLElement): () => void {
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const nodes: Array<{ node: Text; value: string }> = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push({ node: current as Text, value: current.textContent || '' });
    current = walker.nextNode();
  }
  return () => {
    if (!nodes.length) {
      if (target.firstChild?.nodeType === Node.TEXT_NODE) target.firstChild.remove();
      return;
    }
    nodes.forEach(({ node, value }) => {
      if (node.isConnected) node.textContent = value;
    });
  };
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
    root.querySelectorAll<HTMLElement>(`[data-id="${id}"]`).forEach((element) => {
      const previous = element.style.display;
      element.style.display = 'none';
      cleanups.push(() => {
        element.style.display = previous;
      });
    });
  });

  Object.keys(page.textOverrides || {})
    .filter((id) => id.startsWith('hidden::'))
    .forEach((id) => {
      const target = resolveTextTarget(root, id.slice('hidden::'.length));
      if (!target) return;
      const previous = target.style.display;
      target.style.display = 'none';
      cleanups.push(() => {
        target.style.display = previous;
      });
    });

  Object.entries(page.textOverrides || {})
    .filter(([id]) => id.startsWith('custom::'))
    .forEach(([id, text]) => {
      const sectionId = id.split('::')[1];
      const section = root.querySelector<HTMLElement>(`[data-id="${sectionId}"]`);
      if (!section) return;
      const paragraph = document.createElement('p');
      paragraph.className = 'adm-custom-text';
      paragraph.textContent = text;
      section.appendChild(paragraph);
      cleanups.push(() => paragraph.remove());
    });

  Object.entries(page.textOverrides || {}).forEach(([id, text]) => {
    if (id.startsWith('hidden::') || id.startsWith('custom::')) return;
    const target = resolveTextTarget(root, id);
    if (!target) return;
    const restore = captureText(target);
    if (id.includes('::path:')) setTextPreservingChildElements(target, text);
    else target.textContent = text;
    cleanups.push(restore);
  });

  Object.entries(page.linkOverrides || {}).forEach(([from, to]) => {
    // Override per widget dipakai karena beberapa tombol bisa punya URL
    // placeholder yang sama (misal dua "@username" pada section couple).
    if (from.endsWith('::link')) {
      const widgetId = from.slice(0, -'::link'.length);
      const widget = root.querySelector<HTMLElement>(`[data-id="${widgetId}"]`);
      widget?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
        const previous = anchor.getAttribute('href');
        anchor.setAttribute('href', to);
        cleanups.push(() => {
          if (!anchor.isConnected) return;
          if (previous === null) anchor.removeAttribute('href');
          else anchor.setAttribute('href', previous);
        });
      });
      return;
    }
    root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
      if (anchor.getAttribute('href') !== from) return;
      anchor.setAttribute('href', to);
      cleanups.push(() => {
        if (anchor.isConnected) anchor.setAttribute('href', from);
      });
    });
  });

  cleanups.push(() => {
    document.body.className = previousBodyClass;
    document.body.style.overflow = '';
    document.body.style.overflowY = '';
    window.onscroll = null;
  });
}
