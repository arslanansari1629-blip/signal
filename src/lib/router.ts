import { useEffect, useState } from 'react';
import { normalizeSearch } from './media.mjs';

export interface Route { path: string; parts: string[]; query: URLSearchParams }

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathname, search = ''] = raw.split('?');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(normalizeSearch(search)) };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => { setRoute(parseHash(window.location.hash)); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const navigate = (path: string) => { window.location.hash = path; };
