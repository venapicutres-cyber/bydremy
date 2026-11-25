import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FilePenLine, FolderTree, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useDatabase, createCategory, deleteCategory, updateCategory } from '../../services/store';
import type { CategoryRecord } from '../../data/types';
import { ConfirmButton, Field, MediaPicker, Modal, PageHeader } from '../ui';
import { slugify } from '../../utils/format';
import { mediaRefValue, resolveMediaRef, toMediaRef } from '../../utils/mediaRef';

const blank = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  accent: '#AD8E70',
  cover: '',
};

export function CategoriesPage() {
  const db = useDatabase();
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState(blank);

  const rows = useMemo(
    () =>
      db.categories.map((category) => ({
        ...category,
        actual: db.pages.filter((page) => page.kind === 'template' && page.category === category.id).length,
      })),
    [db.categories, db.pages],
  );

  const startCreate = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
  };

  const startEdit = (category: CategoryRecord) => {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      tagline: category.tagline,
      description: category.description,
      accent: category.accent,
      cover: category.cover,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      tagline: form.tagline,
      description: form.description,
      accent: form.accent,
      cover: form.cover,
    };
    if (editing) updateCategory(editing.id, payload);
    else createCategory({ ...payload, id: payload.slug, count: 0 });
    setOpen(false);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Konten"
        title="Kategori"
        description="Kelompokkan 25 template demo dan atur halaman kategori di katalog."
        actions={
          <button type="button" className="adm-btn adm-btn--dark" onClick={startCreate}>
            <Plus size={15} /> Kategori Baru
          </button>
        }
      />

      <div className="adm-category-grid">
        {rows.map((category) => (
          <article key={category.id} className="adm-category">
            <div className="adm-category__media">
              {category.cover ? <img src={resolveMediaRef(category.cover, db.media)} alt={category.name} /> : <FolderTree size={28} />}
              <span style={{ background: category.accent }} />
            </div>
            <div className="adm-category__body">
              <div className="adm-category__head">
                <div>
                  <h3>{category.name}</h3>
                  <code>/katalog/{category.slug}</code>
                </div>
                <strong className="adm-category__count">{category.actual}</strong>
              </div>
              <p>{category.tagline || 'Belum ada tagline.'}</p>
              <div className="adm-category__actions">
                <Link to={`/katalog/${category.slug}`} target="_blank" className="adm-btn adm-btn--ghost adm-btn--sm">
                  <ArrowUpRight size={14} /> Lihat
                </Link>
                <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => startEdit(category)}>
                  <FilePenLine size={14} /> Edit
                </button>
                <ConfirmButton
                  className="adm-icon-btn adm-icon-btn--danger"
                  message={`Hapus kategori "${category.name}"? Template di dalamnya tidak ikut terhapus.`}
                  onConfirm={() => deleteCategory(category.id)}
                >
                  <Trash2 size={15} />
                </ConfirmButton>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="adm-note">
        Jumlah template dihitung otomatis dari halaman yang bertipe template pada kategori terkait. Kategori kosong tetap
        tampil di katalog sampai dihapus.
      </div>

      <Modal
        open={open}
        wide
        title={editing ? `Edit kategori ${editing.name}` : 'Kategori baru'}
        description="Metadata ini dipakai pada halaman katalog, kartu template, dan filter navigasi."
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button type="button" className="adm-btn adm-btn--dark" onClick={submit} disabled={!form.name.trim()}>
              {editing ? 'Simpan Perubahan' : 'Buat Kategori'}
            </button>
          </>
        }
      >
        <div className="adm-form-grid">
          <Field label="Nama kategori">
            <input
              className="adm-input-plain"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Slug">
            <input
              className="adm-input-plain"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })}
              placeholder="otomatis dari nama"
            />
          </Field>
          <Field label="Tagline" full>
            <input
              className="adm-input-plain"
              value={form.tagline}
              onChange={(event) => setForm({ ...form, tagline: event.target.value })}
              placeholder="Klasik, hangat, dan penuh detail"
            />
          </Field>
          <Field label="Deskripsi" full>
            <textarea
              className="adm-textarea"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Field label="Warna aksen">
            <div className="adm-color">
              <input
                type="color"
                value={form.accent}
                onChange={(event) => setForm({ ...form, accent: event.target.value })}
              />
              <input
                className="adm-input-plain"
                value={form.accent}
                onChange={(event) => setForm({ ...form, accent: event.target.value })}
              />
            </div>
          </Field>
          <Field label="Cover kategori">
            <div className="adm-inline">
              <input
                className="adm-input-plain"
                value={mediaRefValue(form.cover, db.media)}
                onChange={(event) => setForm({ ...form, cover: event.target.value })}
                placeholder="/wp-content/uploads/…"
              />
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setPickerOpen(true)}>
                <ImageIcon size={14} /> Pilih
              </button>
            </div>
          </Field>
          {form.cover && <img className="adm-cover-preview" src={resolveMediaRef(form.cover, db.media)} alt="Cover kategori" />}
        </div>
      </Modal>

      <MediaPicker
        open={pickerOpen}
        selected={form.cover}
        title="Pilih cover kategori"
        description="Cover tampil pada kartu kategori di halaman katalog."
        onClose={() => setPickerOpen(false)}
        onSelect={(url, picked) => setForm((current) => ({ ...current, cover: picked ? toMediaRef(picked.id) : url }))}
      />
    </div>
  );
}
