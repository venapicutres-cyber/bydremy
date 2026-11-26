import type { ClonedPageContext } from './types';

const HOME_DEAD_LINKS = new Set([
  '/syifa-naufal-ope/',
  '/almas-dewi/',
  '/fitri-doni/',
  '/alma-haris/',
]);
const PORTFOLIO_SLUG = 'portfolio';
const WORDPRESS_SLUG = /^\/[a-z0-9][a-z0-9-]*\/?$/;

/**
 * Portfolio cards point to invitation slugs from the old WordPress site that
 * were never imported. Keep the cards visible but make their links inert so
 * visitors are no longer sent to a 404 page.
 */
export function disableDeadLinks({ page, root, cleanups }: ClonedPageContext) {
  const anchors: HTMLAnchorElement[] = [];

  if (page.slug === PORTFOLIO_SLUG) {
    root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      if (WORDPRESS_SLUG.test(href)) anchors.push(anchor);
    });
  } else {
    HOME_DEAD_LINKS.forEach((href) => {
      root.querySelectorAll<HTMLAnchorElement>(`a[href="${href}"]`).forEach((anchor) => anchors.push(anchor));
    });
  }

  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href')!;
    const target = anchor.getAttribute('target');
    anchor.removeAttribute('href');
    if (target) anchor.removeAttribute('target');
    anchor.setAttribute('aria-disabled', 'true');
    anchor.style.cursor = 'default';
    cleanups.push(() => {
      if (!anchor.isConnected) return;
      anchor.setAttribute('href', href);
      if (target) anchor.setAttribute('target', target);
      anchor.removeAttribute('aria-disabled');
      anchor.style.cursor = '';
    });
  });
}
