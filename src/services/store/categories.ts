import type { CategoryRecord } from '../../data/types';
import { setDatabase } from './persistence';

export function updateCategory(id: CategoryRecord['id'], patch: Partial<CategoryRecord>) {
  setDatabase((db) => ({
    ...db,
    categories: db.categories.map((category) => (category.id === id ? { ...category, ...patch } : category)),
  }));
}

export function createCategory(input: Partial<CategoryRecord>): CategoryRecord {
  const record: CategoryRecord = {
    id: input.id ?? String(Date.now()),
    name: input.name ?? 'Kategori Baru',
    slug: input.slug ?? `kategori-${Date.now()}`,
    tagline: input.tagline ?? '',
    description: input.description ?? '',
    accent: input.accent ?? '#AD8E70',
    cover: input.cover ?? '',
    count: 0,
  };
  setDatabase((db) => ({ ...db, categories: [...db.categories, record] }));
  return record;
}

export function deleteCategory(id: CategoryRecord['id']) {
  setDatabase((db) => ({ ...db, categories: db.categories.filter((category) => category.id !== id) }));
}
