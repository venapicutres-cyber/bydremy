import type { PageRecord } from '../data/types';
import { HomeMarkup } from './HomeMarkup';
import { ReactPage } from './ReactPage';

export function HomePage({ page }: { page: PageRecord }) {
  return <ReactPage page={page} Markup={HomeMarkup} />;
}
