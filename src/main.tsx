import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { installJQueryCompat } from './services/jquery-compat';
import { hydrateFromSupabase } from './services/store/persistence';
import './styles/public.css';
import './styles/admin.css';

// jQuery is loaded from index.html before this module runs, so the plugin
// shims are available to the cloned inline scripts on every route.
installJQueryCompat();

// Data dashboard dimuat dari Supabase setelah tampilan pertama tampil.
void hydrateFromSupabase();

createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
