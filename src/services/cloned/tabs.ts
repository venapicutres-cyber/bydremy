import type { ClonedPageContext } from './types';

function activateTab(tabs: Element, title: HTMLElement) {
  const panelId = title.getAttribute('aria-controls');
  if (!panelId) return;
  const panel = tabs.querySelector<HTMLElement>(`#${CSS.escape(panelId)}`);
  const content = panel?.parentElement;
  if (!panel || !content) return;

  tabs.classList.add('e-activated');
  tabs.querySelectorAll<HTMLElement>('.e-n-tab-title').forEach((button) => {
    const selected = button === title;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  Array.from(content.children).forEach((child) => {
    child.classList.toggle('e-active', child === panel);
  });
}

function handleClick(event: MouseEvent) {
  const target = event.target as Element | null;
  const title = target?.closest<HTMLElement>('.e-n-tab-title');
  const tabs = title?.closest('.e-n-tabs');
  if (!title || !tabs) return;
  event.preventDefault();
  activateTab(tabs, title);
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as Element | null;
  const title = target?.closest<HTMLElement>('.e-n-tab-title');
  const tabs = title?.closest('.e-n-tabs');
  if (!title || !tabs) return;
  const titles = Array.from(tabs.querySelectorAll<HTMLElement>('.e-n-tabs-heading .e-n-tab-title'));
  const index = titles.indexOf(title);
  if (index < 0) return;

  let next = -1;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % titles.length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + titles.length) % titles.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = titles.length - 1;
  if (next < 0) return;

  event.preventDefault();
  const targetTitle = titles[next];
  activateTab(tabs, targetTitle);
  targetTitle.focus();
}

export function initTabs({ root, cleanups }: ClonedPageContext) {
  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeydown);
  cleanups.push(() => {
    root.removeEventListener('click', handleClick);
    root.removeEventListener('keydown', handleKeydown);
  });
}
