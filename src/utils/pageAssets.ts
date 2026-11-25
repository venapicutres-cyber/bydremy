export type ImageSourceKind = 'konten' | 'gaya';
export type ImageCategory = 'foto' | 'background' | 'ornamen' | 'logo' | 'lainnya';
export type MediaKind = 'image' | 'video' | 'audio';
export type MediaRole = 'cover' | 'couple' | 'gallery' | 'background' | 'ornament' | 'video' | 'music' | 'other';

export interface PageImageGroup {
  id: string;
  name: string;
  urls: string[];
  preview: string;
  usages: number;
  sources: ImageSourceKind[];
  /** Image is rendered by an <img>/<source> element, not only by CSS. */
  hasImg: boolean;
  /** Jenis aset. Default lama adalah gambar. */
  kind?: MediaKind;
  /** Peran aset di dalam section (cover, foto pengantin, galeri, musik, dll). */
  role?: MediaRole;
  /** Elementor element/widget yang memiliki aset ini. */
  widgetId?: string;
  /** Label ramah yang ditampilkan di editor. */
  label?: string;
  /** Thumbnail/poster untuk video. */
  poster?: string;
  provider?: 'youtube' | 'vimeo' | 'file' | 'audio';
}

interface Bucket {
  urls: Set<string>;
  usages: number;
  sources: Set<ImageSourceKind>;
  hasImg: boolean;
  preview: string;
  previewScore: number;
  widgetId?: string;
  role?: MediaRole;
  label?: string;
  kind?: MediaKind;
  poster?: string;
  provider?: PageImageGroup['provider'];
}

const IMAGE_EXT = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i;
const FONT_EXT = /\.(?:eot|otf|ttf|woff2?)$/i;
const VIDEO_EXT = /\.(?:mp4|m4v|webm|ogv|ogg|mov)$/i;
const AUDIO_EXT = /\.(?:mp3|wav|m4a|aac|flac|oga|opus)$/i;
const YOUTUBE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/;

function cleanUrl(raw: string | null | undefined): string {
  return (raw || '').trim().replace(/&amp;/g, '&');
}

function isAssetUrl(url: string): boolean {
  return Boolean(url) && !/^(data:|#|mailto:|tel:|javascript:)/i.test(url);
}

function stripQuery(url: string): string {
  return url.split('#')[0].split('?')[0];
}

function previewScore(url: string): number {
  const match = url.match(/-(\d+)x(\d+)(?=\.[a-z0-9]+(?:[?#]|$))/i);
  return match ? Number(match[1]) : 100000;
}

function groupKey(url: string): string {
  let path = stripQuery(url);
  try {
    const parsed = new URL(url, window.location.origin);
    path = parsed.origin === window.location.origin ? parsed.pathname : `${parsed.origin}${parsed.pathname}`;
  } catch {
    /* relative path already clean */
  }
  const slash = path.lastIndexOf('/');
  const dir = slash >= 0 ? path.slice(0, slash + 1) : '';
  const file = slash >= 0 ? path.slice(slash + 1) : path;
  return `${dir}${file.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '')}`;
}

function fileName(url: string): string {
  const path = stripQuery(url).replace(/\\/g, '/');
  return path.split('/').pop() || url;
}

function extractCssUrls(text: string): string[] {
  const found: string[] = [];
  const pattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let match = pattern.exec(text);
  while (match) {
    found.push(cleanUrl(match[2]));
    match = pattern.exec(text);
  }
  return found;
}

function srcsetUrls(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function parseSettings(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(
      raw
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>'),
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return cleanUrl(value);
  }
  return '';
}

function videoMeta(url: string): { provider: NonNullable<PageImageGroup['provider']>; thumbnail: string } {
  const youtube = url.match(YOUTUBE);
  if (youtube) {
    return { provider: 'youtube', thumbnail: `https://img.youtube.com/vi/${youtube[1]}/mqdefault.jpg` };
  }
  if (VIMEO.test(url)) return { provider: 'vimeo', thumbnail: '' };
  if (VIDEO_EXT.test(stripQuery(url))) return { provider: 'file', thumbnail: '' };
  return { provider: 'file', thumbnail: '' };
}

function escapeSlashes(url: string): string {
  return url.replace(/\//g, '\\/');
}

function createBucket(url: string, source: ImageSourceKind, viaImg: boolean): Bucket {
  return {
    urls: new Set([url]),
    usages: 1,
    sources: new Set([source]),
    hasImg: viaImg,
    preview: url,
    previewScore: previewScore(url),
    kind: 'image',
  };
}

function addToBucket(bucket: Bucket, url: string, source: ImageSourceKind, viaImg: boolean) {
  bucket.urls.add(url);
  bucket.usages += 1;
  bucket.sources.add(source);
  if (viaImg) bucket.hasImg = true;
  const score = previewScore(url);
  if (score > bucket.previewScore) {
    bucket.preview = url;
    bucket.previewScore = score;
  }
}

function bucketsToGroups(buckets: Map<string, Bucket>): PageImageGroup[] {
  return Array.from(buckets.entries()).map(([id, bucket]) => ({
    id,
    name: id.split('/').pop() || id,
    urls: Array.from(bucket.urls),
    preview: bucket.preview,
    usages: bucket.usages,
    sources: Array.from(bucket.sources),
    hasImg: bucket.hasImg,
    kind: bucket.kind || 'image',
    role: bucket.role,
    widgetId: bucket.widgetId,
    label: bucket.label,
    poster: bucket.poster,
    provider: bucket.provider,
  }));
}

export function collectPageImages(html: string, cssText = ''): PageImageGroup[] {
  const buckets = new Map<string, Bucket>();

  const add = (rawUrl: string, source: ImageSourceKind, viaImg = false) => {
    const url = cleanUrl(rawUrl);
    if (!isAssetUrl(url)) return;
    const path = stripQuery(url);
    if (FONT_EXT.test(path)) return;

    const id = groupKey(url);
    let bucket = buckets.get(id);
    if (!bucket) {
      bucket = createBucket(url, source, viaImg);
      buckets.set(id, bucket);
    } else {
      addToBucket(bucket, url, source, viaImg);
    }
  };

  if (html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('img').forEach((image) => {
        add(image.getAttribute('src') || '', 'konten', true);
        add(image.getAttribute('data-src') || '', 'konten', true);
        add(image.getAttribute('data-thumbnail') || '', 'konten', true);
        srcsetUrls(image.getAttribute('srcset')).forEach((url) => add(url, 'konten', true));
        extractCssUrls(image.getAttribute('style') || '').forEach((url) => add(url, 'konten'));
      });
      doc.querySelectorAll('source[srcset]').forEach((source) => {
        srcsetUrls(source.getAttribute('srcset')).forEach((url) => add(url, 'konten', true));
      });
      doc.querySelectorAll('[data-thumbnail]').forEach((element) => {
        add(element.getAttribute('data-thumbnail') || '', 'konten', true);
      });
      doc.querySelectorAll('[style]').forEach((element) => {
        extractCssUrls(element.getAttribute('style') || '').forEach((url) => add(url, 'konten'));
      });
      doc.querySelectorAll('style').forEach((element) => {
        extractCssUrls(element.textContent || '').forEach((url) => {
          if (IMAGE_EXT.test(stripQuery(url))) add(url, 'konten');
        });
      });
    } catch {
      /* konten tidak bisa diparse, abaikan */
    }
  }

  if (cssText) {
    extractCssUrls(cssText).forEach((url) => {
      if (IMAGE_EXT.test(stripQuery(url))) add(url, 'gaya');
    });
  }

  return bucketsToGroups(buckets);
}

/**
 * Ambil background-image dari stylesheet halaman dan hubungkan ke element
 * Elementor yang berada di dalam section. Ini membuat foto cover yang dipasang
 * lewat CSS (bukan <img>) tetap muncul di section yang tepat.
 */
export function collectCssBackgrounds(cssText: string, elementIds: Set<string>): PageImageGroup[] {
  if (!cssText || elementIds.size === 0) return [];
  const buckets = new Map<string, Bucket>();
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let rule = rulePattern.exec(cssText);
  while (rule) {
    const selector = rule[1];
    const body = rule[2];
    if (!/background(?:-image)?\s*:/i.test(body)) {
      rule = rulePattern.exec(cssText);
      continue;
    }
    const ids = Array.from(selector.matchAll(/\.elementor-element-([a-z0-9]+)/gi)).map((match) => match[1]);
    const target = ids.find((id) => elementIds.has(id));
    if (!target) {
      rule = rulePattern.exec(cssText);
      continue;
    }
    extractCssUrls(body).forEach((url) => {
      if (!isAssetUrl(url) || !IMAGE_EXT.test(stripQuery(url))) return;
      const id = groupKey(url);
      let bucket = buckets.get(id);
      if (!bucket) {
        bucket = createBucket(url, 'gaya', false);
        bucket.widgetId = target;
        bucket.role = 'background';
        buckets.set(id, bucket);
      } else {
        addToBucket(bucket, url, 'gaya', false);
      }
    });
    rule = rulePattern.exec(cssText);
  }
  return bucketsToGroups(buckets);
}

/** Gabungkan hasil deteksi HTML dan CSS tanpa kehilangan metadata role/label. */
export function mergePageImageGroups(...collections: PageImageGroup[][]): PageImageGroup[] {
  const merged = new Map<string, PageImageGroup>();
  collections.flat().forEach((group) => {
    const existing = merged.get(group.id);
    if (!existing) {
      merged.set(group.id, {
        ...group,
        urls: [...group.urls],
        sources: [...group.sources],
      });
      return;
    }
    const urls = new Set([...existing.urls, ...group.urls]);
    const sources = new Set([...existing.sources, ...group.sources]);
    merged.set(group.id, {
      ...existing,
      urls: Array.from(urls),
      sources: Array.from(sources),
      usages: existing.usages + group.usages,
      hasImg: existing.hasImg || group.hasImg,
      preview: existing.preview || group.preview,
      role: existing.role || group.role,
      widgetId: existing.widgetId || group.widgetId,
      label: existing.label || group.label,
      poster: existing.poster || group.poster,
      provider: existing.provider || group.provider,
    });
  });
  return Array.from(merged.values());
}

/**
 * Kumpulkan video dan musik yang berada di dalam markup section. URL disimpan
 * dalam bentuk asli dan bentuk ter-escape (data-settings Elementor) supaya
 * override bisa mengganti keduanya sekaligus.
 */
export function collectSectionMedia(html: string): {
  videos: PageImageGroup[];
  audios: PageImageGroup[];
} {
  const videos = new Map<string, PageImageGroup>();
  const audios = new Map<string, PageImageGroup>();

  if (!html) return { videos: [], audios: [] };

  const addVideo = (rawUrl: string, options: { widgetId?: string; poster?: string; label?: string } = {}) => {
    const url = cleanUrl(rawUrl);
    if (!isAssetUrl(url)) return;
    if (IMAGE_EXT.test(stripQuery(url))) return;
    const meta = videoMeta(url);
    const id = `video:${groupKey(url)}`;
    const urls = new Set([url, escapeSlashes(url)]);
    const existing = videos.get(id);
    if (existing) {
      urls.forEach((value) => {
        if (!existing.urls.includes(value)) existing.urls.push(value);
      });
      existing.usages += 1;
      existing.poster = existing.poster || options.poster;
      existing.widgetId = existing.widgetId || options.widgetId;
      return;
    }
    videos.set(id, {
      id,
      name: fileName(url),
      urls: Array.from(urls),
      preview: options.poster || meta.thumbnail,
      poster: options.poster,
      usages: 1,
      sources: ['konten'],
      hasImg: false,
      kind: 'video',
      role: 'video',
      widgetId: options.widgetId,
      label: options.label || 'Video',
      provider: meta.provider,
    });
  };

  const addAudio = (rawUrl: string, options: { widgetId?: string; label?: string } = {}) => {
    const url = cleanUrl(rawUrl);
    if (!isAssetUrl(url)) return;
    const id = `audio:${groupKey(url)}`;
    const urls = new Set([url, escapeSlashes(url)]);
    const existing = audios.get(id);
    if (existing) {
      urls.forEach((value) => {
        if (!existing.urls.includes(value)) existing.urls.push(value);
      });
      existing.usages += 1;
      existing.widgetId = existing.widgetId || options.widgetId;
      return;
    }
    audios.set(id, {
      id,
      name: fileName(url),
      urls: Array.from(urls),
      preview: url,
      usages: 1,
      sources: ['konten'],
      hasImg: false,
      kind: 'audio',
      role: 'music',
      widgetId: options.widgetId,
      label: options.label || 'Musik Undangan',
      provider: 'audio',
    });
  };

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    doc.querySelectorAll('.elementor-widget-video').forEach((widget) => {
      const settings = parseSettings(widget.getAttribute('data-settings'));
      const widgetId = widget.getAttribute('data-id') || undefined;
      const overlay = widget.querySelector<HTMLElement>('.elementor-custom-embed-image-overlay');
      const poster = overlay ? extractCssUrls(overlay.getAttribute('style') || '')[0] : undefined;
      const url = firstString(settings.youtube_url, settings.vimeo_url, settings.hosted_url, settings.external_url);
      if (url) addVideo(url, { widgetId, poster, label: 'Video' });
      widget.querySelectorAll('iframe[src]').forEach((frame) => {
        addVideo(frame.getAttribute('src') || '', { widgetId, poster, label: 'Video' });
      });
    });

    doc.querySelectorAll('[data-settings]').forEach((element) => {
      const settings = parseSettings(element.getAttribute('data-settings'));
      if (settings.background_background === 'video' || settings.background_video_link) {
        const url = firstString(settings.background_video_link);
        if (url) {
          addVideo(url, {
            widgetId: element.getAttribute('data-id') || undefined,
            label: 'Video Background',
          });
        }
      }
    });

    doc.querySelectorAll('video').forEach((video) => {
      const source =
        video.getAttribute('src') ||
        video.querySelector('source[src]')?.getAttribute('src') ||
        '';
      if (source) {
        addVideo(source, {
          widgetId: video.closest('[data-id]')?.getAttribute('data-id') || undefined,
          label: 'Video Background',
        });
      }
    });

    doc.querySelectorAll('audio').forEach((audio) => {
      const source =
        audio.getAttribute('src') ||
        audio.querySelector('source[src]')?.getAttribute('src') ||
        '';
      if (source) {
        addAudio(source, {
          widgetId: audio.closest('[data-id]')?.getAttribute('data-id') || undefined,
        });
      }
    });

    doc.querySelectorAll('source[src]').forEach((source) => {
      const src = source.getAttribute('src') || '';
      if (AUDIO_EXT.test(stripQuery(src))) {
        addAudio(src, {
          widgetId: source.closest('[data-id]')?.getAttribute('data-id') || undefined,
        });
      }
    });

    doc.querySelectorAll('.elementor-widget-audio').forEach((widget) => {
      const settings = parseSettings(widget.getAttribute('data-settings'));
      const url = firstString(settings.audio_url, settings.hosted_url, settings.link);
      if (url) {
        addAudio(url, { widgetId: widget.getAttribute('data-id') || undefined });
      }
    });
  } catch {
    /* markup tidak bisa diparse, abaikan */
  }

  return { videos: Array.from(videos.values()), audios: Array.from(audios.values()) };
}

export function categorizeImage(group: PageImageGroup): ImageCategory {
  const name = group.name.toLowerCase();
  if (/(logo|icon|ikon|favicon|qrcode|qr-code|(^|[^a-z])qr([^a-z]|$)|marker)/.test(name)) return 'logo';
  if (
    /(foto|photo|picture|gallery|galeri|preview|couple|pengantin|bride|groom|portrait|(^|[-_.])(img|dsc)([-_.]|$)|pexels|unsplash|slide)/.test(
      name,
    )
  ) {
    return 'foto';
  }
  if (/(^|[-_.])(bg|background|backdrop|texture|tekstur|latar|wallpaper|marble)([-_.]|$)/.test(name)) return 'background';
  if (
    /(ornament|ornamen|illustrasi|illustration|(^|[-_.])orn([-_.]|$)|pattern|motif|frame|border|floral|flower|bunga|leaf|daun|corner|divider|wreath|garland|kupu|butterfly|rambat|janur|batik|engraving|amplop|heritage|closing|parralax)/.test(
      name,
    ) ||
    /(^|[-_.])(arch|line|lace|wax|seal|tree)([-_.]|$)/.test(name)
  ) {
    return 'ornamen';
  }
  // Unknown images rendered by <img> are gallery/photo content; CSS-only
  // images without a telling name are almost always backgrounds.
  if (group.hasImg) return 'foto';
  if (group.sources.includes('gaya')) return 'background';
  return 'lainnya';
}

/** Apakah aset ini kemungkinan besar ornamen dekoratif, bukan foto konten. */
export function isOrnament(group: PageImageGroup): boolean {
  if (group.role === 'ornament') return true;
  if (group.role === 'cover' || group.role === 'couple' || group.role === 'gallery') return false;
  if (categorizeImage(group) === 'ornamen') return true;
  return /(kupu|bunga|ornamen|ornament|illustrasi|asset|branch|pillar|frame|texture|tekstur|pattern|motif)/i.test(
    group.name,
  );
}
