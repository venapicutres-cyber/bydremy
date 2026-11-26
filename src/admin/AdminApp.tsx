import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { AdminSession } from './auth';
import { getSession, SessionContext, subscribeAuth } from './auth';
import { hydrateAdminData, hydrateFromSupabase } from '../services/store/persistence';
import { setSnapshotSyncEnabled } from '../services/store';
import { AdminLayout } from './AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PagesListPage } from './pages/PagesListPage';
import { PageEditorPage } from './pages/PageEditorPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { MediaPage } from './pages/MediaPage';
import { OrdersPage } from './pages/OrdersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { PricesPage } from './pages/PricesPage';
import { CustomersPage } from './pages/CustomersPage';
import { UsersPage } from './pages/UsersPage';
import { PasswordPage } from './pages/PasswordPage';
import { NavigationPage } from './pages/NavigationPage';
import { SettingsPage } from './pages/SettingsPage';
import { SeoPage } from './pages/SeoPage';
import { PreviewPage } from './pages/PreviewPage';
import { InvitationsPage } from './pages/InvitationsPage';
import { InvitationCreatePage } from './pages/InvitationCreatePage';
import { InvitationEditorPage } from './pages/InvitationEditorPage';
import { GuestbookPage } from './pages/GuestbookPage';
import { CheckInPage } from './pages/CheckInPage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';

export function AdminApp() {
  const location = useLocation();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [booted, setBooted] = useState(false);
  const bootingRef = useRef(true);

  useEffect(() => {
    let active = true;
    // Abaikan event awal (INITIAL_SESSION) selama bootstrap; bootstrap yang
    // menentukan sesi pertama agar data admin tidak dimuat dua kali.
    const unsubscribe = subscribeAuth((next) => {
      if (!active || bootingRef.current) return;
      setSession(next);
    });

    void (async () => {
      const initial = await getSession();
      if (!active) return;
      if (initial?.role === 'admin') await hydrateAdminData();
      else if (initial) await hydrateFromSupabase();
      setSnapshotSyncEnabled(initial?.role === 'admin');
      bootingRef.current = false;
      setSession(initial);
      setBooted(true);
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Editor pengantin menulis lewat RPC satu halaman, bukan snapshot penuh.
  useEffect(() => {
    setSnapshotSyncEnabled(session?.role === 'admin');
  }, [session]);

  const login = (next: AdminSession) => {
    setSnapshotSyncEnabled(next.role === 'admin');
    setSession(next);
  };

  const logout = () => {
    setSnapshotSyncEnabled(false);
    setSession(null);
    window.location.assign('/admin');
  };

  if (!booted) {
    return (
      <div className="adm-boot" role="status" aria-live="polite">
        <span className="adm-boot__dot" /> Memuat sesi…
      </div>
    );
  }

  if (location.pathname === '/admin/activate') {
    return <ActivateAccountPage ready={Boolean(session)} />;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage onLogin={login} />} />
      </Routes>
    );
  }

  // Akun editor pengantin hanya boleh membuka undangannya sendiri, buku tamu,
  // dashboard check-in, pratinjau, dan ganti password.
  if (session.role !== 'admin') {
    return (
      <SessionContext.Provider value={session}>
        <Routes>
          <Route path="preview/:id" element={<PreviewPage />} />
          <Route element={<AdminLayout session={session} onLogout={logout} />}>
            <Route path="invitations/:id" element={<InvitationEditorPage />} />
            <Route path="guestbook" element={<GuestbookPage />} />
            <Route path="check-in" element={<CheckInPage />} />
            <Route path="password" element={<PasswordPage />} />
            <Route
              path="*"
              element={
                session.pageId ? (
                  <Navigate to={`/admin/invitations/${session.pageId}`} replace />
                ) : (
                  <div className="adm-page">
                    <div className="adm-empty">
                      <h3>Akun belum memiliki undangan</h3>
                      <p>Hubungi administrator agar akun ini dihubungkan ke sebuah undangan.</p>
                    </div>
                  </div>
                )
              }
            />
          </Route>
        </Routes>
      </SessionContext.Provider>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <Routes>
        <Route path="preview/:id" element={<PreviewPage />} />
        <Route element={<AdminLayout session={session} onLogout={logout} />}>
          <Route index element={<DashboardPage />} />
          <Route path="pages" element={<PagesListPage />} />
          <Route path="pages/new" element={<PageEditorPage />} />
          <Route path="pages/:id" element={<PageEditorPage />} />
          <Route path="templates" element={<Navigate to="/admin/pages?kind=template" replace />} />
          <Route path="invitations" element={<InvitationsPage />} />
          <Route path="invitations/new" element={<InvitationCreatePage />} />
          <Route path="invitations/:id" element={<InvitationEditorPage />} />
          <Route path="guestbook" element={<GuestbookPage />} />
          <Route path="check-in" element={<CheckInPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="prices" element={<PricesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="password" element={<PasswordPage />} />
          <Route path="homepage" element={<SettingsPage initialTab="homepage" />} />
          <Route path="homepage/new" element={<PageEditorPage />} />
          <Route path="homepage/:id" element={<PageEditorPage />} />
          <Route path="navigation" element={<NavigationPage />} />
          <Route path="settings" element={<SettingsPage initialTab="general" />} />
          <Route path="seo" element={<SeoPage />} />
        </Route>
      </Routes>
    </SessionContext.Provider>
  );
}
