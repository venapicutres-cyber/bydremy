import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, MessageSquareHeart, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { ConfirmButton, PageHeader } from '../ui';
import { useDatabase } from '../../services/store';
import {
  deleteGuestbookEntry,
  fetchAllGuestbook,
  hasGuestbookBackend,
  subscribeGuestbook,
  type GuestbookEntry,
} from '../../services/guestbook';
import { dateTime } from '../../utils/format';
import { isInvitation } from '../../utils/invitations';

type AttendanceFilter = 'all' | 'present' | 'absent' | 'unknown';

function attendanceLabel(value: string) {
  if (value === 'Hadir') return 'Hadir';
  if (value === 'Tidak Hadir') return 'Tidak Hadir';
  return 'Belum diisi';
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function GuestbookPage() {
  const db = useDatabase();
  const [params, setParams] = useSearchParams();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [attendance, setAttendance] = useState<AttendanceFilter>('all');
  const pageFilter = params.get('page') || 'all';

  const load = useCallback(async () => {
    if (!hasGuestbookBackend) {
      setLoading(false);
      setError('Supabase belum dikonfigurasi, jadi buku tamu belum bisa dimuat.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchAllGuestbook());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Ucapan baru langsung masuk tanpa perlu refresh.
  useEffect(() => {
    if (!hasGuestbookBackend) return;
    return subscribeGuestbook(null, (entry) => {
      setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 1000));
    });
  }, []);

  const pageOf = useCallback(
    (id: number) => db.pages.find((page) => page.id === id),
    [db.pages],
  );

  const pagesWithEntries = useMemo(() => {
    const ids = new Set(entries.map((entry) => entry.pageId));
    return db.pages
      .filter((page) => ids.has(page.id) || isInvitation(page))
      .map((page) => ({ id: String(page.id), label: page.label, route: page.route }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [db.pages, entries]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (pageFilter !== 'all' && String(entry.pageId) !== pageFilter) return false;
      if (attendance === 'present' && entry.attendance !== 'Hadir') return false;
      if (attendance === 'absent' && entry.attendance !== 'Tidak Hadir') return false;
      if (attendance === 'unknown' && entry.attendance) return false;
      if (!needle) return true;
      const page = pageOf(entry.pageId);
      return `${entry.name} ${entry.message} ${page?.label || ''} ${page?.route || ''}`
        .toLowerCase()
        .includes(needle);
    });
  }, [attendance, entries, pageFilter, pageOf, query]);

  const stats = useMemo(() => {
    const present = entries.filter((entry) => entry.attendance === 'Hadir').length;
    const absent = entries.filter((entry) => entry.attendance === 'Tidak Hadir').length;
    return {
      total: entries.length,
      present,
      absent,
      pages: new Set(entries.map((entry) => entry.pageId)).size,
    };
  }, [entries]);

  const setPageFilter = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('page');
    else next.set('page', value);
    setParams(next, { replace: true });
  };

  const removeEntry = async (id: number) => {
    try {
      await deleteGuestbookEntry(id);
      setEntries((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Tamu', 'Kehadiran', 'Ucapan', 'Undangan', 'Waktu'],
      ...filtered.map((entry) => {
        const page = pageOf(entry.pageId);
        return [
          entry.name,
          attendanceLabel(entry.attendance),
          entry.message,
          page ? `${page.label} (${page.route})` : `Halaman #${entry.pageId}`,
          entry.createdAt,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buku-tamu-bydreamy-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Konten"
        title="Buku Tamu & RSVP"
        description="Ucapan dan konfirmasi kehadiran yang dikirim tamu lewat undangan. Data tersimpan di server, bukan di perangkat tamu."
        actions={
          <>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'is-spinning' : undefined} /> Muat ulang
            </button>
            <button type="button" className="adm-btn adm-btn--dark" onClick={exportCsv} disabled={!filtered.length}>
              <Download size={15} /> Ekspor CSV
            </button>
          </>
        }
      />

      <div className="adm-stats adm-stats--compact">
        <div className="adm-mini-stat">
          <span><MessageSquareHeart size={14} /> Total ucapan</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="adm-mini-stat">
          <span>Konfirmasi hadir</span>
          <strong>{stats.present}</strong>
        </div>
        <div className="adm-mini-stat">
          <span>Tidak hadir</span>
          <strong>{stats.absent}</strong>
        </div>
        <div className="adm-mini-stat">
          <span><Users size={14} /> Undangan terisi</span>
          <strong>{stats.pages}</strong>
        </div>
      </div>

      <section className="adm-panel">
        <div className="adm-toolbar">
          <div className="adm-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, ucapan, atau undangan…"
            />
          </div>
          <select className="adm-select" value={pageFilter} onChange={(event) => setPageFilter(event.target.value)}>
            <option value="all">Semua undangan</option>
            {pagesWithEntries.map((page) => (
              <option key={page.id} value={page.id}>
                {page.label}
              </option>
            ))}
          </select>
          <select
            className="adm-select"
            value={attendance}
            onChange={(event) => setAttendance(event.target.value as AttendanceFilter)}
          >
            <option value="all">Semua kehadiran</option>
            <option value="present">Hadir</option>
            <option value="absent">Tidak hadir</option>
            <option value="unknown">Belum diisi</option>
          </select>
          <span className="adm-toolbar__count">{filtered.length} ucapan</span>
        </div>

        {error && <div className="adm-alert adm-alert--error">{error}</div>}

        {!error && !loading && filtered.length === 0 && (
          <div className="adm-empty">
            <h3>Belum ada ucapan</h3>
            <p>
              Ucapan tamu akan muncul di sini setelah mereka mengisi form RSVP pada undangan yang sudah
              dipublikasikan.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Tamu</th>
                  <th>Ucapan</th>
                  <th>Kehadiran</th>
                  <th>Undangan</th>
                  <th>Waktu</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const page = pageOf(entry.pageId);
                  return (
                    <tr key={entry.id}>
                      <td>
                        <div className="adm-person">
                          <span className="adm-avatar adm-avatar--sm">{entry.name.slice(0, 1)}</span>
                          <div>
                            <strong className="adm-person__name">{entry.name || 'Tamu Undangan'}</strong>
                            <small>#{entry.id}</small>
                          </div>
                        </div>
                      </td>
                      <td className="adm-guestbook-message">{entry.message || '—'}</td>
                      <td>
                        <span
                          className={`adm-pill adm-pill--${
                            entry.attendance === 'Hadir'
                              ? 'present'
                              : entry.attendance === 'Tidak Hadir'
                                ? 'absent'
                                : 'draft'
                          }`}
                        >
                          {attendanceLabel(entry.attendance)}
                        </span>
                      </td>
                      <td>
                        {page ? (
                          <>
                            <strong className="adm-guestbook-page">{page.label}</strong>
                            <small className="adm-muted">{page.route}</small>
                          </>
                        ) : (
                          <span className="adm-muted">Halaman #{entry.pageId}</span>
                        )}
                      </td>
                      <td className="adm-muted">{dateTime(entry.createdAt)}</td>
                      <td>
                        <ConfirmButton
                          message={`Hapus ucapan dari "${entry.name || 'Tamu Undangan'}"? Tindakan tidak bisa dibatalkan.`}
                          onConfirm={() => void removeEntry(entry.id)}
                        >
                          <Trash2 size={15} /> Hapus
                        </ConfirmButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
