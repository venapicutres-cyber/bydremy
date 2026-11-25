import { parseVideoLink } from '../../utils/mediaLink';
import { decodeSettings } from './settings';
import type { ClonedPageContext } from './types';

export function initAnimations({ root, cleanups }: ClonedPageContext) {
  const animationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        const settings = decodeSettings(element.getAttribute('data-settings'));
        const name = (settings._animation || settings.animation) as string | undefined;
        const delay = Number(settings._animation_delay || settings.animation_delay || 0);
        element.classList.remove('elementor-invisible');
        if (name) {
          element.style.animationName = name;
          element.style.animationDuration = element.classList.contains('animated-slow') ? '2s' : '1.25s';
          element.style.animationDelay = `${delay}ms`;
          element.style.animationFillMode = 'both';
        }
        animationObserver.unobserve(element);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
  );

  const invisible = root.querySelectorAll('.elementor-invisible');
  invisible.forEach((element) => animationObserver.observe(element));

  // Elements already in the first viewport should reveal immediately.
  window.setTimeout(() => {
    invisible.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
        element.classList.remove('elementor-invisible');
      }
    });
  }, 120);
  cleanups.push(() => animationObserver.disconnect());

  root.querySelectorAll('[data-settings]').forEach((element) => {
    const settings = decodeSettings(element.getAttribute('data-settings'));
    if (settings.background_background === 'video') {
      const video = element.querySelector('video.elementor-background-video-hosted') as HTMLVideoElement | null;
      const link = settings.background_video_link as string | undefined;
      const parsed = link ? parseVideoLink(link) : null;
      if (parsed?.provider === 'file') {
        if (video && !video.src) {
          video.src = parsed.embedUrl;
          video.muted = true;
          video.autoplay = true;
          video.loop = true;
          video.playsInline = true;
          video.play().catch(() => undefined);
        }
      } else if (parsed) {
        // Background video YouTube/Vimeo: buat iframe di container Elementor.
        const container = element.querySelector<HTMLElement>('.elementor-background-video-container');
        if (container && !container.querySelector('iframe')) {
          if (video) video.style.display = 'none';
          const params = new URLSearchParams({
            autoplay: '1',
            loop: '1',
            controls: '0',
            playsinline: '1',
          });
          params.set(parsed.provider === 'vimeo' ? 'muted' : 'mute', '1');
          if (parsed.provider === 'youtube') {
            params.set('playlist', parsed.embedUrl.split('/').pop() || '');
            params.set('rel', '0');
          }
          const iframe = document.createElement('iframe');
          iframe.className = 'bydreamy-bg-video';
          iframe.src = `${parsed.embedUrl}?${params.toString()}`;
          iframe.title = '';
          iframe.setAttribute('aria-hidden', 'true');
          iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
          container.appendChild(iframe);
          cleanups.push(() => iframe.remove());
        }
      }
    }

    if (settings.sticky === 'top') {
      element.classList.add('bydreamy-sticky');
      // An ancestor with overflow:hidden becomes the sticky containing block,
      // so the panel would scroll away instead of sticking to the viewport.
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        if (window.getComputedStyle(parent).overflow !== 'visible') {
          const node = parent as HTMLElement;
          const original = node.style.overflow;
          node.style.overflow = 'visible';
          cleanups.push(() => {
            node.style.overflow = original;
          });
        }
        parent = parent.parentElement;
      }
    }
  });
}
