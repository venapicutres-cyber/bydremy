import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ChevronDown,
  Flower2,
  Image as ImageIcon,
  Images,
  Layers,
  QrCode,
  RotateCcw,
  Search,
  type LucideIcon,
} from 'lucide-react';
import type { MediaRecord } from '../../../data/types';
import { uploadImageToMedia } from '../../../services/store';
import { resolveImageOverrides } from '../../../utils/imageOverrides';
import { categorizeImage, type ImageCategory, type PageImageGroup } from '../../../utils/pageAssets';
import { assetUrl } from '../../../utils/assetUrl';
import { MediaPicker } from '../../ui';

interface ImagesTabProps {
  groups: PageImageGroup[];
  media: MediaRecord[];
  loading: boolean;
  overrides: Record<string, string>;
  setOverrides: Dispatch<SetStateAction<Record<string, string>>>;
}

type Filter = 'all' | 'changed' | 'original';

const CATEGORY_ORDER: ImageCategory[] = ['foto', 'background', 'ornamen', 'logo', 'lainnya'];

const CATEGORY_META: Record<ImageCategory, { label: string; hint: string; icon: LucideIcon }> = {
  foto: { label: 'Foto & Galeri', hint: 'Foto pasangan, galeri, dan mask foto', icon: Images },
  background: { label: 'Background & Tekstur', hint: 'Latar halaman, tekstur, dan pola penuh', icon: Layers },
  ornamen: { label: 'Ornamen & Bingkai', hint: 'Bunga, pattern, frame, dan garis dekoratif', icon: Flower2 },
  logo: { label: 'Logo, Ikon & QR', hint: 'Logo, ikon antarmuka, dan aset QR', icon: QrCode },
  lainnya: { label: 'Aset Lainnya', hint: 'Gambar yang belum masuk kategori khusus', icon: ImageIcon },
};

export function ImagesTab({ groups, media, loading, overrides, setOverrides }: ImagesTabProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [target, setTarget] = useState<PageImageGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<PageImageGroup | null>(null);
  const resolved = useMemo(() => resolveImageOverrides(overrides, media), [overrides, media]);

  const rows = useMemo(
    () =>
      groups
        .map((group) => ({
          group,
          replacement: group.urls.map((url) => resolved[url]).find(Boolean) || '',
          changed: group.urls.some((url) => overrides[url]),
        }))
        .filter(({ group, changed }) => {
          if (filter === 'changed' && !changed) return false;
          if (filter === 'original' && changed) return false;
          if (!query) return true;
          const haystack = `${group.name} ${group.id}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        }),
    [groups, resolved, overrides, query, filter],
  );

  const sections = useMemo(() => {
    const buckets = new Map<ImageCategory, typeof rows>();
    rows.forEach((row) => {
      const key = categorizeImage(row.group);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(row);
      else buckets.set(key, [row]);
    });
    return CATEGORY_ORDER.filter((key) => buckets.has(key)).map((key) => ({
      key,
      ...CATEGORY_META[key],
      items: (buckets.get(key) || []).sort(
        (a, b) => b.group.usages - a.group.usages || a.group.name.localeCompare(b.group.name),
      ),
    }));
  }, [rows]);

  const changedGroups = groups.filter((group) => group.urls.some((url) => overrides[url]));

  const assign = (group: PageImageGroup, url: string, picked?: MediaRecord) => {
    const value = picked ? `media:${picked.id}` : url;
    setOverrides((current) => {
      const next = { ...current };
      group.urls.forEach((key) => {
        next[key] = value;
      });
      return next;
    });
  };

  const reset = (group: PageImageGroup) => {
    setOverrides((current) => {
      const next = { ...current };
      group.urls.forEach((key) => {
        delete next[key];
      });
      return next;
    });
  };

  const resetAll = () => {
    if (!window.confirm(`Kembalikan ${changedGroups.length} gambar ke aslinya?`)) return;
    setOverrides({});
  };

  /** Klik "Ganti gambar" membuka file explorer; file yang dipilih langsung diunggah. */
  const openUpload = (group: PageImageGroup) => {
    if (busy) return;
    uploadTarget.current = group;
    fileRef.current?.click();
  };

  const uploadSelected = async (file: File) => {
    const group = uploadTarget.current;
    uploadTarget.current = null;
    if (!group) return;
    try {
      setBusy(true);
      const record = await uploadImageToMedia(file);
      assign(group, record.url, record);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal mengunggah gambar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-images">
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
      {busy && <p className="adm-note">Mengunggah gambar…</p>}
      <div className="adm-images__head">
        <div>
          <h3>Gambar &amp; aset halaman</h3>
          <p className="adm-muted">
            Terdeteksi dari konten HTML dan stylesheet demo, termasuk background dan galeri. Tombol{' '}
            <strong>Ganti gambar</strong> membuka explorer — file yang dipilih dikompres, diunggah ke Storage, dan
            tersimpan di menu Media. Perubahan berlaku setelah tombol <strong>Simpan Perubahan</strong> ditekan.
          </p>
        </div>
        <div className="adm-images__stats">
          <span className="adm-images__count">
            <ImageIcon size={14} /> {groups.length} gambar
          </span>
          <span className="adm-images__count adm-images__count--accent">{changedGroups.length} diganti</span>
          {changedGroups.length > 0 && (
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={resetAll}>
              <RotateCcw size={14} /> Reset semua
            </button>
          )}
        </div>
      </div>

      <div className="adm-images__toolbar">
        <div className="adm-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama gambar…" />
        </div>
        <div className="adm-filter-tabs">
          <button type="button" className={filter === 'all' ? 'is-active' : undefined} onClick={() => setFilter('all')}>
            Semua ({groups.length})
          </button>
          <button type="button" className={filter === 'changed' ? 'is-active' : undefined} onClick={() => setFilter('changed')}>
            Diganti ({changedGroups.length})
          </button>
          <button type="button" className={filter === 'original' ? 'is-active' : undefined} onClick={() => setFilter('original')}>
            Asli ({groups.length - changedGroups.length})
          </button>
        </div>
      </div>

      {loading && <p className="adm-note">Memindai stylesheet halaman…</p>}

      {!loading && groups.length === 0 && (
        <p className="adm-note">Belum ada gambar terdeteksi pada halaman ini.</p>
      )}

      {sections.map((section) => {
        const SectionIcon = section.icon;
        return (
          <details className="adm-image-section" key={section.key} open>
            <summary className="adm-image-section__head">
              <span className="adm-image-section__icon">
                <SectionIcon size={15} />
              </span>
              <span className="adm-image-section__text">
                <strong>{section.label}</strong>
                <small>{section.hint}</small>
              </span>
              <span className="adm-image-section__count">{section.items.length} gambar</span>
              <ChevronDown size={15} className="adm-image-section__chevron" />
            </summary>
            <div className="adm-image-list">
              {section.items.map(({ group, replacement }) => (
                <article key={group.id} className={`adm-image-row ${replacement ? 'is-changed' : ''}`}>
                  <div className="adm-image-row__preview">
                    <img src={assetUrl(replacement || group.preview)} alt={group.name} loading="lazy" />
                    {replacement && <span className="adm-image-row__flag">Diganti</span>}
                  </div>
                  <div className="adm-image-row__body">
                    <strong title={group.id}>{group.name}</strong>
                    <code title={group.id}>{group.id}</code>
                    <div className="adm-image-row__badges">
                      {group.sources.map((source) => (
                        <span key={source}>{source === 'gaya' ? 'CSS' : 'Konten'}</span>
                      ))}
                      {group.urls.length > 1 && <span>{group.urls.length} varian</span>}
                      <span>{group.usages} pemakaian</span>
                    </div>
                    {replacement && (
                      <small className="adm-image-row__replacement">
                        Diganti dengan:{' '}
                        <code title={replacement}>{replacement.startsWith('data:') ? 'Gambar unggahan' : replacement}</code>
                      </small>
                    )}
                  </div>
                  <div className="adm-image-row__actions">
                    <button
                      type="button"
                      className="adm-btn adm-btn--dark adm-btn--sm"
                      disabled={busy}
                      title="Unggah gambar baru dari komputer"
                      onClick={() => openUpload(group)}
                    >
                      {replacement ? 'Ganti lagi' : 'Ganti gambar'}
                    </button>
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setTarget(group)}>
                      <Images size={13} /> Pustaka
                    </button>
                    {replacement && (
                      <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => reset(group)}>
                        <RotateCcw size={13} /> Reset
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </details>
        );
      })}

      {rows.length === 0 && groups.length > 0 && (
        <p className="adm-note">Tidak ada gambar yang cocok dengan filter.</p>
      )}

      <MediaPicker
        open={Boolean(target)}
        selected={target ? target.urls.map((url) => resolved[url]).find(Boolean) : undefined}
        title={target ? `Ganti ${target.name}` : 'Pilih gambar'}
        description="Pilih aset dari Media, unggah gambar (otomatis dikompres), atau tempel URL. Semua varian ukuran gambar ini akan memakai aset yang sama."
        onClose={() => setTarget(null)}
        onSelect={(url, picked) => {
          if (target) assign(target, url, picked);
        }}
      />
    </div>
  );
}
