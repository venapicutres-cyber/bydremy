import type { PageStatus } from '../../../data/types';

export type SettingsTab = 'general' | 'homepage' | 'bank' | 'contact' | 'announcement';

export const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'Identitas Website' },
  { id: 'homepage', label: 'Homepage & Halaman' },
  { id: 'bank', label: 'Rekening Transfer' },
  { id: 'contact', label: 'Kontak & Sosial' },
  { id: 'announcement', label: 'Pengumuman' },
];

export interface HomepageDraft {
  title: string;
  description: string;
  status: PageStatus;
}
