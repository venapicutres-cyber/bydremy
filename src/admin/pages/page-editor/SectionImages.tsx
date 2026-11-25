import { ExternalLink, Film, Image as ImageIcon, Images, Music, RotateCcw } from 'lucide-react';
import type { MediaRole, PageImageGroup } from '../../../utils/pageAssets';
import { assetUrl } from '../../../utils/assetUrl';

interface SectionImagesProps {
  groups: PageImageGroup[];
  resolved: Record<string, string>;
  overrides: Record<string, string>;
  /** Buka file explorer untuk mengunggah gambar/video/musik baru langsung dari komputer. */
  onUpload: (group: PageImageGroup) => void;
  /** Buka pustaka Media untuk memakai aset yang sudah pernah diunggah. */
  onPick: (group: PageImageGroup) => void;
  onReset: (group: PageImageGroup) => void;
}

const ROLE_LABEL: Partial<Record<MediaRole, string>> = {
  cover: 'Cover',
  couple: 'Pengantin',
  gallery: 'Galeri',
  background: 'Background',
  ornament: 'Ornamen',
  video: 'Video',
  music: 'Musik',
};

function replacementOf(group: PageImageGroup, resolved: Record<string, string>): string {
  return group.urls.map((url) => resolved[url]).find(Boolean) || '';
}

function shortUrl(url: string): string {
  if (!url) return '';
  const clean = url.split('?')[0].split('#')[0];
  const parts = clean.split('/').filter(Boolean);
  return parts.slice(-2).join('/') || clean;
}

function providerLabel(group: PageImageGroup): string {
  if (group.kind === 'audio') return 'Audio';
  if (group.provider === 'youtube') return 'YouTube';
  if (group.provider === 'vimeo') return 'Vimeo';
  return 'File video';
}

function Actions({
  group,
  replacement,
  onUpload,
  onPick,
  onReset,
}: {
  group: PageImageGroup;
  replacement: string;
  onUpload: (group: PageImageGroup) => void;
  onPick: (group: PageImageGroup) => void;
  onReset: (group: PageImageGroup) => void;
}) {
  const noun = group.kind === 'video' ? 'video' : group.kind === 'audio' ? 'musik' : 'gambar';
  return (
    <div className="adm-section-image__actions">
      <button type="button" onClick={() => onUpload(group)} title={`Unggah ${noun} baru dari komputer`}>
        {replacement ? 'Ganti lagi' : 'Ganti'}
      </button>
      <button type="button" aria-label={`Pilih ${group.label || group.name} dari Media`} title="Pilih dari Media" onClick={() => onPick(group)}>
        <Images size={11} />
      </button>
      {replacement && (
        <button type="button" aria-label={`Reset ${group.label || group.name}`} onClick={() => onReset(group)}>
          <RotateCcw size={11} />
        </button>
      )}
    </div>
  );
}

function ImageCard({
  group,
  replacement,
  onUpload,
  onPick,
  onReset,
}: {
  group: PageImageGroup;
  replacement: string;
  onUpload: (group: PageImageGroup) => void;
  onPick: (group: PageImageGroup) => void;
  onReset: (group: PageImageGroup) => void;
}) {
  return (
    <figure className={`adm-section-image ${replacement ? 'is-changed' : ''}`}>
      <span className="adm-section-image__preview">
        <img src={assetUrl(replacement || group.preview)} alt={group.label || group.name} loading="lazy" />
        {replacement && <span className="adm-section-image__flag">Diganti</span>}
        {group.role && ROLE_LABEL[group.role] && (
          <span className="adm-section-image__role">{ROLE_LABEL[group.role]}</span>
        )}
      </span>
      <figcaption title={`${group.label || group.name} · ${group.name}`}>{group.label || group.name}</figcaption>
      <Actions group={group} replacement={replacement} onUpload={onUpload} onPick={onPick} onReset={onReset} />
    </figure>
  );
}

function VideoCard({
  group,
  replacement,
  onUpload,
  onPick,
  onReset,
}: {
  group: PageImageGroup;
  replacement: string;
  onUpload: (group: PageImageGroup) => void;
  onPick: (group: PageImageGroup) => void;
  onReset: (group: PageImageGroup) => void;
}) {
  const source = replacement || group.preview || group.urls[0] || '';
  return (
    <article className={`adm-section-media ${replacement ? 'is-changed' : ''}`}>
      <div className="adm-section-media__preview">
        {group.preview ? (
          <img src={assetUrl(group.preview)} alt={group.label || group.name} loading="lazy" />
        ) : (
          <span className="adm-section-media__icon">
            <Film size={20} />
          </span>
        )}
        <span className="adm-section-media__badge">{providerLabel(group)}</span>
        {replacement && <span className="adm-section-image__flag">Diganti</span>}
      </div>
      <div className="adm-section-media__body">
        <strong>{group.label || group.name}</strong>
        <code title={source}>{shortUrl(source)}</code>
        <Actions group={group} replacement={replacement} onUpload={onUpload} onPick={onPick} onReset={onReset} />
      </div>
    </article>
  );
}

function AudioCard({
  group,
  replacement,
  onUpload,
  onPick,
  onReset,
}: {
  group: PageImageGroup;
  replacement: string;
  onUpload: (group: PageImageGroup) => void;
  onPick: (group: PageImageGroup) => void;
  onReset: (group: PageImageGroup) => void;
}) {
  const source = replacement || group.preview || group.urls[0] || '';
  return (
    <article className={`adm-section-media adm-section-media--audio ${replacement ? 'is-changed' : ''}`}>
      <div className="adm-section-media__preview adm-section-media__preview--audio">
        <Music size={20} />
        {replacement && <span className="adm-section-image__flag">Diganti</span>}
      </div>
      <div className="adm-section-media__body">
        <strong>{group.label || group.name}</strong>
        <code title={source}>{shortUrl(source)}</code>
        {source && <audio controls preload="none" src={assetUrl(source)} />}
        <Actions group={group} replacement={replacement} onUpload={onUpload} onPick={onPick} onReset={onReset} />
      </div>
    </article>
  );
}

export function SectionImages({ groups, resolved, overrides, onUpload, onPick, onReset }: SectionImagesProps) {
  const changed = groups.filter((group) => group.urls.some((url) => overrides[url])).length;
  const images = groups.filter((group) => (group.kind || 'image') === 'image');
  const videos = groups.filter((group) => group.kind === 'video');
  const audios = groups.filter((group) => group.kind === 'audio');

  const mainImages = images.filter((group) => group.role !== 'ornament' && group.role !== 'background');
  const extraImages = images.filter((group) => group.role === 'ornament' || group.role === 'background');
  const total = groups.length;

  return (
    <div className="adm-section__images">
      <div className="adm-section__images-head">
        <span>
          <ImageIcon size={13} /> Media di section ini
        </span>
        <span className="adm-muted">
          {total} aset
          {images.length > 0 ? ` · ${images.length} gambar` : ''}
          {videos.length > 0 ? ` · ${videos.length} video` : ''}
          {audios.length > 0 ? ` · ${audios.length} musik` : ''}
          {changed > 0 ? ` · ${changed} diganti` : ''}
        </span>
      </div>

      {mainImages.length > 0 && (
        <div className="adm-section__images-track">
          {mainImages.map((group) => (
            <ImageCard
              key={group.id}
              group={group}
              replacement={replacementOf(group, resolved)}
              onUpload={onUpload}
              onPick={onPick}
              onReset={onReset}
            />
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="adm-section__media-block">
          <div className="adm-section__media-title">
            <Film size={12} /> Video ({videos.length})
          </div>
          <div className="adm-section__media-list">
            {videos.map((group) => (
              <VideoCard
                key={group.id}
                group={group}
                replacement={replacementOf(group, resolved)}
                onUpload={onUpload}
                onPick={onPick}
                onReset={onReset}
              />
            ))}
          </div>
        </div>
      )}

      {audios.length > 0 && (
        <div className="adm-section__media-block">
          <div className="adm-section__media-title">
            <Music size={12} /> Musik ({audios.length})
          </div>
          <div className="adm-section__media-list">
            {audios.map((group) => (
              <AudioCard
                key={group.id}
                group={group}
                replacement={replacementOf(group, resolved)}
                onUpload={onUpload}
                onPick={onPick}
                onReset={onReset}
              />
            ))}
          </div>
        </div>
      )}

      {extraImages.length > 0 && (
        <details className="adm-section__extras">
          <summary>
            <span>
              <ImageIcon size={12} /> Background &amp; ornamen ({extraImages.length})
            </span>
            <em>aset dekoratif — bisa diganti tanpa mengubah foto utama</em>
          </summary>
          <div className="adm-section__images-track">
            {extraImages.map((group) => (
              <ImageCard
                key={group.id}
                group={group}
                replacement={replacementOf(group, resolved)}
                onUpload={onUpload}
                onPick={onPick}
                onReset={onReset}
              />
            ))}
          </div>
        </details>
      )}

      {total > 0 && (
        <p className="adm-section__media-hint">
          <ExternalLink size={11} /> Gambar dekoratif lain tetap tersedia di tab <strong>Gambar &amp; Aset</strong>.
        </p>
      )}
    </div>
  );
}
