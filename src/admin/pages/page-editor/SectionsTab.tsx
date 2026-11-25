import { Eye, EyeOff, Image as ImageIcon, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { MediaRecord } from '../../../data/types';
import { uploadImageToMedia, uploadMediaToMedia } from '../../../services/store';
import { resolveImageOverrides } from '../../../utils/imageOverrides';
import type { PageImageGroup } from '../../../utils/pageAssets';
import { MediaPicker } from '../../ui';
import { SectionImages } from './SectionImages';
import type { SectionHeading, SectionInfo } from './types';

interface SectionsTabProps {
  sections: SectionInfo[];
  isNew: boolean;
  hidden: string[];
  setHidden: Dispatch<SetStateAction<string[]>>;
  overrides: Record<string, string>;
  setOverrides: Dispatch<SetStateAction<Record<string, string>>>;
  linkOverrides: Record<string, string>;
  setLinkOverrides: Dispatch<SetStateAction<Record<string, string>>>;
  media: MediaRecord[];
  imageOverrides: Record<string, string>;
  setImageOverrides: Dispatch<SetStateAction<Record<string, string>>>;
  uploadPageId?: number;
}

const HIDDEN_PREFIX = 'hidden::';
const CUSTOM_PREFIX = 'custom::';

const TAG_LABELS: Record<string, string> = {
  h1: 'Judul utama',
  h2: 'Judul',
  h3: 'Subjudul',
  h4: 'Subjudul kecil',
  h5: 'Teks judul',
  h6: 'Teks judul',
  p: 'Paragraf',
  span: 'Teks',
  a: 'Tautan',
};

export function SectionsTab({
  sections,
  isNew,
  hidden,
  setHidden,
  overrides,
  setOverrides,
  linkOverrides,
  setLinkOverrides,
  media,
  imageOverrides,
  setImageOverrides,
  uploadPageId,
}: SectionsTabProps) {
  const [target, setTarget] = useState<PageImageGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<PageImageGroup | null>(null);
  const resolved = useMemo(() => resolveImageOverrides(imageOverrides, media), [imageOverrides, media]);
  const hiddenIds = useMemo(
    () =>
      new Set(
        Object.keys(overrides)
          .filter((id) => id.startsWith(HIDDEN_PREFIX))
          .map((id) => id.slice(HIDDEN_PREFIX.length)),
      ),
    [overrides],
  );

  const addText = (sectionId: string) => {
    const id = `${CUSTOM_PREFIX}${sectionId}::${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setOverrides((current) => ({ ...current, [id]: '' }));
  };

  const removeText = (heading: SectionHeading) => {
    setOverrides((current) => {
      const next = { ...current };
      if (heading.id.startsWith(CUSTOM_PREFIX)) delete next[heading.id];
      else next[`${HIDDEN_PREFIX}${heading.id}`] = '';
      return next;
    });
  };

  const restoreTexts = (ids: string[]) => {
    setOverrides((current) => {
      const next = { ...current };
      ids.forEach((id) => delete next[`${HIDDEN_PREFIX}${id}`]);
      return next;
    });
  };

  const customHeadings = (sectionId: string): SectionHeading[] =>
    Object.entries(overrides)
      .filter(([id]) => id.startsWith(`${CUSTOM_PREFIX}${sectionId}::`))
      .map(([id, text]) => ({ id, tag: 'p', text, label: 'Teks tambahan' }));

  const assign = (group: PageImageGroup, url: string, picked?: MediaRecord) => {
    const value = picked ? `media:${picked.id}` : url;
    setImageOverrides((current) => {
      const next = { ...current };
      group.urls.forEach((key) => {
        next[key] = value;
      });
      return next;
    });
  };

  /** Klik "Ganti" membuka file explorer; file yang dipilih langsung diunggah. */
  const openUpload = (group: PageImageGroup) => {
    if (busy) return;
    uploadTarget.current = group;
    if (fileRef.current) {
      fileRef.current.accept = group.kind === 'video' ? 'video/*' : group.kind === 'audio' ? 'audio/*' : 'image/*';
    }
    fileRef.current?.click();
  };

  const uploadSelected = async (file: File) => {
    const group = uploadTarget.current;
    uploadTarget.current = null;
    if (!group) return;
    try {
      setBusy(true);
      const record =
        group.kind === 'video' || group.kind === 'audio'
          ? await uploadMediaToMedia(file, group.kind, uploadPageId)
          : await uploadImageToMedia(file, uploadPageId);
      assign(group, record.url, uploadPageId ? undefined : record);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal mengunggah file.');
    } finally {
      setBusy(false);
    }
  };

  const reset = (group: PageImageGroup) => {
    setImageOverrides((current) => {
      const next = { ...current };
      group.urls.forEach((key) => {
        delete next[key];
      });
      return next;
    });
  };

  return (
    <div className="adm-sections">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadSelected(file);
          event.target.value = '';
        }}
      />
      {isNew && <p className="adm-note">Section manager tersedia setelah halaman disimpan.</p>}
      {busy && <p className="adm-note">Mengunggah media…</p>}
      {!isNew && sections.length === 0 && (
        <p className="adm-note">Konten halaman ini belum dimuat atau tidak memiliki section Elementor.</p>
      )}
      {!isNew && sections.length > 0 && (
        <p className="adm-note adm-note--compact">
          Ubah teks, tautan tombol, gambar, video, dan musik langsung di section masing-masing. Perubahan berlaku
          setelah tombol <strong>Simpan Perubahan</strong> ditekan.
        </p>
      )}

      {sections.map((section, index) => {
        const isHidden = hidden.includes(section.id);
        const hiddenHere = section.headings.filter((heading) => hiddenIds.has(heading.id));
        const visibleHeadings = [
          ...section.headings.filter((heading) => !hiddenIds.has(heading.id)),
          ...customHeadings(section.id),
        ];
        return (
          <article key={section.id} className={`adm-section ${isHidden ? 'is-hidden' : ''}`}>
            <header>
              <div>
                <span className="adm-section__index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{section.label || 'Section'}</strong>
                </div>
              </div>
              <div className="adm-section__tools">
                <span className="adm-muted">{visibleHeadings.length} teks</span>
                {!isNew && (
                  <button
                    type="button"
                    className="adm-btn adm-btn--sm adm-btn--ghost"
                    onClick={() => addText(section.id)}
                  >
                    <Plus size={14} /> Tambah
                  </button>
                )}
                {hiddenHere.length > 0 && (
                  <button
                    type="button"
                    className="adm-btn adm-btn--sm adm-btn--ghost"
                    onClick={() => restoreTexts(hiddenHere.map((heading) => heading.id))}
                  >
                    <RotateCcw size={14} /> Pulihkan ({hiddenHere.length})
                  </button>
                )}
                <button
                  type="button"
                  className="adm-btn adm-btn--sm adm-btn--ghost"
                  onClick={() =>
                    setHidden((current) =>
                      isHidden ? current.filter((item) => item !== section.id) : [...current, section.id],
                    )
                  }
                >
                  {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  {isHidden ? 'Tampilkan' : 'Sembunyikan'}
                </button>
              </div>
            </header>

            {visibleHeadings.length > 0 && (
              <div className="adm-section__texts">
                {visibleHeadings.map((heading) => {
                  const current = overrides[heading.id] ?? heading.text;
                  const label = heading.label || TAG_LABELS[heading.tag] || heading.tag.toUpperCase();
                  return (
                    <div key={heading.id} className="adm-mini-field adm-mini-field--row">
                      <label className="adm-mini-field__body">
                        <span className="adm-mini-field__head">
                          <em>{label}</em>
                        </span>
                        <input
                          value={current}
                          onChange={(event) =>
                            setOverrides((state) => ({ ...state, [heading.id]: event.target.value }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="adm-btn adm-btn--sm adm-btn--ghost adm-mini-field__delete"
                        title="Hapus teks ini dari undangan"
                        onClick={() => removeText(heading)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {section.links.length > 0 && (
              <div className="adm-section__texts">
                <p className="adm-note adm-note--compact">
                  Isi URL tombol di bawah. Kosongkan untuk memakai tautan bawaan template.
                </p>
                {section.links.map((link) => (
                  <label key={link.id} className="adm-mini-field">
                    <span className="adm-mini-field__head">
                      <em>{link.label}</em>
                      <span className="adm-muted">{link.text}</span>
                    </span>
                    <input
                      type="url"
                      value={linkOverrides[link.id] ?? link.href}
                      placeholder={link.href}
                      onChange={(event) =>
                        setLinkOverrides((state) => {
                          const next = { ...state };
                          const value = event.target.value.trim();
                          if (value) next[link.id] = value;
                          else delete next[link.id];
                          return next;
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            )}

            {section.media.length > 0 && (
              <SectionImages
                groups={section.media}
                resolved={resolved}
                overrides={imageOverrides}
                onUpload={openUpload}
                onPick={setTarget}
                onReset={reset}
              />
            )}

            {visibleHeadings.length === 0 && section.media.length === 0 && section.links.length === 0 && (
              <p className="adm-section__asset-note">
                <ImageIcon size={14} />
                <span>
                  Section ini berisi widget non-teks tanpa gambar. Aset dekoratif halaman tetap bisa diatur di tab{' '}
                  <strong>Gambar &amp; Aset</strong>.
                </span>
              </p>
            )}
          </article>
        );
      })}

      <MediaPicker
        open={Boolean(target)}
        selected={target ? target.urls.map((url) => resolved[url]).find(Boolean) : undefined}
        kind={target?.kind === 'video' || target?.kind === 'audio' ? target.kind : 'image'}
        title={target ? `Ganti ${target.label || target.name}` : 'Pilih media'}
        description="Pilih aset dari Media, unggah file baru, atau tempel URL. Semua varian ukuran aset ini ikut memakai sumber yang sama."
        uploadPageId={uploadPageId}
        onClose={() => setTarget(null)}
        onSelect={(url, picked) => {
          if (target) assign(target, url, picked);
        }}
      />
    </div>
  );
}
