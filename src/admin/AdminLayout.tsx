import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FolderTree,
  Home,
  Image as ImageIcon,
  KeyRound,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  MessageSquareHeart,
  ScanLine,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AdminSession } from './auth';
import { logout } from './auth';
import { dismissSyncError, useDatabase, useSyncError } from '../services/store';

interface NavGroup {
  label: string;
  items: { to: string; label: string; icon: LucideIcon; end?: boolean }[];
  hint?: string;
}

const GROUPS: NavGroup[] = [
  {
    label: 'Ringkasan',
    items: [{ to: '/admin', end: true, label: 'Dashboard', icon: BarChart3 }],
  },
  {
    label: 'Konten',
    items: [
      { to: '/admin/pages', label: 'Template Demo', icon: LayoutTemplate },
      { to: '/admin/invitations', label: 'Undangan', icon: Mail },
      { to: '/admin/guestbook', label: 'Buku Tamu', icon: MessageSquareHeart },
      { to: '/admin/check-in', label: 'Check-In Tamu', icon: ScanLine },
      { to: '/admin/categories', label: 'Kategori', icon: FolderTree },
      { to: '/admin/media', label: 'Media & Font', icon: ImageIcon },
    ],
  },
  {
    label: 'Bisnis',
    items: [
      { to: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
      { to: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
      { to: '/admin/prices', label: 'Kelola Harga', icon: CircleDollarSign },
      { to: '/admin/customers', label: 'Pelanggan', icon: UserRound },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/admin/homepage', label: 'Halaman Website', icon: Home },
      { to: '/admin/navigation', label: 'Navigasi & Footer', icon: Menu },
      { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
      { to: '/admin/seo', label: 'SEO & Metadata', icon: Search },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/admin/users', label: 'Pengguna', icon: Users },
      { to: '/admin/password', label: 'Ganti Password', icon: KeyRound },
    ],
  },
];

export function AdminLayout({ session, onLogout }: { session: AdminSession; onLogout: () => void }) {
  const db = useDatabase();
  const syncError = useSyncError();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Editor pengantin hanya melihat undangannya, buku tamunya, dan ganti password.
  const scoped = session.role !== 'admin';
  const groups: NavGroup[] = scoped
    ? [
        {
          label: 'Undangan Saya',
          items: session.pageId
            ? [{ to: `/admin/invitations/${session.pageId}`, label: 'Editor Undangan', icon: Mail }]
            : [],
          hint: session.pageId ? undefined : 'Akun belum dihubungkan ke undangan.',
        },
        {
          label: 'Tamu',
          items: [
            { to: '/admin/guestbook', label: 'Buku Tamu', icon: MessageSquareHeart },
            { to: '/admin/check-in', label: 'Check-In Tamu', icon: ScanLine },
          ],
        },
        {
          label: 'Sistem',
          items: [{ to: '/admin/password', label: 'Ganti Password', icon: KeyRound }],
        },
      ]
    : GROUPS;

  const activeLabel =
    groups.flatMap((group) => group.items).find((item) =>
      item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to),
    )?.label || (scoped ? 'Editor Undangan' : 'Dashboard');

  return (
    <div className={`adm-shell ${open ? 'is-nav-open' : ''}`}>
      <aside className="adm-sidebar">
        <div className="adm-sidebar__brand">
          <Link to="/admin" className="adm-wordmark">
            bydreamy
          </Link>
          <span>Studio</span>
          <button type="button" className="adm-sidebar__close" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>
        <nav className="adm-nav" aria-label="Navigasi dashboard">
          {groups.map((group) => (
            <div key={group.label} className="adm-nav__group">
              <p>{group.label}</p>
              {group.hint && <span className="adm-nav__hint">{group.hint}</span>}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    <ChevronRight size={14} className="adm-nav__chevron" />
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="adm-sidebar__foot">
          <div className="adm-sidebar__promo">
            <Sparkles size={18} />
            <strong>{db.pages.filter((page) => page.kind === 'template').length} template aktif</strong>
            <p>{scoped ? 'Perubahan tersimpan pada undangan Anda.' : 'Semua perubahan tersimpan otomatis ke website.'}</p>
            <Link to="/katalog">Lihat katalog →</Link>
          </div>
          <div className="adm-user">
            <span className="adm-avatar">{session.name.slice(0, 1)}</span>
            <div>
              <strong>{session.name}</strong>
              <small>{session.email}</small>
            </div>
            <button
              type="button"
              className="adm-icon-btn"
              title="Keluar"
              onClick={() => {
                void logout().finally(() => onLogout());
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <button type="button" className="adm-icon-btn adm-topbar__menu" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu size={19} />
          </button>
          <div className="adm-crumbs">
            <Link to="/admin">Dashboard</Link>
            <ChevronRight size={13} />
            <span>{activeLabel}</span>
          </div>
          <div className="adm-topbar__right">
            <Link to="/" className="adm-btn adm-btn--ghost adm-btn--sm" target="_blank" rel="noreferrer">
              <Mail size={14} /> Lihat Website
            </Link>
            {!scoped && (
              <Link to="/admin/payments" className="adm-topbar__badge" title="Bukti transfer menunggu ditinjau">
                <CreditCard size={16} />
                <span>
                  {
                    db.orders.filter(
                      (order) => order.proofPath && order.paymentStatus === 'pending' && !order.activatedAt,
                    ).length
                  }
                </span>
              </Link>
            )}
          </div>
        </header>
        <div className="adm-content">
          {syncError && (
            <div className="adm-alert adm-alert--error adm-sync-alert" role="alert">
              <span>Perubahan belum tersimpan ke server: {syncError}</span>
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={dismissSyncError}>
                Tutup
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </div>
      {open && <div className="adm-sidebar__scrim" onClick={() => setOpen(false)} />}
    </div>
  );
}
