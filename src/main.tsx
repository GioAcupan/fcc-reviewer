import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/space-grotesk';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // precache everything this page already loaded so the app works offline right away
      const urls = performance.getEntriesByType('resource').map(e => (e as PerformanceResourceTiming).name).filter(u => u.startsWith(location.origin));
      const send = () => reg.active?.postMessage({ type: 'precache', urls: [...urls, location.origin + '/'] });
      if (reg.active) send(); else navigator.serviceWorker.ready.then(send);
    }).catch(() => { /* offline support is a bonus */ });
  });
}
