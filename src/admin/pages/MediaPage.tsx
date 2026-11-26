import { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Music,
  Play,
  Search,
  Trash2,
  Type,
  Upload,
  Pencil,
} from 'lucide-react';
import {
  useDatabase,
  collectMediaUsage,
  createMedia,
  deleteMedia,
  updateMedia,
  uploadMediaToMedia,
} from '../../services/store';
import type { MediaRecord } from '../../data/types';
import { ConfirmButton, EmptyState, Field, MediaPreview, Modal, PageHeader } from '../ui';
import { shortDate } from '../../utils/format';
import { assetUrl } from '../../utils/assetUrl';
import { describeAsset, detectMediaType, parseVideoLink } from '../../utils/mediaLink';

const TYPE_META: Record<MediaRecord['type'], { label: string; icon: typeof ImageIcon }> = {
  image: { label: 'Gambar', icon: ImageIcon },
  font: { label: 'Font', icon: Type },
  video: { label: 'Video', icon: Film },
  audio: { label: 'Audio', icon: Music },
  document: { label: 'Dokumen', icon: FileText },
};

const blank = { name: '', url: '', type: 'image' as MediaRecord['type'], folder: 'uploads/2026', size: '—' };

const URL_FIELD: Record<MediaRecord['type'], { label: string; hint: string }> = {
  image: { label: 'URL gambar', hint: 'Bisa berupa path /wp-content/... atau URL eksternal.' },
  video: { label: 'Tautan video', hint: 'Tempel tautan YouTube atau Vimeo. Thumbnail YouTube diambil otomatis.' },
  audio: { label: 'URL audio', hint: 'Tautan file .mp3, .wav, .m4a, atau .ogg untuk musik undangan.' },
  font: { label: 'URL file font', hint: '.woff2, .woff, .ttf, atau .otf. Simpan di folder public agar tidak diblokir CORS.' },
  document: { label: 'URL dokumen', hint: '.pdf bisa dipratinjau langsung; format lain dibuka di tab baru.' },
};

export function MediaPage() {
  const db = useDatabase();
  const [tab, setTab] = useState<'all' | MediaRecord['type']>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MediaRecord | null>(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [preview, setPreview] = useState<MediaRecord | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () =>
      db.media
        .filter((item) => (tab === 'all' ? true : item.type === tab))
        .filter((item) => (query ? `${item.name} ${item.url} ${item.folder}`.toLowerCase().includes(query.toLowerCase()) : true)),
    [db.media, tab, query],
  );

  const usage = useMemo(() => collectMediaUsage(db), [db]);

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (item: MediaRecord) => {
    setEditing(item);
    setForm({ name: item.name, url: item.url, type: item.type, folder: item.folder, size: item.size });
    setOpen(true);
  };

  const submit = () => {
    const name = form.name.trim();
    const url = form.url.trim();
    if (!name) {
      window.alert('Nama media wajib diisi.');
      return;
    }
    if (!url) {
      window.alert('URL atau tautan media wajib diisi.');
      return;
    }
    const payload = { ...form, name, url };
    if (editing) updateMedia(editing.id, payload);
    else createMedia(payload);
    setOpen(false);
  };

  const onFile = async (file: File) => {
    const kind: MediaRecord['type'] =
      form.type === 'video' || form.type === 'audio' ? form.type : 'image';
    try {
      setBusy(true);
      const record = await uploadMediaToMedia(file, kind);
      setForm((current) => ({
        ...current,
        name: current.name || file.name,
        url: record.url,
        type: kind,
        size: record.size,
      }));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal mengunggah file.');
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = async (item: MediaRecord) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(item.id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      window.alert('Browser tidak mengizinkan akses clipboard.');
    }
  };

  const counts = db.media.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const videoLink = form.type === 'video' ? parseVideoLink(form.url) : null;
  const canUpload = form.type === 'image' || form.type === 'video' || form.type === 'audio';

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Konten"
        title="Media & Font"
        description="Kelola gambar, video, font, dan dokumen yang dipakai template maupun halaman."
        actions={
          <button type="button" className="adm-btn adm-btn--dark" onClick={openCreate}>
            <Upload size={15} /> Tambah Media
          </button>
        }
      />

      <div className="adm-toolbar">
        <div className="adm-filter-tabs">
          <button type="button" className={tab === 'all' ? 'is-active' : undefined} onClick={() => setTab('all')}>
            Semua ({db.media.length})
          </button>
          {(Object.keys(TYPE_META) as MediaRecord['type'][]).map((type) => {
            const Icon = TYPE_META[type].icon;
            return (
              <button key={type} type="button" className={tab === type ? 'is-active' : undefined} onClick={() => setTab(type)}>
                <Icon size={14} /> {TYPE_META[type].label} ({counts[type] || 0})
              </button>
            );
          })}
        </div>
        <div className="adm-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama file atau folder…" />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Media tidak ditemukan" description="Ubah filter atau tambahkan aset baru." />
      ) : (
        <div className="adm-media-grid">
          {items.map((item) => {
            const Icon = TYPE_META[item.type].icon;
            const used = usage.get(item.id) || [];
            const poster = item.type === 'video' ? parseVideoLink(item.url) : null;
            return (
              <article key={item.id} className="adm-media">
                <div className="adm-media__preview">
                  {item.type === 'image' && item.url ? (
                    <img src={assetUrl(item.url)} alt={item.name} loading="lazy" />
                  ) : poster?.thumbnail ? (
                    <>
                      <img src={poster.thumbnail} alt={item.name} loading="lazy" />
                      <span className="adm-media__badge">
                        <Play size={9} /> {poster.label}
                      </span>
                    </>
                  ) : (
                    <span>
                      <Icon size={26} />
                      {describeAsset(item.url)}
                    </span>
                  )}
                </div>
                <div className="adm-media__body">
                  <strong title={item.name}>{item.name}</strong>
                  <small>
                    {item.size} · {shortDate(item.createdAt)}
                  </small>
                  <code title={item.folder}>{item.folder}</code>
                  <span className="adm-media__usage" title={used.length ? used.join('\n') : undefined}>
                    {used.length ? `Dipakai di ${used.length} tempat` : 'Belum dipakai'}
                  </span>
                </div>
                <div className="adm-media__actions">
                  <button type="button" title="Pratinjau" onClick={() => setPreview(item)}>
                    <Eye size={14} />
                  </button>
                  <button type="button" title="Salin URL" onClick={() => void copyUrl(item)}>
                    {copied === item.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button type="button" title="Edit" onClick={() => openEdit(item)}>
                    <Pencil size={14} />
                  </button>
                  {used.length ? (
                    <button
                      type="button"
                      className="adm-icon-btn"
                      title={`Tidak bisa dihapus — masih dipakai di ${used.length} tempat`}
                      onClick={() =>
                        window.alert(
                          `"${item.name}" masih dipakai di ${used.length} tempat:\n\n- ${used.join('\n- ')}\n\nGanti referensinya dulu sebelum menghapus.`,
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <ConfirmButton
                      className="adm-icon-btn adm-icon-btn--danger"
                      message={`Hapus media "${item.name}"? Tindakan tidak bisa dibatalkan.`}
                      onConfirm={() => deleteMedia(item.id)}
                    >
                      <Trash2 size={14} />
                    </ConfirmButton>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? 'Edit media' : 'Tambah media'}
        description={
          editing
            ? 'Perubahan berlaku setelah disimpan.'
            : 'Tambahkan URL aset dari folder public atau dari luar, atau unggah gambar kecil dari komputer.'
        }
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button type="button" className="adm-btn adm-btn--dark" onClick={submit} disabled={!form.name.trim()}>
              {editing ? 'Simpan' : 'Tambahkan'}
            </button>
          </>
        }
      >
        <div className="adm-form-grid">
          <Field label="Nama file">
            <input className="adm-input-plain" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Tipe">
            <select
              className="adm-select"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as MediaRecord['type'] })}
            >
              {(Object.keys(TYPE_META) as MediaRecord['type'][]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_META[type].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={URL_FIELD[form.type].label} full hint={URL_FIELD[form.type].hint}>
            <input
              className="adm-input-plain"
              value={form.url}
              onChange={(event) => {
                const url = event.target.value;
                setForm((current) => ({ ...current, url, type: detectMediaType(url) ?? current.type }));
              }}
            />
          </Field>
          {form.type === 'video' && form.url && !videoLink && (
            <p className="adm-note adm-field--full">
              Tautan video belum dikenali. Gunakan tautan YouTube, Vimeo, atau file .mp4.
            </p>
          )}
          <Field label="Folder">
            <input
              className="adm-input-plain"
              value={form.folder}
              onChange={(event) => setForm({ ...form, folder: event.target.value })}
            />
          </Field>
          <Field label="Ukuran">
            <input className="adm-input-plain" value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
          </Field>
          {canUpload ? (
            <div className="adm-field adm-field--full">
              <span className="adm-field__label">
                Unggah / ganti file {form.type === 'image' ? 'gambar' : form.type === 'video' ? 'video' : 'audio'}
              </span>
              <button type="button" className="adm-dropzone" disabled={busy} onClick={() => fileRef.current?.click()}>
                <Upload size={18} />
                <span>
                  {busy
                    ? 'Mengunggah file…'
                    : form.name
                      ? form.name
                      : `Pilih file ${form.type === 'image' ? 'gambar' : form.type === 'video' ? 'video' : 'audio'} dari komputer`}
                </span>
              </button>
              <span className="adm-field__hint">
                {form.type === 'image'
                  ? 'JPG, PNG, WebP, GIF, atau SVG. Gambar besar otomatis dikompres ke WebP agar ringan.'
                  : form.type === 'video'
                    ? 'MP4, WebM, atau MOV. Maksimal 40 MB.'
                    : 'MP3, WAV, M4A, atau OGG. Maksimal 40 MB.'}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept={form.type === 'image' ? 'image/*' : form.type === 'video' ? 'video/*' : 'audio/*'}
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onFile(file);
                  event.target.value = '';
                }}
              />
            </div>
          ) : (
            <div className="adm-field adm-field--full">
              <span className="adm-field__hint">
                Font dan dokumen memakai tautan karena penyimpanan browser tidak cukup untuk file besar.
              </span>
            </div>
          )}
          {form.type === 'image' && form.url && <img className="adm-cover-preview" src={assetUrl(form.url)} alt="Pratinjau gambar" />}
          {videoLink?.thumbnail && <img className="adm-cover-preview" src={videoLink.thumbnail} alt="Pratinjau video" />}
          {form.type === 'audio' && form.url && (
            <audio className="adm-audio-preview" controls src={assetUrl(form.url)} />
          )}
        </div>
      </Modal>

      {preview && <MediaPreview media={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
