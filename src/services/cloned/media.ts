import { parseVideoLink } from '../../utils/mediaLink';
import { decodeSettings } from './settings';
import type { ClonedPageContext } from './types';

function initGalleries({ root }: ClonedPageContext) {
  root.querySelectorAll<HTMLElement>('.e-gallery-image[data-thumbnail]').forEach((image) => {
    const thumb = image.getAttribute('data-thumbnail');
    if (thumb) image.style.backgroundImage = `url("${thumb}")`;
  });

  // Lazy-loaded Elementor images use data-src as fallback.
  root.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((image) => {
    if (!image.src && image.dataset.src) image.src = image.dataset.src;
  });
}

function initCountdown({ root, cleanups }: ClonedPageContext) {
  const countdowns = Array.from(root.querySelectorAll<HTMLElement>('.elementor-countdown-wrapper[data-date]'));
  const tick = () => {
    countdowns.forEach((wrapper) => {
      const target = Number(wrapper.getAttribute('data-date')) * 1000;
      const diff = Math.max(0, target - Date.now());
      const set = (selector: string, value: number) => {
        const element = wrapper.querySelector(selector);
        if (element) element.textContent = String(value).padStart(2, '0');
      };
      set('.elementor-countdown-days', Math.floor(diff / 86400000));
      set('.elementor-countdown-hours', Math.floor((diff / 3600000) % 24));
      set('.elementor-countdown-minutes', Math.floor((diff / 60000) % 60));
      set('.elementor-countdown-seconds', Math.floor((diff / 1000) % 60));
    });
  };

  if (countdowns.length) {
    tick();
    const interval = window.setInterval(tick, 1000);
    cleanups.push(() => window.clearInterval(interval));
  }
}

function initSwipers({ root, cleanups }: ClonedPageContext) {
  const SwiperCtor = (window as unknown as { Swiper?: new (element: Element, options: unknown) => unknown }).Swiper;
  const instances: Array<{ destroy?: (a?: boolean, b?: boolean) => void }> = [];
  if (SwiperCtor) {
    root.querySelectorAll<HTMLElement>('.swiper').forEach((swiperElement) => {
      if (swiperElement.classList.contains('swiper-initialized')) return;
      if (!swiperElement.querySelector('.swiper-wrapper')) return;

      const owner = swiperElement.closest('[data-settings]') || swiperElement;
      const settings = decodeSettings(owner.getAttribute('data-settings'));
      const slides = swiperElement.querySelectorAll('.swiper-slide').length;
      const perView = Number(settings.slides_per_view || 1);
      const container = swiperElement.closest('.elementor-widget-container') || swiperElement.parentElement;
      const nextEl = container?.querySelector('.elementor-swiper-button-next');
      const prevEl = container?.querySelector('.elementor-swiper-button-prev');
      const paginationEl = container?.querySelector('.swiper-pagination');
      const autoplay = settings.autoplay === 'yes' || settings.autoplay === true;

      const options: Record<string, unknown> = {
        slidesPerView: Math.min(perView, Math.max(1, slides)),
        spaceBetween: Number(settings.space_between || 0),
        speed: Number(settings.speed || 600),
        loop: slides > perView + 1,
        grabCursor: true,
        watchOverflow: true,
        navigation: nextEl && prevEl ? { nextEl, prevEl } : undefined,
        pagination: paginationEl ? { el: paginationEl, clickable: true } : undefined,
        autoplay: autoplay ? { delay: Number(settings.autoplay_speed || 5000), disableOnInteraction: false } : false,
        breakpoints:
          perView > 1
            ? {
                0: { slidesPerView: 1 },
                768: { slidesPerView: Math.min(2, perView) },
                1025: { slidesPerView: perView },
              }
            : undefined,
      };

      try {
        instances.push(new SwiperCtor(swiperElement, options) as { destroy?: () => void });
      } catch {
        /* ignore malformed sliders */
      }
    });
  }
  cleanups.push(() => instances.forEach((instance) => instance.destroy?.(true, true)));
}

/**
 * Elementor hanya menaruh `<div class="elementor-video">` kosong di markup;
 * iframe YouTube/Vimeo dibuat oleh JavaScript aslinya. Di clone ini kita
 * membuat pemutar sendiri supaya video section benar-benar tampil dan bisa
 * diganti dari editor.
 */
function initVideoWidgets({ root, cleanups }: ClonedPageContext) {
  root.querySelectorAll<HTMLElement>('.elementor-widget-video').forEach((widget) => {
    const holder = widget.querySelector<HTMLElement>('.elementor-video');
    if (!holder || holder.querySelector('iframe, video')) return;

    const settings = decodeSettings(widget.getAttribute('data-settings'));
    const url = String(
      settings.youtube_url || settings.vimeo_url || settings.hosted_url || settings.external_url || '',
    ).trim();
    if (!url) return;

    const link = parseVideoLink(url);
    if (!link) return;

    const autoplay = settings.autoplay === 'yes';
    const loop = settings.loop === 'yes';
    const mute = settings.mute === 'yes';
    const controls = settings.controls !== 'no';
    const overlay = widget.querySelector<HTMLElement>('.elementor-custom-embed-image-overlay');

    if (overlay && autoplay) overlay.style.display = 'none';

    if (link.provider === 'file') {
      const video = document.createElement('video');
      video.className = 'bydreamy-video-file';
      video.src = link.embedUrl;
      video.controls = controls;
      video.playsInline = true;
      video.autoplay = autoplay;
      video.muted = mute || autoplay;
      video.loop = loop;
      holder.appendChild(video);
      if (autoplay) video.play().catch(() => undefined);
      cleanups.push(() => video.remove());
      return;
    }

    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (mute || autoplay) params.set(link.provider === 'vimeo' ? 'muted' : 'mute', '1');
    if (loop) {
      params.set('loop', '1');
      if (link.provider === 'youtube') {
        params.set('playlist', link.embedUrl.split('/').pop() || '');
      }
    }
    params.set('controls', controls ? '1' : '0');
    params.set('playsinline', '1');
    if (link.provider === 'youtube') params.set('rel', '0');

    const iframe = document.createElement('iframe');
    iframe.className = 'bydreamy-video-embed';
    iframe.src = `${link.embedUrl}?${params.toString()}`;
    iframe.title = 'Video undangan';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    holder.appendChild(iframe);
    cleanups.push(() => iframe.remove());

    if (overlay) {
      if (autoplay) {
        overlay.style.display = 'none';
      } else {
        const reveal = () => {
          overlay.style.display = 'none';
        };
        overlay.addEventListener('click', reveal);
        cleanups.push(() => overlay.removeEventListener('click', reveal));
      }
    }
  });
}

export function initMedia(context: ClonedPageContext) {
  initGalleries(context);
  initCountdown(context);
  initSwipers(context);
  initVideoWidgets(context);
}
