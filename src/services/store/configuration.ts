import type { FooterColumn, NavItem, SettingsRecord } from '../../data/types';
import { setDatabase } from './persistence';

export function updateSettings(patch: Partial<SettingsRecord>) {
  setDatabase((db) => ({ ...db, settings: { ...db.settings, ...patch } }));
}

export function updateNavigation(items: NavItem[]) {
  setDatabase((db) => ({ ...db, navigation: items }));
}

export function updateFooter(columns: FooterColumn[]) {
  setDatabase((db) => ({ ...db, footer: columns }));
}
