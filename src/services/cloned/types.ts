import type { PageRecord } from '../../data/types';

export type Cleanup = () => void;
export type ScrollCallback = () => void;

export interface ClonedPageContext {
  page: PageRecord;
  root: HTMLElement;
  navigate: (path: string) => void;
  cleanups: Cleanup[];
  scrollCallbacks: ScrollCallback[];
}
