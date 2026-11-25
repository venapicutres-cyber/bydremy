import {
  collectCssBackgrounds,
  collectPageImages,
  collectSectionMedia,
  categorizeImage,
  isOrnament,
  mergePageImageGroups,
  type MediaRole,
  type PageImageGroup,
} from '../../../utils/pageAssets';
import type { SectionHeading, SectionInfo, SectionLink } from './types';

const EDITABLE_TEXT_TARGETS = [
  {
    selector:
      '.elementor-widget-text-editor .elementor-widget-container > p, .elementor-widget-text-editor .elementor-widget-container > ul > li, .elementor-widget-text-editor .elementor-widget-container > ol > li',
    tag: 'p',
    label: 'Paragraf',
  },
  { selector: '.elementor-button-text', tag: 'button', label: 'Teks tombol' },
  { selector: '.elementor-icon-list-text', tag: 'span', label: 'Teks daftar' },
  { selector: '.elementor-icon-box-title, .elementor-image-box-title', tag: 'span', label: 'Judul fitur', linkChild: true },
  { selector: '.elementor-icon-box-description, .elementor-image-box-description', tag: 'p', label: 'Deskripsi fitur' },
  { selector: '.elementor-counter-title', tag: 'span', label: 'Judul angka' },
  { selector: '.elementor-counter-number-prefix, .elementor-counter-number, .elementor-counter-number-suffix', tag: 'span', label: 'Angka' },
  { selector: '.elementor-progress-title', tag: 'span', label: 'Label progres' },
  { selector: '.elementor-accordion-title', tag: 'span', label: 'Judul akordeon' },
  { selector: '.elementor-tab-title', tag: 'span', label: 'Judul tab' },
  { selector: '.elementor-tab-content > p, .elementor-tab-content li', tag: 'p', label: 'Isi tab' },
  { selector: '.pp-timeline-card-title', tag: 'span', label: 'Judul cerita' },
  {
    selector: '.pp-timeline-card-content > p, .pp-timeline-card-content > ul > li, .pp-timeline-card-content > ol > li',
    tag: 'p',
    label: 'Isi cerita',
  },
  { selector: '.elementor-price-list-title', tag: 'span', label: 'Nama item' },
  { selector: '.elementor-price-list-price', tag: 'span', label: 'Harga' },
  { selector: '.elementor-price-list-description', tag: 'p', label: 'Deskripsi item' },
  { selector: '.elementor-testimonial__text', tag: 'p', label: 'Testimoni' },
  { selector: '.elementor-testimonial__name', tag: 'span', label: 'Nama pemberi testimoni' },
  { selector: '.elementor-testimonial__title', tag: 'span', label: 'Jabatan pemberi testimoni' },
  { selector: '.elementor-cta__title', tag: 'span', label: 'Judul ajakan' },
  { selector: '.elementor-cta__description', tag: 'p', label: 'Deskripsi ajakan' },
  { selector: '.elementor-cta__button', tag: 'a', label: 'Teks tombol' },
];

function cleanText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

/** Cari heading terdekat sebelum widget gambar, misalnya "Naila" atau "Bagas". */
function precedingHeading(widget: Element, section: Element): string {
  let node: Element | null = widget;
  while (node && node !== section) {
    let previous = node.previousElementSibling;
    while (previous) {
      if (previous.matches('.elementor-heading-title')) {
        return cleanText(previous.textContent);
      }
      const headings = previous.querySelectorAll('.elementor-heading-title');
      if (headings.length) {
        return cleanText(headings[headings.length - 1].textContent);
      }
      previous = previous.previousElementSibling;
    }
    node = node.parentElement;
  }
  return '';
}

function collectGalleryUrls(section: Element): Set<string> {
  const urls = new Set<string>();
  section.querySelectorAll<HTMLElement>('.e-gallery-image').forEach((image) => {
    const thumbnail = image.getAttribute('data-thumbnail');
    if (thumbnail) urls.add(thumbnail);
    const style = image.getAttribute('style') || '';
    for (const match of style.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
      if (match[2]) urls.add(match[2]);
    }
  });
  return urls;
}

function childPath(parent: Element, target: Element): string | null {
  const indexes: number[] = [];
  let node: Element | null = target;
  while (node && node !== parent) {
    const owner = node.parentElement;
    if (!owner) return null;
    const index = Array.from(owner.children).indexOf(node);
    if (index < 0) return null;
    indexes.unshift(index);
    node = owner;
  }
  return node === parent ? indexes.join('.') : null;
}

function appendEditableTextTargets(section: Element, headings: SectionHeading[]) {
  const existing = new Set(headings.map((heading) => heading.id));

  EDITABLE_TEXT_TARGETS.forEach(({ selector, tag, label, linkChild }) => {
    section.querySelectorAll(selector).forEach((match) => {
      const target = linkChild ? match.querySelector('a') || match : match;
      const text = cleanText(target.textContent);
      const widget = target.closest('[data-widget_type][data-id]');
      const widgetId = widget?.getAttribute('data-id');
      const path = widget && childPath(widget, target);
      if (!text || !widgetId || path === null) return;

      const id = `${widgetId}::path:${path}`;
      if (existing.has(id)) return;
      existing.add(id);
      headings.push({ id, tag, text, label });
    });
  });
}

/** Heading pendek terdekat sebelum widget, misalnya "Angel" atau "Akad". */
function nearestShortHeading(widget: Element, section: Element, fallback: string): string {
  const candidates = Array.from(section.querySelectorAll<HTMLElement>('.elementor-heading-title'))
    .filter((heading) => {
      const text = cleanText(heading.textContent);
      if (!text || text.length > 40) return false;
      if (/^(and|&|bride|groom|date\s*&?\s*place)$/i.test(text)) return false;
      if (/^(minggu|senin|selasa|rabu|kamis|jumat|sabtu)\b/i.test(text)) return false;
      if (/^\d{1,2}:\d{2}/.test(text) || /WIB$/i.test(text)) return false;
      return Boolean(heading.compareDocumentPosition(widget) & Node.DOCUMENT_POSITION_FOLLOWING);
    })
    .map((heading) => cleanText(heading.textContent));
  return candidates.length ? candidates[candidates.length - 1] : fallback;
}

/** Kumpulkan tombol bertautan supaya URL-nya bisa diisi dari form edit. */
function collectSectionLinks(section: Element, sectionLabel: string): SectionLink[] {
  const seen = new Set<string>();
  const links: SectionLink[] = [];

  section.querySelectorAll<HTMLAnchorElement>('a.elementor-button[href]').forEach((anchor) => {
    const widget = anchor.closest('[data-widget_type][data-id]');
    const widgetId = widget?.getAttribute('data-id');
    const href = anchor.getAttribute('href') || '';
    const text = cleanText(anchor.textContent);
    if (!widget || !widgetId || !href || !text || seen.has(widgetId)) return;

    const generic = /^(@username|google maps|lihat detail|view details)$/i.test(text);
    const heading = generic ? nearestShortHeading(widget, section, sectionLabel) : text;
    const kind = /instagram|@username/i.test(`${text} ${href}`)
      ? 'Instagram'
      : /maps|lokasi|location/i.test(`${text} ${href}`)
        ? 'Google Maps'
        : 'Tautan';
    seen.add(widgetId);
    links.push({
      id: `${widgetId}::link`,
      widgetId,
      label: `${kind} — ${heading}`.slice(0, 80),
      text,
      href,
    });
  });

  return links;
}

function labelImages(
  section: Element,
  sectionIndex: number,
  sectionLabel: string,
  isCover: boolean,
  isCouple: boolean,
  isGallery: boolean,
  images: PageImageGroup[],
): PageImageGroup[] {
  const galleryUrls = collectGalleryUrls(section);
  const widgetByUrl = new Map<string, Element>();
  section.querySelectorAll('.elementor-widget-image').forEach((widget) => {
    const source = widget.querySelector('img')?.getAttribute('src') || '';
    if (source) widgetByUrl.set(source, widget);
  });

  let galleryIndex = 0;
  let coupleIndex = 0;
  let otherIndex = 0;
  const fallbackLabel = /story|cerita/i.test(sectionLabel)
    ? 'Foto Cerita'
    : /rsvp|konfirmasi|kehadiran/i.test(sectionLabel)
      ? 'Foto RSVP'
      : /terima kasih|thank/i.test(sectionLabel)
        ? 'Foto Penutup'
        : 'Foto Section';

  return images.map((group) => {
    const background = group.role === 'background' || (!group.hasImg && group.sources.includes('gaya'));
    const explicitlyNamedBackground = /(?:^|[-_.])(bg|background|backdrop|texture|tekstur|latar|wallpaper|marble)(?:[-_.]|$)/i.test(
      group.name,
    );
    const couplePhoto =
      isCouple &&
      ((group.hasImg && !isOrnament(group)) ||
        (background && categorizeImage(group) === 'foto') ||
        (background && !explicitlyNamedBackground && !isOrnament(group)));

    if (couplePhoto) {
      const widget = group.urls.map((url) => widgetByUrl.get(url)).find(Boolean);
      const heading = widget ? precedingHeading(widget, section) : '';
      const usable = heading && heading.length <= 40 && !/^(and|&|bride|groom)$/i.test(heading);
      const filename = group.name.toLowerCase();
      const subject = /(?:^|[-_.])cpw(?:[-_.]|$)|wanita|perempuan/.test(filename)
        ? 'Wanita'
        : /(?:^|[-_.])cpp(?:[-_.]|$)|pria|laki/.test(filename)
          ? 'Pria'
          : '';
      coupleIndex += 1;
      return {
        ...group,
        role: 'couple',
        label: usable ? `Foto ${heading}` : `Foto Mempelai ${subject || coupleIndex}`,
      };
    }

    if (background) {
      const role: MediaRole = isCover ? 'cover' : 'background';
      return {
        ...group,
        role,
        label: isCover ? 'Gambar Cover' : `Background — ${sectionLabel || `Section ${sectionIndex + 1}`}`,
      };
    }

    if (isGallery && group.urls.some((url) => galleryUrls.has(url))) {
      galleryIndex += 1;
      return { ...group, role: 'gallery', label: `Foto Galeri ${galleryIndex}` };
    }

    if (isOrnament(group)) {
      return { ...group, role: 'ornament', label: `Ornamen — ${group.name}` };
    }

    if (isGallery) {
      galleryIndex += 1;
      return { ...group, role: 'gallery', label: `Foto Galeri ${galleryIndex}` };
    }

    otherIndex += 1;
    return {
      ...group,
      role: group.role || 'other',
      label: group.label && group.label !== group.name ? group.label : `${fallbackLabel} ${otherIndex}`,
    };
  });
}

export function parseSections(html: string, cssText = ''): SectionInfo[] {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const container = doc.querySelector('.elementor') || doc.body;
    const isSection = (element: Element) =>
      element.matches('section.elementor-section, [data-element_type="container"], .e-con, .elementor-section');

    const candidates = [container, ...Array.from(container.querySelectorAll('[data-id]')).filter(isSection)];
    let sections: Element[] = Array.from(container.children).filter(isSection);
    let best = sections.length;
    candidates.forEach((parent) => {
      const kids = Array.from(parent.children).filter(isSection);
      if (kids.length > best) {
        sections = kids;
        best = kids.length;
      }
    });
    const header = container.querySelector('#header');
    let headerRoot = header;
    while (headerRoot?.parentElement && headerRoot.parentElement !== container) {
      headerRoot = headerRoot.parentElement;
    }
    const headerRootIndex = headerRoot ? Array.from(container.children).indexOf(headerRoot) : -1;
    const coverVisual =
      headerRootIndex > 0
        ? Array.from(container.children)
            .slice(0, headerRootIndex)
            .find(
              (candidate) =>
                isSection(candidate) &&
                /the wedding of/i.test(
                  Array.from(candidate.querySelectorAll('.elementor-heading-title'))
                    .map((heading) => cleanText(heading.textContent))
                    .join(' '),
                ) &&
                candidate.querySelector('[data-settings*="background_video_link"], video'),
            )
        : undefined;
    const openingSections = [coverVisual, header].filter(
      (section): section is Element => Boolean(section && !sections.includes(section)),
    );
    sections = [...openingSections, ...sections];

    return sections.map((section, index) => {
      const headings = Array.from(section.querySelectorAll('.elementor-heading-title'))
        .map((heading) => {
          const holder = heading.closest('[data-id]');
          const id = holder?.getAttribute('data-id') || '';
          if (!id) return null;
          return {
            id,
            tag: heading.tagName.toLowerCase(),
            text: cleanText(heading.textContent).slice(0, 120),
          };
        })
        .filter(Boolean) as SectionInfo['headings'];
      appendEditableTextTargets(section, headings);

      const firstHeading = headings[0]?.text;
      const widget = section.querySelector('[data-widget_type]')?.getAttribute('data-widget_type') || '';
      const anchor = section.getAttribute('id') || '';
      const sectionLabel =
        section === coverVisual
          ? 'Cover Visual'
          : section === header
            ? coverVisual
              ? 'Panel Pembuka'
              : 'Cover Pembuka'
            : firstHeading || widget || `Section ${index + 1}`;
      const isCover =
        anchor === 'header' ||
        (index === 0 && headings.some((heading) => /the wedding of/i.test(heading.text)));
      const isCouple =
        anchor === 'couple' || headings.some((heading) => /bride\s*&\s*groom/i.test(heading.text));
      const isGallery =
        anchor === 'gallery' ||
        Boolean(section.querySelector('.e-gallery, .elementor-gallery')) ||
        headings.some((heading) => /our moment/i.test(heading.text));

      const elementIds = new Set<string>();
      const sectionId = section.getAttribute('data-id');
      if (sectionId) elementIds.add(sectionId);
      section.querySelectorAll('[data-id]').forEach((element) => {
        const id = element.getAttribute('data-id');
        if (id) elementIds.add(id);
      });

      // Foto konten (cover, pengantin, galeri) + background CSS yang menempel
      // pada element di section ini, supaya foto cover tidak "hilang" di tab aset.
      const htmlImages = collectPageImages(section.outerHTML);
      const cssBackgrounds = collectCssBackgrounds(cssText, elementIds);
      const images = labelImages(
        section,
        index,
        sectionLabel,
        isCover,
        isCouple,
        isGallery,
        mergePageImageGroups(htmlImages, cssBackgrounds),
      );

      const { videos, audios } = collectSectionMedia(section.outerHTML);
      const labeledVideos = videos.map((group, videoIndex) => ({
        ...group,
        role: 'video' as const,
        label:
          group.label === 'Video Background'
            ? 'Video Background'
            : isGallery
              ? videos.length > 1
                ? `Video Galeri ${videoIndex + 1}`
                : 'Video Galeri'
              : group.label || 'Video Section',
      }));
      const labeledAudios = audios.map((group, audioIndex) => ({
        ...group,
        role: 'music' as const,
        label: audios.length > 1 ? `Musik ${audioIndex + 1}` : 'Musik Undangan',
      }));

      return {
        id: section.getAttribute('data-id') || `section-${index}`,
        label: sectionLabel,
        headings,
        media: [...images, ...labeledVideos, ...labeledAudios],
        links: collectSectionLinks(section, sectionLabel),
      };
    });
  } catch {
    return [];
  }
}
