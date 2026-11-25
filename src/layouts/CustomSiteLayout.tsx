import { Outlet } from 'react-router-dom';
import { SiteFooter } from '../components/site/SiteFooter';
import { SiteHeader } from '../components/site/SiteHeader';

export function CustomSiteLayout() {
  return (
    <div className="bydreamy-site">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
