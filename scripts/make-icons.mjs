// Rasterizes the app icon (dark tile + gradient "C" ring + orange cursor) to PNG with zero dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(size, maskable) {
  const S = 4; // supersampling
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const sc = size / 512;
  const pad = maskable ? 0.12 : 0; // safe zone for maskable icons
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        let px = (x + (sx + 0.5) / S) / sc, py = (y + (sy + 0.5) / S) / sc;
        // background tile
        let inTile = true;
        if (!maskable) { const rr = 112; const cx = Math.min(Math.max(px, rr), 512 - rr), cy = Math.min(Math.max(py, rr), 512 - rr); inTile = (px - cx) ** 2 + (py - cy) ** 2 <= rr * rr; }
        if (!inTile) continue;
        // shrink artwork for maskable safe zone
        const qx = 256 + (px - 256) / (1 - pad * 0.0 - (maskable ? 0.18 : 0)), qy = 256 + (py - 256) / (1 - (maskable ? 0.18 : 0));
        let cr = 11, cg = 15, cb = 23;
        // C ring centered (256,256) radius 118, width 58, open on the right (angle between -48 and 48 deg)
        const dx = qx - 256, dy = qy - 256; const d = Math.hypot(dx, dy); const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const onRing = Math.abs(d - 118) <= 29 && Math.abs(ang) > 48;
        const capA = [256 + 118 * Math.cos(48 * Math.PI / 180), 256 - 118 * Math.sin(48 * Math.PI / 180)];
        const capB = [capA[0], 256 + 118 * Math.sin(48 * Math.PI / 180)];
        const onCap = Math.hypot(qx - capA[0], qy - capA[1]) <= 29 || Math.hypot(qx - capB[0], qy - capB[1]) <= 29;
        if (onRing || onCap) { const t = Math.min(1, Math.max(0, (qx + qy) / 1024)); cr = 124 + (107 - 124) * t; cg = 242 + (223 - 242) * t; cb = 197 + (255 - 197) * t; }
        if (qx >= 330 && qx <= 404 && qy >= 232 && qy <= 280) { cr = 255; cg = 184; cb = 107; }
        r += cr; g += cg; b += cb; a += 255;
      }
      const n = S * S; const o = y * (size * 4 + 1) + 1 + x * 4;
      const al = a / n;
      raw[o] = al ? Math.round(r / (a / 255)) : 0; raw[o + 1] = al ? Math.round(g / (a / 255)) : 0; raw[o + 2] = al ? Math.round(b / (a / 255)) : 0; raw[o + 3] = Math.round(al);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
writeFileSync('public/icon-192.png', png(192, false));
writeFileSync('public/icon-512.png', png(512, false));
console.log('icons written');
