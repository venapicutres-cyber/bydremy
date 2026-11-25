import type { UserRecord } from '../../data/types';
import { setDatabase } from './persistence';

export function createUser(input: Partial<UserRecord>): UserRecord {
  const record: UserRecord = {
    id: Date.now(),
    name: input.name ?? 'Pengguna Baru',
    email: input.email ?? '',
    role: input.role ?? 'viewer',
    status: input.status ?? 'active',
    lastLogin: '—',
  };
  setDatabase((db) => ({ ...db, users: [...db.users, record] }));
  return record;
}

export function updateUser(id: number, patch: Partial<UserRecord>) {
  setDatabase((db) => ({
    ...db,
    users: db.users.map((user) => (user.id === id ? { ...user, ...patch } : user)),
  }));
}

export function deleteUser(id: number) {
  setDatabase((db) => ({ ...db, users: db.users.filter((user) => user.id !== id) }));
}
