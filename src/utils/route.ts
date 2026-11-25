export function canonicalPath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
}

export function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/** Paths rendered by the React site shell rather than a cloned WordPress page. */
export function isCustomSitePath(pathname: string) {
  const path = canonicalPath(pathname);
  return path === '/katalog' || path.startsWith('/katalog/') || path.startsWith('/template/') || path === '/tentang';
}

/**
 * Returns the same-site portion of a link without a trailing slash, or null for
 * external URLs. Cloned markup uses absolute links, so this keeps SPA
 * navigation inside the router.
 */
export function internalPath(href: string, origin = window.location.origin) {
  if (!href.trim()) return null;
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return null;
    return canonicalPath(url.pathname) + url.search + url.hash;
  } catch {
    return null;
  }
}
