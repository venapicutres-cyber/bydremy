import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ClonedPage } from './components/cloned/ClonedPage';
import { SeoManager } from './components/SeoManager';
import { SiteHeader } from './components/site/SiteHeader';
import { CustomSiteLayout } from './layouts/CustomSiteLayout';
import { CatalogPage } from './pages/CatalogPage';
import { HomePage } from './pages/HomePage';
import { DigitalGuestbookPage } from './pages/DigitalGuestbookPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { TemplateDetailPage } from './pages/TemplateDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ShareWaPage } from './pages/ShareWaPage';
import { LayarSapaPage } from './pages/LayarSapaPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutStatusPage } from './pages/CheckoutStatusPage';
import { NotFoundPage } from './components/site/NotFoundPage';
import { AdminApp } from './admin/AdminApp';
import { useDatabase } from './services/store';
import { canonicalPath, isAdminPath } from './utils/route';

/**
 * Every cloned WordPress page is served on its original route so the design,
 * navigation and links inside the markup behave exactly like the live site.
 */
function CloneRoutes() {
  const db = useDatabase();
  const location = useLocation();

  const path = canonicalPath(location.pathname);
  const page = db.pages.find(
    (item) => canonicalPath(item.route) === path || item.slug === path.replace(/^\//, ''),
  );

  if (!page) return <NotFoundPage />;
  // Drafts stay available in the dashboard preview but are not public.
  if (page.status === 'draft') return <NotFoundPage />;
  if (page.kind === 'home') {
    // Admin custom HTML still wins; otherwise the homepage is React-rendered.
    return (
      <div className="bydreamy-home-shell">
        <div className="bydreamy-site">
          <SiteHeader />
        </div>
        {page.contentHtml ? (
          <ClonedPage key={page.id} pageId={page.id} />
        ) : (
          <HomePage key={page.id} page={page} />
        )}
      </div>
    );
  }
  // These original WordPress pages are now React components; admin custom HTML
  // still takes precedence when present.
  if (!page.contentHtml) {
    if (page.slug === 'digital-guestbook') return <DigitalGuestbookPage key={page.id} page={page} />;
    if (page.slug === 'contact-us') return <ContactUsPage key={page.id} page={page} />;
  }
  return <ClonedPage key={page.id} pageId={page.id} />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!isAdminPath(pathname)) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <SeoManager />
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />

        <Route element={<CustomSiteLayout />}>
          <Route path="/katalog" element={<CatalogPage />} />
          <Route path="/katalog/:category" element={<CatalogPage />} />
          <Route path="/template/:slug" element={<TemplateDetailPage />} />
          <Route path="/checkout/:slug" element={<CheckoutPage />} />
          <Route path="/checkout/status" element={<CheckoutStatusPage />} />
          <Route path="/tentang" element={<AboutPage />} />
          <Route path="/share-wa" element={<ShareWaPage />} />
        </Route>

        <Route path="/layar-sapa" element={<LayarSapaPage />} />
        <Route path="/*" element={<CloneRoutes />} />
      </Routes>
    </>
  );
}
