import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import {
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  Download,
  Keyboard,
  MessageCircleHeart,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Users,
  XCircle,
} from 'lucide-react';
import { Card, EmptyState, PageHeader, StatCard } from '../ui';
import { useAdminSession } from '../auth';
import {
  checkInByToken,
  fetchCheckins,
  fetchGuestbook,
  manualCheckIn,
  subscribeCheckins,
  subscribeGuestbook,
  type Checkin,
  type CheckinResult,
  type GuestbookEntry,
} from '../../services/guestbook';
import { useDatabase } from '../../services/store';
import { dateTime } from '../../utils/format';
import { isInvitation } from '../../utils/invitations';
import { whatsappLink } from '../../utils/nota';
import {
  checkInQrDataUrl,
  checkInUrl,
  downloadDataUrl,
  downloadText,
  extractCheckInToken,
  safeFileName,
} from '../../utils/qr';

const IDENTITY_OPTIONS = ['Keluarga', 'Teman', 'Rekan Kerja', 'Undangan Cetak', 'Lainnya'];
type Tab = 'qr' | 'manual';

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function thankYouText(name: string): string {
  return `Assalamu'alaikum ${name}, terima kasih sudah hadir di acara kami. Semoga hari ini membawa berkah untuk kita semua. — bydreamy`;
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function QrThumb({ token, name, size = 88 }: { token: string; name: string; size?: number }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) return () => undefined;
    void checkInQrDataUrl(token, size * 3)
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, size]);

  if (!src) return <span className="adm-qr-thumb__loading">QR</span>;
  return <img className="adm-qr-thumb" src={src} alt={`QR check-in ${name}`} width={size} height={size} />;
}

export function CheckInPage() {
  const db = useDatabase();
  const session = useAdminSession();
  const readOnly = session?.role === 'viewer';
  const [params, setParams] = useSearchParams();

  const invitations = useMemo(() => {
    const list = db.pages.filter(isInvitation);
    return session?.role === 'admin' ? list : list.filter((page) => page.id === session?.pageId);
  }, [db.pages, session]);

  const [pageId, setPageId] = useState<number>(() => Number(params.get('page')) || session?.pageId || 0);
  const [guests, setGuests] = useState<GuestbookEntry[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<Tab>('qr');
  const [tokenInput, setTokenInput] = useState('');
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState(IDENTITY_OPTIONS[0]);
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);
  const [thankYouPhone, setThankYouPhone] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const processingRef = useRef(false);
  const loadVersionRef = useRef(0);

  const activePage = invitations.find((page) => page.id === pageId);

  useEffect(() => {
    if (!pageId && invitations.length) setPageId(invitations[0].id);
  }, [invitations, pageId]);

  useEffect(() => {
    const fromUrl = params.get('token');
    if (!fromUrl) return;
    setTokenInput(fromUrl);
    setTab('qr');
    setNotice('QR terdeteksi. Periksa token lalu tekan Check-In.');
  }, [params]);

  const load = useCallback(async () => {
    // Realtime events and manual refreshes can overlap. Hanya respons permintaan
    // terakhir yang boleh menimpa tabel agar status check-in tidak mundur.
    const version = ++loadVersionRef.current;
    if (!pageId) {
      setGuests([]);
      setCheckins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [guestRows, checkinRows] = await Promise.all([
        fetchGuestbook(pageId, 1000),
        fetchCheckins(pageId, 1000),
      ]);
      if (version !== loadVersionRef.current) return;
      setGuests(guestRows);
      setCheckins(checkinRows);
    } catch (caught) {
      if (version === loadVersionRef.current) setError(errorText(caught));
    } finally {
      if (version === loadVersionRef.current) setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const stopScanning = subscribeCheckins(() => {
      void load();
    });
    const stopGuests = subscribeGuestbook(pageId || null, () => {
      void load();
    });
    return () => {
      stopScanning();
      stopGuests();
    };
  }, [load, pageId]);

  useEffect(
    () => () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    },
    [],
  );

  const applyResult = (result: CheckinResult) => {
    // Tampilkan hasil seketika, lalu biarkan `load()` menyelaraskan dengan server.
    const optimistic: Checkin = {
      entryId: result.id,
      token: result.checkinToken || '',
      identityCategory: result.identityCategory,
      phone: result.phone,
      checkedInAt: result.checkedInAt,
      method: result.method,
      note: '',
      createdAt: result.createdAt,
      entry: result,
    };
    setCheckins((current) => [optimistic, ...current.filter((item) => item.entryId !== result.id)]);
    setGuests((current) => {
      const exists = current.some((item) => item.id === result.id);
      const merged: GuestbookEntry = { ...result, checkinToken: result.checkinToken };
      return exists ? current.map((item) => (item.id === result.id ? merged : item)) : [merged, ...current];
    });
    setLastResult(result);
    setThankYouPhone(result.phone || '');
    setThankYouMessage(thankYouText(result.name));
    setNotice(
      result.alreadyCheckedIn
        ? `${result.name} sudah check-in sebelumnya (${dateTime(result.checkedInAt)}).`
        : `Check-in berhasil: ${result.name}.`,
    );
    void load();
  };

  const runToken = async (value: string, method: 'qr' | 'manual' = 'qr') => {
    const token = extractCheckInToken(value);
    if (!token) {
      setError('Token QR tidak dikenali. Tempelkan URL QR atau kode UUID-nya.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await checkInByToken(token, method);
      applyResult(result);
      setParams({}, { replace: true });
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  const stopScan = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }, []);

  const startScan = async () => {
    if (readOnly) return;
    setError('');
    setScanError('');
    try {
      if (!videoRef.current) return;
      const reader = readerRef.current ?? new BrowserQRCodeReader();
      readerRef.current = reader;
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result || processingRef.current) return;
          const token = extractCheckInToken(result.getText());
          if (!token) return;
          processingRef.current = true;
          setTokenInput(token);
          stopScan();
          void runToken(token).finally(() => {
            processingRef.current = false;
          });
        },
      );
      controlsRef.current = controls;
      setScanning(true);
    } catch (caught) {
      setScanError(
        `Kamera tidak bisa dibuka: ${errorText(caught)}. Gunakan kolom token di bawah atau input manual.`,
      );
    }
  };

  const submitManual = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || !pageId || !name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const result = await manualCheckIn(pageId, name.trim(), identity, phone.trim());
      applyResult(result);
      setName('');
      setPhone('');
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  const downloadQr = async (token: string, guestName: string) => {
    try {
      const url = await checkInQrDataUrl(token);
      downloadDataUrl(url, `qr-${safeFileName(guestName)}.png`);
    } catch (caught) {
      setError(`Gagal membuat QR: ${errorText(caught)}`);
    }
  };

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(checkInUrl(token));
      setNotice('Tautan check-in disalin ke clipboard.');
    } catch {
      setNotice('Tautan: ' + checkInUrl(token));
    }
  };

  const checkinByEntry = useMemo(
    () => new Map(checkins.map((checkin) => [checkin.entryId, checkin])),
    [checkins],
  );
  const checkedCount = checkins.filter((checkin) => checkin.checkedInAt).length;
  const totalCount = guests.length;
  const percent = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0;

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return guests.filter(
      (guest) => !query || guest.name.toLowerCase().includes(query) || guest.attendance.toLowerCase().includes(query),
    );
  }, [guests, search]);

  const exportCsv = () => {
    const header = ['Undangan', 'Nama Tamu', 'Kehadiran', 'Kategori Identitas', 'Metode', 'Waktu Check-In', 'WhatsApp', 'Token QR'];
    const rows = guests.map((guest) => {
      const checkin = checkinByEntry.get(guest.id);
      return [
        activePage?.title || String(pageId),
        guest.name,
        guest.attendance || '-',
        checkin?.identityCategory || '-',
        checkin?.method || '-',
        checkin?.checkedInAt ? dateTime(checkin.checkedInAt) : '-',
        checkin?.phone || '-',
        checkin?.token || '-',
      ];
    });
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    downloadText(csv, `data-tamu-${safeFileName(activePage?.title || `undangan-${pageId}`)}.csv`, 'text/csv;charset=utf-8');
    setNotice(`Data ${guests.length} tamu diekspor ke CSV.`);
  };

  const switchTab = (next: Tab) => {
    if (next === 'qr' && tab === 'qr') stopScan();
    if (next === 'manual' && scanning) stopScan();
    setTab(next);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: Tab) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: Tab = current === 'qr' ? 'manual' : 'qr';
    switchTab(next);
    document.getElementById(`adm-checkin-tab-${next}`)?.focus();
  };

  return (
    <div className="adm-checkin">
      <PageHeader
        eyebrow="Digital Guestbook"
        title="Check-In Tamu"
        description="Scan QR pribadi atau input manual. Data kehadiran muncul realtime dan bisa diekspor saat acara selesai."
        actions={
          <>
            <a className="adm-btn adm-btn--ghost" href="/layar-sapa" target="_blank" rel="noreferrer">
              <Smartphone size={15} /> Layar Sapa
            </a>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={15} /> Segarkan
            </button>
          </>
        }
      />

      <div className="adm-checkin__toolbar">
        <label className="adm-field adm-checkin__select">
          <span className="adm-field__label">Undangan</span>
          <select value={pageId || ''} onChange={(event) => setPageId(Number(event.target.value))}>
            {invitations.map((page) => (
              <option key={page.id} value={page.id}>
                {page.title || page.label}
              </option>
            ))}
          </select>
        </label>
        <span className="adm-checkin__toolbar-note">
          {activePage ? activePage.route : 'Pilih undangan untuk mulai check-in.'}
        </span>
        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={exportCsv} disabled={!guests.length}>
          <Download size={14} /> Ekspor CSV
        </button>
      </div>

      {error && (
        <div className="adm-alert adm-alert--error" role="alert">
          <XCircle size={16} />
          <span>{error}</span>
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setError('')}>
            Tutup
          </button>
        </div>
      )}
      {notice && (
        <div className="adm-alert adm-alert--success" role="status">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setNotice('')}>
            Tutup
          </button>
        </div>
      )}

      <div className="adm-checkin__stats">
        <StatCard label="Total Tamu" value={totalCount} meta="RSVP + input manual" icon={<Users size={16} />} />
        <StatCard label="Sudah Check-In" value={checkedCount} meta="Terverifikasi realtime" icon={<Check size={16} />} tone="green" />
        <StatCard label="Belum Check-In" value={Math.max(totalCount - checkedCount, 0)} meta="Menunggu kedatangan" icon={<Clock3 size={16} />} tone="gold" />
        <StatCard label="Kehadiran" value={`${percent}%`} meta="Dari total tamu" icon={<ClipboardList size={16} />} />
      </div>

      <div className="adm-checkin__grid">
        <Card title="Check-In Tamu" subtitle="Pilih metode sesuai kondisi di lokasi acara.">
          <div className="adm-checkin-tabs" role="tablist" aria-label="Metode check-in">
            <button
              type="button"
              role="tab"
              id="adm-checkin-tab-qr"
              aria-selected={tab === 'qr'}
              aria-controls="adm-checkin-panel-qr"
              tabIndex={tab === 'qr' ? 0 : -1}
              className={tab === 'qr' ? 'is-active' : ''}
              onClick={() => switchTab('qr')}
              onKeyDown={(event) => onTabKeyDown(event, 'qr')}
            >
              <QrCode size={15} /> Scan QR Code
            </button>
            <button
              type="button"
              role="tab"
              id="adm-checkin-tab-manual"
              aria-selected={tab === 'manual'}
              aria-controls="adm-checkin-panel-manual"
              tabIndex={tab === 'manual' ? 0 : -1}
              className={tab === 'manual' ? 'is-active' : ''}
              onClick={() => switchTab('manual')}
              onKeyDown={(event) => onTabKeyDown(event, 'manual')}
            >
              <Keyboard size={15} /> Input Manual
            </button>
          </div>

          <div role="tabpanel" id="adm-checkin-panel-qr" aria-labelledby="adm-checkin-tab-qr" hidden={tab !== 'qr'}>
            <div className="adm-checkin__scanner">
              <video ref={videoRef} playsInline muted aria-label="Pratinjau kamera pemindai QR" />
              {!scanning && (
                <div className="adm-checkin__scanner-idle">
                  <Camera size={28} />
                  <span>Aktifkan kamera untuk memindai QR tamu</span>
                </div>
              )}
            </div>
            <div className="adm-checkin__scan-actions">
              {scanning ? (
                <button type="button" className="adm-btn adm-btn--ghost" onClick={stopScan} disabled={readOnly}>
                  <XCircle size={15} /> Hentikan Kamera
                </button>
              ) : (
                <button type="button" className="adm-btn adm-btn--dark" onClick={() => void startScan()} disabled={readOnly}>
                  <Camera size={15} /> Aktifkan Kamera
                </button>
              )}
              <span>Kamera tidak tersedia? Tempel token QR di bawah.</span>
            </div>
            {scanError && <p className="adm-checkin__hint adm-checkin__hint--error">{scanError}</p>}
            <form
              className="adm-checkin__token-form"
              onSubmit={(event) => {
                event.preventDefault();
                void runToken(tokenInput);
              }}
            >
              <label className="adm-field">
                <span className="adm-field__label">Token QR / tautan check-in</span>
                <input
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Tempel URL QR atau kode UUID"
                  autoComplete="off"
                  disabled={readOnly}
                />
              </label>
              <button type="submit" className="adm-btn adm-btn--dark" disabled={readOnly || busy || !tokenInput.trim()}>
                <CheckCircle2 size={15} /> Check-In
              </button>
            </form>
          </div>

          <div role="tabpanel" id="adm-checkin-panel-manual" aria-labelledby="adm-checkin-tab-manual" hidden={tab !== 'manual'}>
            <form className="adm-checkin__manual-form" onSubmit={submitManual}>
              <label className="adm-field">
                <span className="adm-field__label">Nama lengkap tamu</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama sesuai undangan" disabled={readOnly} required />
              </label>
              <label className="adm-field">
                <span className="adm-field__label">Kategori identitas</span>
                <select value={identity} onChange={(event) => setIdentity(event.target.value)} disabled={readOnly}>
                  {IDENTITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-field">
                <span className="adm-field__label">WhatsApp (opsional)</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" disabled={readOnly} />
              </label>
              <button type="submit" className="adm-btn adm-btn--dark" disabled={readOnly || busy || !pageId || !name.trim()}>
                <CheckCircle2 size={15} /> Simpan Check-In
              </button>
            </form>
          </div>
        </Card>

        <Card title="Thank You Message" subtitle="Ucapan terima kasih dikirim langsung ke WhatsApp tamu.">
          {lastResult ? (
            <div className="adm-checkin__thanks">
              <p className="adm-checkin__thanks-name">{lastResult.name}</p>
              <label className="adm-field">
                <span className="adm-field__label">Nomor WhatsApp</span>
                <input value={thankYouPhone} onChange={(event) => setThankYouPhone(event.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" disabled={readOnly} />
              </label>
              <label className="adm-field">
                <span className="adm-field__label">Pesan</span>
                <textarea rows={4} value={thankYouMessage} onChange={(event) => setThankYouMessage(event.target.value)} disabled={readOnly} />
              </label>
              <a
                className="adm-btn adm-btn--dark"
                href={whatsappLink(thankYouPhone, thankYouMessage)}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={15} /> Buka WhatsApp
              </a>
              {!thankYouPhone && (
                <p className="adm-checkin__hint">Nomor tamu belum tersimpan. Isi nomor agar pesan sampai ke orang yang tepat.</p>
              )}
            </div>
          ) : (
            <EmptyState
              title="Belum ada check-in"
              description="Setelah tamu di-check-in, pesan terima kasih siap dikirim dari sini."
              action={<MessageCircleHeart size={26} />}
            />
          )}
        </Card>
      </div>

      <Card
        title="Realtime Data Tracking"
        subtitle="Daftar tamu dan status kehadiran diperbarui otomatis."
        actions={
          <label className="adm-search adm-checkin__search">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama tamu…" />
          </label>
        }
      >
        {!filteredGuests.length ? (
          <EmptyState title="Belum ada tamu" description="Tamu yang mengisi RSVP atau check-in manual akan muncul di sini." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-checkin__table">
              <thead>
                <tr>
                  <th scope="col">Tamu</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Status</th>
                  <th scope="col">Waktu & Metode</th>
                  <th scope="col">QR</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => {
                  const checkin = checkinByEntry.get(guest.id);
                  const done = Boolean(checkin?.checkedInAt);
                  return (
                    <tr key={guest.id}>
                      <td>
                        <strong>{guest.name}</strong>
                        <small>{guest.attendance || 'Kehadiran belum diisi'}</small>
                      </td>
                      <td>{checkin?.identityCategory || '—'}</td>
                      <td>
                        <span className={`adm-pill ${done ? 'adm-pill--present' : 'adm-pill--pending'}`}>
                          {done ? 'Sudah check-in' : 'Belum check-in'}
                        </span>
                      </td>
                      <td>
                        {checkin?.checkedInAt ? dateTime(checkin.checkedInAt) : '—'}
                        {checkin?.method ? <small>Metode: {checkin.method}</small> : null}
                      </td>
                      <td>
                        {checkin?.token ? (
                          <button
                            type="button"
                            className="adm-icon-btn"
                            title={`Unduh QR ${guest.name}`}
                            aria-label={`Unduh QR ${guest.name}`}
                            onClick={() => void downloadQr(checkin.token, guest.name)}
                          >
                            <QrCode size={17} />
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="adm-checkin__row-actions">
                          {checkin?.token && (
                            <button
                              type="button"
                              className="adm-btn adm-btn--ghost adm-btn--sm"
                              onClick={() => void copyLink(checkin.token)}
                            >
                              <Copy size={13} /> Salin
                            </button>
                          )}
                          {done && checkin && (
                            <button
                              type="button"
                              className="adm-btn adm-btn--ghost adm-btn--sm"
                              onClick={() => {
                                setLastResult({
                                  ...guest,
                                  identityCategory: checkin.identityCategory,
                                  phone: checkin.phone,
                                  checkedInAt: checkin.checkedInAt,
                                  method: checkin.method,
                                  alreadyCheckedIn: true,
                                });
                                setThankYouPhone(checkin.phone);
                                setThankYouMessage(thankYouText(guest.name));
                              }}
                            >
                              <MessageCircleHeart size={13} /> WA
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Print QR-Code"
        subtitle="Cetak seluruh QR tamu untuk dibagikan di pintu masuk."
        actions={
          <button type="button" className="adm-btn adm-btn--ghost" onClick={() => window.print()} disabled={!guests.length}>
            <Printer size={15} /> Cetak Semua QR
          </button>
        }
      >
        {guests.length ? (
          <p className="adm-checkin__hint">
            {guests.length} QR siap dicetak. Gunakan dialog cetak browser dan pilih “Simpan sebagai PDF” bila perlu.
          </p>
        ) : (
          <p className="adm-checkin__hint">Belum ada QR yang bisa dicetak.</p>
        )}
      </Card>

      <div className="adm-qr-print" aria-hidden="true">
        <h2>{activePage?.title || 'Digital Guestbook'} · QR Tamu</h2>
        <div className="adm-qr-print__grid">
          {guests.map((guest) => {
            const checkin = checkinByEntry.get(guest.id);
            return (
              <div className="adm-qr-print__item" key={guest.id}>
                {checkin?.token ? <QrThumb token={checkin.token} name={guest.name} size={150} /> : <span />}
                <strong>{guest.name}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
