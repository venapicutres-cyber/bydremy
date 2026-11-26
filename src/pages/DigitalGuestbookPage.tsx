import type { PageRecord } from '../data/types';
import { GuestbookMarkup } from './GuestbookMarkup';
import { ReactPage } from './ReactPage';

export function DigitalGuestbookPage({ page }: { page: PageRecord }) {
  return <ReactPage page={page} Markup={GuestbookMarkup} />;
}
