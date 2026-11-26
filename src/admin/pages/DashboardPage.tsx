import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Download,
  FilePenLine,
  FolderTree,
  LayoutTemplate,
  Plus,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import { orderOutstanding, orderPaid, setDatabase, useDatabase } from '../../services/store';
import { Card, PageHeader, StatCard, StatusPill } from '../ui';
import { rupiah, shortDate } from '../../utils/format';
import { isInvitation } from '../../utils/invitations';
import { resolveMediaRef } from '../../utils/mediaRef';
import { backupFilename, buildBackup, downloadText, parseBackup } from '../../utils/backup';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function DashboardPage() {
  const db = useDatabase();
  const [backupNote, setBackupNote] = useState('');
  const backupFileRef = useRef<HTMLInputElement>(null);
  const templates = db.pages.filter((page) => page.kind === 'template');
  const websitePages = db.pages.filter((page) => page.kind !== 'template' && !isInvitation(page));
  const published = websitePages.filter((page) => page.status === 'published').length;
  const drafts = websitePages.filter((page) => page.status === 'draft').length;
  const revenue = db.orders.reduce((total, order) => total + orderPaid(order), 0);
  const unpaidValue = db.orders.reduce((total, order) => total + orderOutstanding(order), 0);
  const reviewCount = db.orders.filter(
    (order) => order.proofPath && order.paymentStatus === 'pending' && !order.activatedAt,
  ).length;
  const latestOrderDate = db.orders.reduce((latest, order) => (order.date > latest ? order.date : latest), '');
  const chartYear = latestOrderDate ? new Date(latestOrderDate).getFullYear() : new Date().getFullYear();

  const exportBackup = () => {
    downloadText(backupFilename(), buildBackup(db));
    setBackupNote('Backup diunduh. Simpan file itu di tempat aman.');
  };

  const importBackup = async (file: File) => {
    try {
      const next = parseBackup(await file.text());
      if (!window.confirm('Impor backup akan mengganti seluruh data dashboard saat ini. Lanjutkan?')) return;
      setDatabase(() => next);
      setBackupNote(
        `Backup dimuat: ${next.orders.length} pesanan, ${next.customers.length} pelanggan, ${next.media.length} media.`,
      );
    } catch (error) {
      setBackupNote(`Gagal impor: ${(error as Error).message}`);
    }
  };

  const monthly = MONTHS.map((label, index) => {
    const total = db.orders
      .filter((order) => {
        const date = new Date(order.date);
        return date.getMonth() === index && date.getFullYear() === chartYear;
      })
      .reduce((sum, order) => sum + order.total, 0);
    return { label, total };
  });
  const maxMonthly = Math.max(...monthly.map((item) => item.total), 1);

  const categoryStats = db.categories.map((category) => ({
    ...category,
    actual: templates.filter((template) => template.category === category.id).length,
  }));

  const recentOrders = [...db.orders]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);
  const topTemplates = [...templates].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Ringkasan"
        title="Dashboard"
        description="Pantau performa website, konten, dan pesanan bydreamy."
        actions={
          <>
            <Link to="/admin/homepage/new" className="adm-btn adm-btn--ghost">
              <FilePenLine size={15} /> Halaman Baru
            </Link>
            <Link to="/admin/orders?new=1" className="adm-btn adm-btn--dark">
              <Plus size={15} /> Pesanan Baru
            </Link>
          </>
        }
      />

      <div className="adm-stats">
        <StatCard
          label="Halaman Website"
          value={websitePages.length}
          meta={`${published} published · ${drafts} draft`}
          icon={<FilePenLine size={17} />}
        />
        <StatCard
          label="Template Demo"
          value={templates.length}
          meta={`${db.categories.length} kategori aktif`}
          icon={<LayoutTemplate size={17} />}
          tone="gold"
        />
        <StatCard
          label="Pesanan"
          value={db.orders.length}
          meta={`${reviewCount} bukti transfer perlu ditinjau`}
          icon={<ShoppingBag size={17} />}
        />
        <StatCard
          label="Pendapatan"
          value={rupiah(revenue)}
          meta={`${rupiah(unpaidValue)} belum dibayar`}
          icon={<CircleDollarSign size={17} />}
          tone="green"
        />
      </div>

      <div className="adm-grid adm-grid--2">
        <Card
          title="Pesanan per bulan"
          subtitle="Nilai transaksi berdasarkan tanggal pesanan"
          actions={<span className="adm-chip"><TrendingUp size={13} /> {chartYear}</span>}
        >
          <div className="adm-chart">
            {monthly.map((item) => (
              <div key={item.label} className="adm-chart__col">
                <div className="adm-chart__bar" style={{ height: `${Math.max(4, (item.total / maxMonthly) * 100)}%` }}>
                  <span>{item.total ? `${Math.round(item.total / 1000)}k` : ''}</span>
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Distribusi kategori"
          subtitle={`Sebaran ${templates.length} desain demo`}
          actions={<Link to="/admin/categories" className="adm-link">Kelola <ArrowUpRight size={13} /></Link>}
        >
          <div className="adm-dist">
            {categoryStats.map((category) => (
              <div key={category.id} className="adm-dist__row">
                <div className="adm-dist__label">
                  <span style={{ background: category.accent }} />
                  {category.name}
                  <em>{category.actual}</em>
                </div>
                <div className="adm-dist__track">
                  <div
                    style={{
                      width: `${templates.length ? (category.actual / templates.length) * 100 : 0}%`,
                      background: category.accent,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="adm-dist__foot">
              <span>
                <BadgeCheck size={14} /> {templates.filter((template) => template.status === 'published').length} template siap dipakai
              </span>
              <Link to="/admin/templates">Lihat semua</Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="adm-grid adm-grid--2">
        <Card
          title="Pesanan terbaru"
          subtitle="6 transaksi terakhir"
          actions={<Link to="/admin/orders" className="adm-link">Semua pesanan <ArrowUpRight size={13} /></Link>}
        >
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pelanggan</th>
                  <th>Paket</th>
                  <th>Status</th>
                  <th className="is-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.id}</strong><small>{shortDate(order.date)}</small></td>
                    <td>{order.customerName}</td>
                    <td>{order.packageName}</td>
                    <td><StatusPill status={order.status} /></td>
                    <td className="is-right">{rupiah(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Template paling dilihat"
          subtitle="Berdasarkan jumlah preview"
          actions={<Link to="/admin/templates" className="adm-link">Kelola <ArrowUpRight size={13} /></Link>}
        >
          <ul className="adm-ranking">
            {topTemplates.map((template, index) => (
              <li key={template.id}>
                <span className="adm-ranking__index">{String(index + 1).padStart(2, '0')}</span>
                <img src={resolveMediaRef(template.thumb, db.media)} alt={template.label} />
                <div>
                  <strong>{template.templateName}</strong>
                  <small>{db.categories.find((category) => category.id === template.category)?.name}</small>
                </div>
                <em>{(template.views || 0).toLocaleString('id-ID')} views</em>
                <Link to={`/admin/pages/${template.id}`} aria-label={`Edit ${template.label}`}>
                  <ArrowUpRight size={15} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="adm-grid adm-grid--3">
        <Card title="Aksi cepat" className="adm-card--flush">
          <div className="adm-quick">
            <Link to="/admin/templates">
              <LayoutTemplate size={18} />
              <span>Kelola template</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link to="/admin/categories">
              <FolderTree size={18} />
              <span>Atur kategori</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link to="/admin/prices">
              <CircleDollarSign size={18} />
              <span>Kelola harga</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link to="/admin/customers">
              <Users size={18} />
              <span>Data pelanggan</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link to="/admin/homepage">
              <Sparkles size={18} />
              <span>Homepage & promo</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </Card>

        <Card title="Kesehatan konten">
          <ul className="adm-health">
            <li>
              <span>Halaman published</span>
              <strong>{published}</strong>
            </li>
            <li>
              <span>Draft belum tayang</span>
              <strong>{drafts}</strong>
            </li>
            <li>
              <span>Template tanpa kategori</span>
              <strong>{templates.filter((template) => !template.category).length}</strong>
            </li>
            <li>
              <span>Media terdaftar</span>
              <strong>{db.media.length}</strong>
            </li>
          </ul>
          {drafts > 0 && (
            <Link to="/admin/homepage" className="adm-health__cta">
              Tinjau {drafts} draft <ArrowUpRight size={14} />
            </Link>
          )}
        </Card>

        <Card title="Tim" subtitle="Akses dashboard">
          <ul className="adm-team">
            {db.users.slice(0, 4).map((user) => (
              <li key={user.id}>
                <span className="adm-avatar adm-avatar--sm">{user.name.slice(0, 1)}</span>
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.role}</small>
                </div>
                <span className={`adm-dot ${user.status === 'active' ? 'is-on' : ''}`} />
              </li>
            ))}
          </ul>
          <Link to="/admin/users" className="adm-health__cta">
            Kelola pengguna <ArrowUpRight size={14} />
          </Link>
        </Card>
        <Card title="Backup data" subtitle="Tersinkron ke Supabase">
          <p className="adm-backup__note">
            Data admin tersimpan otomatis di Supabase dengan cache di browser. Unduh file JSON sebagai cadangan
            tambahan bila penyimpanan browser dibersihkan atau akun perlu dipindahkan.
          </p>
          <div className="adm-inline">
            <button type="button" className="adm-btn adm-btn--dark adm-btn--sm" onClick={exportBackup}>
              <Download size={14} /> Export JSON
            </button>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => backupFileRef.current?.click()}>
              <Upload size={14} /> Import JSON
            </button>
            <input
              ref={backupFileRef}
              type="file"
              accept="application/json,.json"
              className="adm-backup__file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void importBackup(file);
              }}
            />
          </div>
          {backupNote && <p className="adm-backup__note adm-backup__note--status">{backupNote}</p>}
        </Card>
      </div>
    </div>
  );
}
