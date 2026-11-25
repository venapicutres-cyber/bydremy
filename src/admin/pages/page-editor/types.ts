import type { PageRecord } from '../../../data/types';
import type { PageImageGroup } from '../../../utils/pageAssets';

export interface SectionHeading {
  id: string;
  tag: string;
  text: string;
  label?: string;
}

export interface SectionLink {
  /** Kunci override: `${widgetId}::link`, unik per widget tombol. */
  id: string;
  widgetId: string;
  /** Label ramah, mis. "Instagram — Angel" atau "Google Maps — Akad". */
  label: string;
  /** Teks tombol bawaan template, mis. "@username". */
  text: string;
  /** URL bawaan template yang ditimpa saat override diisi. */
  href: string;
}

export interface SectionInfo {
  id: string;
  label: string;
  headings: SectionHeading[];
  /** Gambar, video, dan musik yang berada di section ini. */
  media: PageImageGroup[];
  /** Tombol tautan yang bisa diganti URL-nya dari form edit. */
  links: SectionLink[];
}

export interface PageDraft {
  label: string;
  title: string;
  slug: string;
  route: string;
  description: string;
  category: string;
  templateName: string;
  price: string;
  priceCompare: string;
  thumb: string;
  status: PageRecord['status'];
  order: number;
}

export const emptyDraft: PageDraft = {
  label: '',
  title: '',
  slug: '',
  route: '',
  description: '',
  category: '',
  templateName: '',
  price: '',
  priceCompare: '',
  thumb: '',
  status: 'draft',
  order: 99,
};
