import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { createPage, useDatabase } from '../../../services/store';
import { slugify } from '../../../utils/format';
import { mediaRefValue, resolveMediaRef, toMediaRef } from '../../../utils/mediaRef';
import { Field, MediaPicker, Modal } from '../../ui';

export function TemplateCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDatabase();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState({ label: '', category: 'heritage', thumb: '', description: '' });

  const create = () => {
    if (!form.label.trim()) return;
    const slug = slugify(form.label);
    const created = createPage({
      label: form.label,
      title: `DEMO: ${form.label}`,
      slug: `demo-${slug}`,
      route: `/demo-${slug}`,
      description: form.description,
      category: form.category,
      templateName: form.label,
      thumb: form.thumb,
      status: 'draft',
      kind: 'template',
      order: db.pages.filter((page) => page.kind === 'template').length + 1,
    });
    setForm({ label: '', category: 'heritage', thumb: '', description: '' });
    onClose();
    navigate(`/admin/pages/${created.id}`);
  };

  return (
    <>
      <Modal
        open={open}
        title="Tambah template baru"
        description="Template baru mulai sebagai draft dan bisa diedit seperti demo lainnya."
        onClose={onClose}
        footer={
          <>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>
              Batal
            </button>
            <button type="button" className="adm-btn adm-btn--dark" onClick={create} disabled={!form.label.trim()}>
              Buat Template
            </button>
          </>
        }
      >
        <div className="adm-form-grid">
          <Field label="Nama template" full>
            <input
              className="adm-input-plain"
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
              placeholder="Contoh: Larasati"
            />
          </Field>
          <Field label="Kategori">
            <select
              className="adm-select"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {db.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Thumbnail URL">
            <div className="adm-inline">
              <input
                className="adm-input-plain"
                value={mediaRefValue(form.thumb, db.media)}
                onChange={(event) => setForm({ ...form, thumb: event.target.value })}
                placeholder="/wp-content/uploads/…"
              />
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setPickerOpen(true)}>
                <ImageIcon size={14} /> Pilih
              </button>
            </div>
          </Field>
          {form.thumb && <img className="adm-cover-preview" src={resolveMediaRef(form.thumb, db.media)} alt="Preview thumbnail" />}
          <Field label="Deskripsi" full>
            <textarea
              className="adm-textarea"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <MediaPicker
        open={pickerOpen}
        selected={form.thumb}
        title="Pilih thumbnail template"
        description="Thumbnail tampil pada kartu template di halaman katalog."
        onClose={() => setPickerOpen(false)}
        onSelect={(url, picked) => setForm((current) => ({ ...current, thumb: picked ? toMediaRef(picked.id) : url }))}
      />
    </>
  );
}
