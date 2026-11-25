import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDatabase } from '../services/store';
import { isAdminPath, isCustomSitePath } from '../utils/route';

function setMeta(name: string, content: string) {
  if (!content) return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Applies the website-wide SEO settings to the React routes. Cloned WordPress
 * pages keep their own title because their original metadata is part of the
 * page record and is written by ClonedPage.
 */
export function SeoManager() {
  const db = useDatabase();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (!isCustomSitePath(path) || isAdminPath(path)) return;

    if (db.settings.seoTitle) document.title = db.settings.seoTitle;
    setMeta('description', db.settings.seoDescription);
    setMeta('keywords', db.settings.seoKeywords);
  }, [db.settings.seoTitle, db.settings.seoDescription, db.settings.seoKeywords, location.pathname]);

  return null;
}
