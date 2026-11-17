import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// Stamps dist/sw.js with this build's files + a version hash, so each deploy precaches the
// whole app on install and the service worker deletes the previous deploy's cache.
function swPrecache(): Plugin {
  let outDir = 'dist';
  let files: string[] = [];
  let html = '';
  return {
    name: 'sw-precache',
    apply: 'build',
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); },
    generateBundle(_, bundle) {
      files = Object.keys(bundle).filter(f => !f.endsWith('.map') && f !== 'index.html');
      const h = bundle['index.html'];
      if (h && h.type === 'asset') html = String(h.source);
    },
    closeBundle() {
      const sw = resolve(outDir, 'sw.js');
      if (!existsSync(sw)) return;
      const list = files.map(f => '/' + f).sort();
      const version = createHash('sha256').update(list.join('|') + html).digest('hex').slice(0, 12);
      const src = readFileSync(sw, 'utf8');
      const out = src.replace("/*__VERSION__*/'dev'", JSON.stringify(version)).replace('/*__PRECACHE__*/[]', JSON.stringify(list));
      if (out === src) throw new Error('sw-precache: placeholders not found in sw.js');
      writeFileSync(sw, out);
    },
  };
}

export default defineConfig({
  plugins: [react(), swPrecache()],
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
});
