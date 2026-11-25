import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { MediaRecord } from '../../data/types';
import { describeAsset, parseVideoLink } from '../../utils/mediaLink';
import { assetUrl } from '../../utils/assetUrl';
import { Modal } from './overlay';

const FONT_SAMPLE = 'Aa Bb Cc 0123';

/** Pratinjau aset sesuai tipenya: gambar, video, font, atau dokumen. */
export function MediaPreview({ media, onClose }: { media: MediaRecord; onClose: () => void }) {
  const family = `bydreamy-media-${media.id}`;
  const [fontState, setFontState] = useState<'idle' | 'ready' | 'error'>('idle');
  const source = assetUrl(media.url);
  const video = media.type === 'video' ? parseVideoLink(media.url) : null;

  // Font tidak punya gambar pratinjau, jadi filenya dimuat sementara sebagai @font-face.
  useEffect(() => {
    if (media.type !== 'font' || !source) return;
    setFontState('idle');
    const style = document.createElement('style');
    style.textContent = `@font-face{font-family:'${family}';src:url('${source.replace(/'/g, '%27')}');font-display:swap;}`;
    document.head.appendChild(style);

    let alive = true;
    document.fonts
      .load(`16px '${family}'`)
      .then(() => {
        if (alive) setFontState('ready');
      })
      .catch(() => {
        if (alive) setFontState('error');
      });

    return () => {
      alive = false;
      style.remove();
    };
  }, [family, media.type, source]);

  const body = () => {
    if (!media.url) return <p className="adm-note">Aset ini belum punya URL.</p>;

    if (media.type === 'image') return <img className="adm-preview__image" src={source} alt={media.name} />;

    if (media.type === 'video') {
      if (!video) return <p className="adm-note">Tautan video belum dikenali. Gunakan tautan YouTube, Vimeo, atau file .mp4.</p>;
      if (video.provider === 'file') return <video className="adm-preview__frame" src={video.embedUrl} controls />;
      return (
        <iframe
          className="adm-preview__frame"
          src={video.embedUrl}
          title={media.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (media.type === 'audio') {
      return (
        <div className="adm-preview__audio">
          <audio controls src={source}>
            Browser tidak mendukung pemutar audio.
          </audio>
        </div>
      );
    }

    if (media.type === 'document') {
      if (/\.pdf(?:[?#]|$)/i.test(media.url)) return <iframe className="adm-preview__doc" src={source} title={media.name} />;
      return <p className="adm-note">Format ini tidak bisa dipratinjau di browser. Buka di tab baru lewat tombol di bawah.</p>;
    }

    return (
      <>
        <p className="adm-preview__font" style={fontState === 'ready' ? { fontFamily: `'${family}', serif` } : undefined}>
          {FONT_SAMPLE}
        </p>
        {fontState === 'error' && (
          <p className="adm-note">
            File font tidak bisa dimuat. Pastikan URL-nya benar dan filenya disajikan dengan izin CORS yang tepat.
          </p>
        )}
      </>
    );
  };

  return (
    <Modal
      open
      wide
      title={`Pratinjau — ${media.name}`}
      description={`${describeAsset(media.url)} · ${media.size} · ${media.folder}`}
      onClose={onClose}
      footer={
        <>
          <a className="adm-btn adm-btn--ghost" href={source} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Buka di tab baru
          </a>
          <button type="button" className="adm-btn adm-btn--dark" onClick={onClose}>
            Tutup
          </button>
        </>
      }
    >
      <div className="adm-preview">{body()}</div>
    </Modal>
  );
}
