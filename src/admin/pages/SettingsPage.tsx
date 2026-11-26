import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { useDatabase, updatePage, updateSettings } from '../../services/store';
import type { SettingsRecord } from '../../data/types';
import { PageHeader } from '../ui';
import { AnnouncementTab } from './settings/AnnouncementTab';
import { BankTab } from './settings/BankTab';
import { ContactTab } from './settings/ContactTab';
import { GeneralTab } from './settings/GeneralTab';
import { HomepageTab } from './settings/HomepageTab';
import { SETTINGS_TABS, type HomepageDraft, type SettingsTab } from './settings/types';

const isSettingsTab = (value: string | null): value is SettingsTab =>
  Boolean(value && SETTINGS_TABS.some((item) => item.id === value));

export function SettingsPage({ initialTab = 'general' }: { initialTab?: SettingsTab }) {
  const db = useDatabase();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryTab = params.get('tab');
  const tab: SettingsTab = isSettingsTab(queryTab) ? queryTab : initialTab;
  const [form, setForm] = useState<SettingsRecord>(db.settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(db.settings);
  }, [db.settings]);

  const homePage = useMemo(() => db.pages.find((page) => page.route === '/') || db.pages.find((page) => page.kind === 'home'), [db.pages]);
  const [homeDraft, setHomeDraft] = useState<HomepageDraft>({
    title: homePage?.title || '',
    description: homePage?.description || '',
    status: homePage?.status || 'published',
  });

  useEffect(() => {
    if (!homePage) return;
    setHomeDraft({ title: homePage.title, description: homePage.description, status: homePage.status });
  }, [homePage?.id]);

  const set = <K extends keyof SettingsRecord>(key: K, value: SettingsRecord[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    updateSettings(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const saveHome = () => {
    if (!homePage) return;
    updatePage(homePage.id, homeDraft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Website"
        title={tab === 'homepage' ? 'Homepage & Halaman Website' : 'Pengaturan'}
        description={
          tab === 'homepage'
            ? 'Atur homepage, sorotan, dan seluruh halaman statis website.'
            : 'Identitas brand, homepage, kontak, dan pengumuman situs.'
        }
        actions={
          <>
            {saved && <span className="adm-saved">Tersimpan ✓</span>}
            {tab !== 'homepage' && (
              <button type="button" className="adm-btn adm-btn--dark" onClick={save}>
                <Save size={15} /> Simpan Pengaturan
              </button>
            )}
          </>
        }
      />

      <div className="adm-tabs adm-tabs--page">
        {SETTINGS_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'is-active' : undefined}
            onClick={() => {
              if (item.id === 'homepage') navigate('/admin/homepage');
              else navigate(item.id === 'general' ? '/admin/settings' : `/admin/settings?tab=${item.id}`);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab form={form} set={set} />}

      {tab === 'homepage' && (
        <HomepageTab
          homePage={homePage}
          templates={db.pages.filter((page) => page.kind === 'template')}
          categories={db.categories}
          draft={homeDraft}
          setDraft={setHomeDraft}
          onSave={saveHome}
        />
      )}

      {tab === 'bank' && <BankTab form={form} set={set} />}

      {tab === 'contact' && <ContactTab form={form} set={set} />}

      {tab === 'announcement' && <AnnouncementTab form={form} set={set} />}
    </div>
  );
}
