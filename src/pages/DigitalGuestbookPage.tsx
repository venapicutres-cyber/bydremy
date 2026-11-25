import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Download,
  FileSpreadsheet,
  Keyboard,
  Link2,
  MessageCircleHeart,
  MonitorPlay,
  Printer,
  QrCode,
  Radio,
  ScanLine,
  Smartphone,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fetchGuestbookCount, subscribeGuestbook } from '../services/guestbook';
import { useDatabase } from '../services/store';
import { whatsappLink } from '../utils/nota';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Link2,
    title: 'Terintegrasi',
    description: 'Satu sistem menyatu dengan undangan digital, buku tamu, dan dashboard bydreamy.',
  },
  {
    icon: QrCode,
    title: 'Sistem QR-Code',
    description: 'Setiap tamu mendapat QR pribadi yang unik, otomatis dibuat setelah RSVP.',
  },
  {
    icon: Printer,
    title: 'Print QR-Code',
    description: 'Unduh dan cetak QR untuk daftar tamu yang tidak membawa ponsel.',
  },
  {
    icon: Radio,
    title: 'Realtime Data Tracking',
    description: 'Setiap check-in langsung muncul di dashboard tanpa perlu menyegarkan halaman.',
  },
  {
    icon: MonitorPlay,
    title: 'Layar Sapa',
    description: 'Tampilan sambutan layar penuh yang menampilkan nama tamu saat mereka tiba.',
  },
  {
    icon: MessageCircleHeart,
    title: 'Thank You Message',
    description: 'Kirim ucapan terima kasih ke WhatsApp tamu langsung dari dashboard check-in.',
  },
  {
    icon: Smartphone,
    title: 'Device Support',
    description: 'Scan dari ponsel, tablet, maupun laptop — tanpa aplikasi tambahan.',
  },
  {
    icon: UsersRound,
    title: 'Team Support',
    description: 'Beberapa petugas bisa check-in bersama dengan akses sesuai undangannya.',
  },
];

export function DigitalGuestbookPage() {
  const db = useDatabase();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void fetchGuestbookCount()
        .then((value) => {
          if (active) setCount(value);
        })
        .catch(() => undefined);
    };
    refresh();

    const unsubscribe = subscribeGuestbook(null, refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);

  const consultation = whatsappLink(
    db.settings.whatsapp,
    "Halo bydreamy, saya ingin menggunakan Digital Guestbook untuk acara saya.",
  );

  return (
    <div className="dg">
      <section className="dg-hero">
        <div className="site-container dg-hero__inner">
          <div className="dg-hero__copy">
            <p className="site-eyebrow">Digital Guestbook · bydreamy</p>
            <h1>
              <span aria-hidden="true">
                System Check-in <em>Buku Tamu Digital</em>
              </span>
              <span className="dg-sr-only">System Check-in Buku Tamu Digital</span>
            </h1>
            <p className="dg-hero__lead">
              Ganti buku tamu kertas dengan check-in yang cepat dan rapi. Tamu cukup menunjukkan QR pribadi
              atau menuliskan namanya — Anda langsung melihat data kehadiran secara realtime.
            </p>
            <div className="dg-hero__actions">
              <Link className="site-btn site-btn--dark" to="/admin/check-in">
                Buka Dashboard Check-In <ArrowUpRight size={15} />
              </Link>
              <Link className="site-btn site-btn--ghost" to="/layar-sapa">
                Lihat Layar Sapa <ArrowRight size={15} />
              </Link>
            </div>
            <p className="dg-hero__stat" aria-live="polite">
              <span className="dg-hero__stat-dot" />
              {count === null ? 'Menghubungkan data…' : `${count} RSVP tersimpan · diperbarui otomatis`}
            </p>
          </div>

          <div className="dg-hero__visual" aria-hidden="true">
            <div className="dg-ticket">
              <div className="dg-ticket__head">
                <span className="dg-ticket__brand">bydreamy</span>
                <span className="dg-ticket__tag">CHECK-IN PASS</span>
              </div>
              <div className="dg-ticket__code">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="dg-ticket__foot">
                <strong>Nama Tamu</strong>
                <small>QR pribadi · sekali pakai</small>
              </div>
            </div>
            <div className="dg-ticket dg-ticket--back">
              <ScanLine size={28} />
              <span>Scan di pintu masuk</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dg-modes" aria-labelledby="dg-modes-title">
        <div className="site-container">
          <p className="site-eyebrow">Dua jalur check-in</p>
          <h2 id="dg-modes-title">Pilih cara check-in yang paling nyaman.</h2>
          <div className="dg-modes__grid">
            <article className="dg-mode" aria-label="CHECK-IN WITH Scan QR Code">
              <span className="dg-mode__index">01</span>
              <span className="dg-mode__icon">
                <QrCode size={24} />
              </span>
              <p className="dg-mode__kicker">CHECK-IN WITH</p>
              <h3>Scan QR Code</h3>
              <p className="dg-mode__body">
                Tamu menunjukkan QR pribadi yang dikirim bersama undangan. Petugas memindai dengan kamera
                perangkat — data kehadiran langsung tersimpan.
              </p>
              <ul>
                <li>
                  <Check size={14} /> QR unik untuk setiap tamu
                </li>
                <li>
                  <Check size={14} /> Bisa juga ditempel manual bila kamera tidak tersedia
                </li>
              </ul>
              <span className="dg-sr-only">CHECK-IN WITH Scan QR Code</span>
            </article>

            <article className="dg-mode" aria-label="CHECK-IN WITH Input Manual">
              <span className="dg-mode__index">02</span>
              <span className="dg-mode__icon">
                <Keyboard size={24} />
              </span>
              <p className="dg-mode__kicker">CHECK-IN WITH</p>
              <h3>Input Manual</h3>
              <p className="dg-mode__body">
                Untuk undangan cetak atau tamu yang lupa membawa QR. Petugas mengisi nama lengkap, kategori
                identitas, dan nomor WhatsApp bila tersedia.
              </p>
              <ul>
                <li>
                  <Check size={14} /> Kategori tamu rapi untuk rekap
                </li>
                <li>
                  <Check size={14} /> QR tetap dibuat setelah input manual
                </li>
              </ul>
              <span className="dg-sr-only">CHECK-IN WITH Input Manual</span>
            </article>
          </div>
        </div>
      </section>

      <section className="dg-features" aria-labelledby="dg-features-title">
        <div className="site-container">
          <p className="site-eyebrow">Satu sistem, seluruh kebutuhan acara</p>
          <h2 id="dg-features-title">Terintegrasi dari undangan hingga hari H.</h2>
          <div className="dg-features__grid">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="dg-feature" key={feature.title}>
                  <span className="dg-feature__icon">
                    <Icon size={20} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
          <div className="dg-features__links">
            <Link to="/admin/check-in">
              Buka Dashboard Check-In <ArrowUpRight size={14} />
            </Link>
            <Link to="/layar-sapa">
              Buka Layar Sapa <ArrowUpRight size={14} />
            </Link>
            <a href={consultation} target="_blank" rel="noreferrer">
              Konsultasi WhatsApp <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <section className="dg-handover" aria-labelledby="dg-handover-title">
        <div className="site-container dg-handover__inner">
          <div className="dg-handover__copy">
            <span className="dg-handover__badge">
              <Clock3 size={14} /> Dikirim H+1
            </span>
            <p className="site-eyebrow">Serah terima data</p>
            <h2 id="dg-handover-title">Kelola Data Tamu</h2>
            <p>
              Rekap kehadiran bukan hanya angka saat acara berlangsung. Seluruh data tamu disiapkan dan
              diserahkan ke tim Anda maksimal <strong>H+1</strong> — hari berikutnya setelah acara.
            </p>
            <ul>
              <li>
                <Check size={14} /> Nama lengkap dan kategori identitas tamu
              </li>
              <li>
                <Check size={14} /> Waktu dan metode check-in (QR atau manual)
              </li>
              <li>
                <Check size={14} /> Konfirmasi kehadiran dari RSVP undangan
              </li>
              <li>
                <Check size={14} /> Nomor WhatsApp bila tamu mengisinya
              </li>
            </ul>
            <p className="dg-handover__note">
              <Download size={14} /> Data bisa diunduh sebagai CSV dari dashboard check-in kapan saja.
            </p>
          </div>
          <div className="dg-handover__sheet" aria-hidden="true">
            <div className="dg-handover__sheet-head">
              <FileSpreadsheet size={20} />
              <span>Laporan Tamu · H+1</span>
            </div>
            <div className="dg-handover__row dg-handover__row--head">
              <span>Nama</span>
              <span>Kategori</span>
              <span>Status</span>
            </div>
            {['Rani Permata', 'Dimas Aditya', 'Nadia Putri', 'Bagas Prakoso'].map((name, index) => (
              <div className="dg-handover__row" key={name}>
                <span>{name}</span>
                <span>{['Keluarga', 'Teman', 'Rekan Kerja', 'Undangan Cetak'][index]}</span>
                <span className="dg-handover__ok">Hadir</span>
              </div>
            ))}
            <div className="dg-handover__sheet-foot">Unduh CSV · bydreamy Studio</div>
          </div>
        </div>
      </section>

      <section className="dg-cta">
        <div className="site-container dg-cta__inner">
          <div>
            <p className="site-eyebrow">Siap dipakai untuk acara Anda</p>
            <h2>Check-in tamu yang tenang, acara yang mengalir.</h2>
          </div>
          <Link className="site-btn site-btn--light" to="/admin/check-in">
            Mulai Check-In <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
