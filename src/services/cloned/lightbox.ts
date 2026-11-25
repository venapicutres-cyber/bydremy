import { internalPath } from '../../utils/route';
import type { ClonedPageContext } from './types';

export function initLightbox({ root, navigate, cleanups }: ClonedPageContext) {
  let overlay: HTMLDivElement | null = null;

  const closeOverlay = () => {
    overlay?.remove();
    overlay = null;
    document.body.style.overflow = '';
  };

  const openOverlay = (content: HTMLElement) => {
    closeOverlay();
    overlay = document.createElement('div');
    overlay.className = 'bydreamy-lightbox';

    const close = document.createElement('button');
    close.className = 'bydreamy-lightbox__close';
    close.setAttribute('aria-label', 'Tutup');
    close.innerHTML = '&times;';
    close.addEventListener('click', closeOverlay);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeOverlay();
    });
    overlay.appendChild(close);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  };

  const openImage = (src: string, caption = '') => {
    const figure = document.createElement('figure');
    figure.className = 'bydreamy-lightbox__figure';
    const image = document.createElement('img');
    image.src = src;
    image.alt = caption;
    figure.appendChild(image);
    if (caption) {
      const figcaption = document.createElement('figcaption');
      figcaption.textContent = caption;
      figure.appendChild(figcaption);
    }
    openOverlay(figure);
  };

  const openMessage = (title: string, message: string) => {
    const panel = document.createElement('div');
    panel.className = 'bydreamy-modal-panel';
    panel.innerHTML = `<p class="bydreamy-modal-panel__eyebrow">bydreamy</p><h3>${title}</h3><p>${message}</p>`;
    openOverlay(panel);
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeOverlay();
  };
  document.addEventListener('keydown', onKey);
  cleanups.push(() => {
    document.removeEventListener('keydown', onKey);
    closeOverlay();
  });

  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;
    // Buttons in the cloned markup are often `<a role="button">` without href.
    // They must never be treated as links, or they resolve to the site root.
    const rawHref = anchor.getAttribute('href');
    if (rawHref === null || rawHref.trim() === '') return;
    const href = rawHref.trim();

    if (anchor.hasAttribute('data-elementor-open-lightbox')) {
      event.preventDefault();
      openImage(href, anchor.getAttribute('data-elementor-lightbox-title') || '');
      return;
    }

    if (href.startsWith('#elementor-action')) {
      event.preventDefault();
      const label = (anchor.textContent || '').trim();
      if (label.toLowerCase().includes('qr')) {
        openMessage(
          'QR Check-in',
          'Tampilan QR check-in interaktif tersedia pada undangan asli. Bagian ini menggunakan data tamu dari dashboard admin.',
        );
      } else {
        openMessage('bydreamy', 'Konten popup interaktif ini terhubung ke data tamu undangan.');
      }
      return;
    }

    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (anchor.getAttribute('target') === '_blank') return;

    const path = internalPath(href);
    if (path && path !== window.location.pathname + window.location.search) {
      event.preventDefault();
      navigate(path);
    }
  };
  root.addEventListener('click', onClick);
  cleanups.push(() => root.removeEventListener('click', onClick));

  return { openMessage };
}
