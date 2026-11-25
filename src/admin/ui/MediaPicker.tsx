import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Film, Image as ImageIcon, Music, Search, Upload } from 'lucide-react';
import type { MediaRecord } from '../../data/types';
import { uploadMediaToMedia, useDatabase } from '../../services/store';
import { mediaRefValue } from '../../utils/mediaRef';
import { assetUrl } from '../../utils/assetUrl';
import { parseVideoLink } from '../../utils/mediaLink';
import type { MediaKind } from '../../utils/pageAssets';
import { Modal } from './overlay';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, media?: MediaRecord) => void;
  title?: string;
  description?: string;
  selected?: string;
  /** Jenis media yang dicari: gambar, video, atau musik. */
  kind?: MediaKind;
  /** Batasi unggahan ke direktori undangan editor ini. */
  uploadPageId?: number;
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  title = 'Pilih media',
  description = 'Gunakan aset dari Media, unggah file baru, atau tempel URL.',
  selected,
  kind = 'image',
  uploadPageId,
}: MediaPickerProps) {
  const db = useDatabase();
  const [query, setQuery] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setUrl('');
    }
  }, [open]);

  const items = useMemo(
    () =>
      db.media
        .filter((item) => item.type === kind)
        .filter((item) => (query ? `${item.name} ${item.url} ${item.folder}`.toLowerCase().includes(query.toLowerCase()) : true)),
    [db.media, query, kind],
  );

  const noun = kind === 'video' ? 'video' : kind === 'audio' ? 'musik' : 'gambar';
  const accept = kind === 'video' ? 'video/*' : kind === 'audio' ? 'audio/*' : 'image/*';

  // `selected` bisa berupa URL langsung atau token `media:<id>`.
  const selectedUrl = mediaRefValue(selected, db.media);

  const choose = (value: string, media?: MediaRecord) => {
    onSelect(value, media);
    onClose();
  };

  const upload = async (file: File) => {
    try {
      setBusy(true);
      const record = await uploadMediaToMedia(file, kind, uploadPageId);
      choose(record.url, uploadPageId ? undefined : record);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : `Gagal mengunggah ${noun}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      wide
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>
          Batal
        </button>
      }
    >
      <div className="adm-picker">
        <div className="adm-picker__tools">
          <div className="adm-search">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau folder…" />
          </div>
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> {busy ? 'Mengunggah…' : `Unggah ${noun}`}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = '';
            }}
          />
        </div>

        {items.length === 0 ? (
          <p className="adm-note">
            Belum ada media {noun} yang cocok. Unggah file atau tempel URL di bawah.
          </p>
        ) : (
          <div className="adm-picker__grid">
            {items.map((item) => {
              const isSelected = selectedUrl === item.url;
              const video = kind === 'video' ? parseVideoLink(item.url) : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`adm-picker__item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => choose(item.url, item)}
                  title={item.url}
                >
                  {kind === 'image' ? (
                    <img src={assetUrl(item.url)} alt={item.name} loading="lazy" />
                  ) : video?.thumbnail ? (
                    <img src={video.thumbnail} alt={item.name} loading="lazy" />
                  ) : (
                    <span className="adm-picker__icon">
                      {kind === 'video' ? <Film size={22} /> : <Music size={22} />}
                    </span>
                  )}
                  <span>{item.name}</span>
                  {isSelected && (
                    <em>
                      <Check size={12} />
                    </em>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="adm-picker__url">
          <span className="adm-field__label">
            {kind === 'video' ? <Film size={12} /> : kind === 'audio' ? <Music size={12} /> : <ImageIcon size={12} />} URL aset
          </span>
          <div className="adm-inline">
            <input
              className="adm-input-plain"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="/wp-content/uploads/… atau https://…"
            />
            <button type="button" className="adm-btn adm-btn--dark adm-btn--sm" disabled={!url.trim()} onClick={() => choose(url.trim())}>
              Pakai URL
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
