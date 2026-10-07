import { useEffect, useState } from 'react';

export function useHashRoute(): string[] {
  const [hash, setHash] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const f = () => setHash(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return hash.split('/').filter(Boolean);
}

export function go(path: string) {
  window.location.hash = path;
}
