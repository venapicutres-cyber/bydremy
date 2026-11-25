import type { PageRecord } from '../../data/types';
import { initAnimations } from './animations';
import { initInvitation } from './invitation';
import { initLightbox } from './lightbox';
import { initMedia } from './media';
import { initPowerPack } from './powerpack';
import { installCompatGlobals, runPageScripts } from './scripts';
import { initTabs } from './tabs';
import { applyPageState } from './state';
import type { Cleanup, ClonedPageContext, ScrollCallback } from './types';

export interface ActivateClonedPageOptions {
  page: PageRecord;
  root: HTMLElement;
  navigate: (path: string) => void;
}

/**
 * Wires a cloned WordPress page after React has injected its markup. Each
 * module owns one concern and registers its own cleanup; the returned function
 * tears everything down when the route changes.
 */
export function activateClonedPage({ page, root, navigate }: ActivateClonedPageOptions) {
  const cleanups: Cleanup[] = [];
  const scrollCallbacks: ScrollCallback[] = [];
  const context: ClonedPageContext = { page, root, navigate, cleanups, scrollCallbacks };

  applyPageState(context);
  installCompatGlobals(context);
  runPageScripts(context);
  initAnimations(context);
  initMedia(context);
  initPowerPack(context);
  initTabs(context);
  const lightbox = initLightbox(context);
  initInvitation(context, lightbox.openMessage);

  return () => cleanups.forEach((cleanup) => cleanup());
}
