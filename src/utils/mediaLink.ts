import type { MediaRecord } from '../data/types';

export type MediaType = MediaRecord['type'];

export interface VideoLink {
  provider: 'youtube' | 'vimeo' | 'file';
  label: string;
  /** URL siap dipasang di `<iframe>` atau `<video src>`. */
  embedUrl: string;
  /** Poster bawaan penyedia; kosong kalau harus disediakan manual. */
  thumbnail: string;
}

const YOUTUBE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/;
const VIDEO_FILE = /\.(mp4|m4v|webm|ogv|ogg|mov)(?:[?#]|$)/i;
const AUDIO_FILE = /\.(mp3|wav|m4a|aac|flac|oga|opus)(?:[?#]|$)/i;
const FONT_FILE = /\.(woff2|woff|ttf|otf|eot)(?:[?#]|$)/i;
const DOC_FILE = /\.(pdf|docx?|xlsx?|pptx?|csv|txt|rtf|zip)(?:[?#]|$)/i;
const IMAGE_FILE = /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)(?:[?#]|$)/i;

/** Mengenali tautan YouTube/Vimeo, atau file video langsung. */
export function parseVideoLink(value: string | undefined): VideoLink | null {
  const url = (value || '').trim();
  if (!url) return null;

  const youtube = url.match(YOUTUBE);
  if (youtube) {
    return {
      provider: 'youtube',
      label: 'YouTube',
      embedUrl: `https://www.youtube.com/embed/${youtube[1]}`,
      thumbnail: `https://img.youtube.com/vi/${youtube[1]}/mqdefault.jpg`,
    };
  }

  const vimeo = url.match(VIMEO);
  if (vimeo) {
    return {
      provider: 'vimeo',
      label: 'Vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
      thumbnail: '',
    };
  }

  if (VIDEO_FILE.test(url)) return { provider: 'file', label: 'File video', embedUrl: url, thumbnail: '' };

  return null;
}

/** Menebak tipe aset dari URL supaya admin tidak perlu memilih tipe secara manual. */
export function detectMediaType(value: string | undefined): MediaType | null {
  const url = (value || '').trim();
  if (!url) return null;
  if (parseVideoLink(url)) return 'video';
  if (AUDIO_FILE.test(url)) return 'audio';
  if (FONT_FILE.test(url)) return 'font';
  if (DOC_FILE.test(url)) return 'document';
  if (url.startsWith('data:image/') || IMAGE_FILE.test(url)) return 'image';
  return null;
}

/** Label singkat untuk kartu media: nama penyedia video, ekstensi file, atau "URL". */
export function describeAsset(value: string | undefined): string {
  const video = parseVideoLink(value);
  if (video) return video.label;
  const path = (value || '').split(/[?#]/)[0];
  const extension = path.match(/\.([A-Za-z0-9]{1,5})$/);
  return extension ? extension[1].toUpperCase() : 'URL';
}
