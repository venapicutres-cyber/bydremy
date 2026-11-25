import { decodeSettings } from './settings';
import type { ClonedPageContext } from './types';

export function initPowerPack({ root, cleanups, scrollCallbacks }: ClonedPageContext) {
  const timelines = Array.from(root.querySelectorAll<HTMLElement>('.pp-timeline'));
  if (timelines.length) {
    const reveal = () => {
      timelines.forEach((timeline) => {
        timeline.querySelectorAll<HTMLElement>('.pp-timeline-item.pp-timeline-item-hidden').forEach((item) => {
          if (item.getBoundingClientRect().top <= window.innerHeight * 0.95) {
            item.classList.remove('pp-timeline-item-hidden');
            item.classList.add('bounce-in');
          }
        });

        const bar = timeline.querySelector<HTMLElement>('.pp-timeline-connector-inner');
        if (!bar) return;
        const markers = Array.from(timeline.querySelectorAll<HTMLElement>('.pp-timeline-marker'));
        if (!markers.length) return;

        const first = markers[0].getBoundingClientRect();
        const last = markers[markers.length - 1].getBoundingClientRect();
        const start = first.top + first.height / 2;
        const end = last.top + last.height / 2;
        bar.style.height = `${Math.min(Math.max(window.innerHeight / 2 - start, 0), Math.max(end - start, 0))}px`;
      });
    };
    scrollCallbacks.push(reveal);
    reveal();
  }

  root.querySelectorAll<HTMLElement>('.pp-advanced-accordion').forEach((accordion) => {
    const titles = Array.from(accordion.querySelectorAll<HTMLElement>('.pp-accordion-tab-title'));
    const widget = accordion.closest<HTMLElement>('[data-settings]');
    const settings = decodeSettings(widget?.getAttribute('data-settings') || null);
    const isAccordion = settings.accordion_type === 'accordion';

    const setOpen = (title: HTMLElement, open: boolean) => {
      const content = title.nextElementSibling as HTMLElement | null;
      title.classList.toggle('pp-accordion-tab-show', open);
      title.classList.toggle('pp-accordion-tab-active', open);
      if (content?.classList.contains('pp-accordion-tab-content')) {
        content.classList.toggle('pp-accordion-tab-active', open);
      }
      title.closest('.pp-accordion-item')?.classList.toggle('pp-accordion-item-active', open);
    };
    const closeAll = () => titles.forEach((title) => setOpen(title, false));

    titles.forEach((title) => {
      if (title.classList.contains('pp-accordion-tab-active-default')) setOpen(title, true);

      const toggle = (event: Event) => {
        event.preventDefault();
        const isOpen = title.classList.contains('pp-accordion-tab-show');
        if (isAccordion) {
          closeAll();
          if (!isOpen) setOpen(title, true);
        } else {
          setOpen(title, !isOpen);
        }
      };
      const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') toggle(event);
      };

      title.addEventListener('click', toggle);
      title.addEventListener('keydown', onKeydown);
      cleanups.push(() => {
        title.removeEventListener('click', toggle);
        title.removeEventListener('keydown', onKeydown);
      });
    });
  });

  // Testimonials use PowerPack's bundled slick build.
  const jq = (window as unknown as { jQuery?: any }).jQuery;
  if (jq?.fn?.slick) {
    root.querySelectorAll<HTMLElement>('.pp-slick-slider').forEach((slider) => {
      if (slider.classList.contains('slick-initialized')) return;
      if (slider.querySelectorAll('.pp-testimonial-slide').length < 2) return;
      try {
        jq(slider).slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: slider.classList.contains('pp-slick-slider-dots-outside'),
          infinite: true,
          autoplay: true,
          autoplaySpeed: 5000,
          pauseOnHover: true,
        });
        cleanups.push(() => {
          try {
            jq(slider).slick('unslick');
          } catch {
            /* already destroyed */
          }
        });
      } catch {
        /* ignore malformed sliders */
      }
    });
  }

  if (scrollCallbacks.length) {
    let frame = 0;
    const runCallbacks = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        scrollCallbacks.forEach((callback) => callback());
      });
    };
    window.addEventListener('scroll', runCallbacks, { passive: true });
    window.addEventListener('resize', runCallbacks);
    cleanups.push(() => {
      window.removeEventListener('scroll', runCallbacks);
      window.removeEventListener('resize', runCallbacks);
      if (frame) window.cancelAnimationFrame(frame);
    });
  }
}
