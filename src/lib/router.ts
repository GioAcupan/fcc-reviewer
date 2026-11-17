import { useEffect, useState } from 'react';

const read = () => (location.hash.replace(/^#/, '') || '/');
export function useRoute() {
  const [r, setR] = useState(read());
  useEffect(() => {
    const on = () => { setR(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
export const go = (path: string) => { location.hash = path; };
export const back = (fallback = '/') => { if (history.length > 1) history.back(); else go(fallback); };
