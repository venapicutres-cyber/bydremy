import type { PageRecord } from '../data/types';

/**
 * Undangan klien disimpan sebagai `PageRecord` biasa supaya bisa memakai langsung
 * mesin render template + override yang sudah ada. Route-nya diberi namespace
 * sendiri agar tidak bercampur dengan halaman website di dashboard.
 */
export const INVITATION_PREFIX = '/u/';

export function invitationRoute(slug: string): string {
  return `${INVITATION_PREFIX}${slug}`;
}

export function isInvitation(page: PageRecord): boolean {
  return page.route.startsWith(INVITATION_PREFIX);
}
