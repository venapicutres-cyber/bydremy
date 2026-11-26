import type { PageRecord } from '../data/types';
import { ContactMarkup } from './ContactMarkup';
import { ReactPage } from './ReactPage';

export function ContactUsPage({ page }: { page: PageRecord }) {
  return <ReactPage page={page} Markup={ContactMarkup} />;
}
