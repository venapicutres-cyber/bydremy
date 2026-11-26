import { useState } from 'react';
import { Plus, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { useDatabase, createUser, deleteUser, normalizeEmail, updateUser } from '../../services/store';
import type { UserRecord } from '../../data/types';
import { ConfirmButton, Field, Modal, PageHeader, StatusPill } from '../ui';
import { dateTime } from '../../utils/format';

const blank = {
  name: '',
  email: '',
  role: 'editor' as UserRecord['role'],
  status: 'active' as UserRecord['status'],
};

export function UsersPage() {
  const db = useDatabase();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState(blank);

  const startCreate = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const payload = { ...form, email: normalizeEmail(form.email) };
    if (editing) updateUser(editing.id, payload);
    else createUser(payload);
    setOpen(false);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Sistem"
        title="Pengguna"
        description="Daftar kontak tim internal beserta perannya. Akun login dashboard sendiri dikelola lewat Supabase Auth."
        actions={
          <button type="button" className="adm-btn adm-btn--dark" onClick={startCreate}>
            <Plus size={15} /> Pengguna Baru
          </button>
        }
      />

      <div className="adm-grid adm-grid--3">
        <div className="adm-role-card">
          <ShieldCheck size={20} />
          <h3>Admin</h3>
          <p>Akses penuh ke seluruh halaman, pesanan, pengaturan, dan pengguna.</p>
          <span>{db.users.filter((user) => user.role === 'admin').length} pengguna</span>
        </div>
        <div className="adm-role-card">
          <UserCog size={20} />
          <h3>Editor</h3>
          <p>Dapat mengelola undangan yang ditugaskan, buku tamu, dan check-in tanpa mengubah pengguna.</p>
          <span>{db.users.filter((user) => user.role === 'editor').length} pengguna</span>
        </div>
        <div className="adm-role-card">
          <UserCog size={20} />
          <h3>Viewer</h3>
          <p>Hanya dapat melihat data dan preview, tanpa menyimpan perubahan.</p>
          <span>{db.users.filter((user) => user.role === 'viewer').length} pengguna</span>
        </div>
      </div>

      <section className="adm-panel">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Login terakhir</th>
                <th className="is-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {db.users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="adm-person">
                      <span className="adm-avatar adm-avatar--sm">{user.name.slice(0, 1)}</span>
                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="adm-select adm-select--sm"
                      value={user.role}
                      onChange={(event) => updateUser(user.id, { role: event.target.value as UserRecord['role'] })}
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="adm-status-btn"
                      onClick={() => updateUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' })}
                      title="Klik untuk mengganti status"
                    >
                      <StatusPill status={user.status} />
                    </button>
                  </td>
                  <td className="adm-muted">{dateTime(user.lastLogin)}</td>
                  <td className="is-right">
                    <div className="adm-actions">
                      <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openEdit(user)}>
                        Edit
                      </button>
                      <ConfirmButton
                        className="adm-icon-btn adm-icon-btn--danger"
                        message={`Hapus pengguna "${user.name}"?`}
                        onConfirm={() => deleteUser(user.id)}
                      >
                        <Trash2 size={15} />
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={open}
        title={editing ? 'Edit pengguna' : 'Pengguna baru'}
        description="Kontak tim internal. Akun login dashboard dibuat lewat Supabase Auth, bukan dari daftar ini."
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button type="button" className="adm-btn adm-btn--dark" onClick={submit} disabled={!form.name.trim() || !form.email.trim()}>
              {editing ? 'Simpan' : 'Tambahkan'}
            </button>
          </>
        }
      >
        <div className="adm-form-grid">
          <Field label="Nama">
            <input className="adm-input-plain" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Email">
            <input className="adm-input-plain" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label="Peran">
            <select
              className="adm-select"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as UserRecord['role'] })}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              className="adm-select"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as UserRecord['status'] })}
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
