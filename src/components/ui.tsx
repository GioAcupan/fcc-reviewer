import { Fragment, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { hlLine } from '../lib/highlight';

// ---------- markdown-lite ----------
function inline(s: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|~[^~\n]+~)|(\*\*[^*]+\*\*)|(==[^=]+==)|(\b_[^_]+_\b)/g;
  let last = 0, m: RegExpExecArray | null, k = key;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    if (m[1]) out.push(<code key={k++} className="ic">{hlLine(t.slice(1, -1)).map((x, i) => <span key={i} className={'t-' + x.c}>{x.t}</span>)}</code>);
    else if (m[2]) out.push(<b key={k++}>{inline(t.slice(2, -2), k * 100)}</b>);
    else if (m[3]) out.push(<mark key={k++}>{t.slice(2, -2)}</mark>);
    else out.push(<i key={k++}>{t.slice(1, -1)}</i>);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}
export function Md({ text, className = '' }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={'md ' + className}>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every(l => /^\s*[-•]\s/.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•]\s/, ''))}</li>)}</ul>;
        if (lines.every(l => /^\s*\d+\.\s/.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+\.\s/, ''))}</li>)}</ol>;
        if (/^>\s?/.test(b)) return <div key={i} className="tip">{lines.map((l, j) => <Fragment key={j}>{inline(l.replace(/^>\s?/, ''))}{j < lines.length - 1 && <br />}</Fragment>)}</div>;
        if (/^###\s/.test(b)) return <h3 key={i}>{inline(b.replace(/^###\s/, ''))}</h3>;
        if (/^\|/.test(b)) {
          const rows = lines.filter(l => !/^\|\s*-/.test(l)).map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
          return <div key={i} className="tbl-wrap"><table className="tbl"><thead><tr>{rows[0].map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead><tbody>{rows.slice(1).map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody></table></div>;
        }
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{inline(l)}{j < lines.length - 1 && <br />}</Fragment>)}</p>;
      })}
    </div>
  );
}

// ---------- static code view ----------
export function Code({ code, active, hi, anno, onLine, reveal, note, className = '', compact }: {
  code: string; active?: number; hi?: Set<number>; anno?: Record<number, string>; onLine?: (n: number) => void;
  reveal?: boolean; note?: { line: number; text: string; ok?: boolean } | null; className?: string; compact?: boolean;
}) {
  const lines = code.replace(/\n$/, '').split('\n');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current.querySelector<HTMLElement>(`[data-l="${active}"]`);
    if (el) {
      const box = ref.current; const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
      box.scrollTo({ top, behavior: 'smooth' });
    }
  }, [active]);
  return (
    <div ref={ref} className={`code ${compact ? 'compact' : ''} ${className}`}>
      {lines.map((l, i) => {
        const n = i + 1;
        return (
          <Fragment key={i}>
            <div data-l={n} className={`row ${active === n ? 'on' : ''} ${hi?.has(n) ? 'hi' : ''} ${reveal ? 'rv' : ''} ${onLine ? 'tap' : ''}`}
              style={reveal ? { animationDelay: `${i * 55}ms` } : undefined} onClick={onLine ? () => onLine(n) : undefined}>
              <span className="gut">{n}</span>
              <span className="src">{hlLine(l).map((t, j) => <span key={j} className={'t-' + t.c}>{t.t}</span>)}{l === '' && ' '}
                {note && note.line === n && <span className={`cnote ${note.ok === false ? 'f' : note.ok ? 't' : ''}`}>{note.text}</span>}
              </span>
            </div>
            {anno?.[n] && <div className="anno" style={reveal ? { animationDelay: `${i * 55 + 200}ms` } : undefined}><span>{anno[n]}</span></div>}
          </Fragment>
        );
      })}
    </div>
  );
}

// ---------- action bar ----------
export type AState = 'idle' | 'ok' | 'bad' | 'read';
const PRAISE = ['Nice!', 'Clean compile!', '0 errors, 0 warnings.', 'You got it!', 'Correct!', 'Exactly right.', 'Sharp!'];
export function ActionBar({ state, onCheck, onContinue, onRetry, disabled, label = 'Check', explain, title }: {
  state: AState; onCheck?: () => void; onContinue: () => void; onRetry?: () => void; disabled?: boolean; label?: string; explain?: ReactNode; title?: string;
}) {
  const praise = useRef(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  // portal: animated ancestors (transform / will-change) would otherwise trap position:fixed
  return createPortal(
    <div className={`abar ${state}`}>
      {(state === 'ok' || state === 'bad') && (
        <div className="abar-fb">
          <div className="abar-title">{state === 'ok' ? '✓ ' + (title ?? praise.current) : '✗ ' + (title ?? 'Not quite.')}</div>
          {explain && <div className="abar-ex">{typeof explain === 'string' ? <Md text={explain} /> : explain}</div>}
        </div>
      )}
      <div className="abar-row">
        {state === 'idle' && <button className="btn primary big" disabled={disabled} onClick={onCheck}>{label}</button>}
        {state === 'read' && <button className="btn primary big" onClick={onContinue}>Continue <span className="kbd">↵</span></button>}
        {state === 'ok' && <button className="btn ok big" onClick={onContinue}>Continue <span className="kbd">↵</span></button>}
        {state === 'bad' && <button className="btn bad big" onClick={onRetry}>Try again</button>}
      </div>
    </div>,
    document.body,
  );
}

// ---------- confetti made of C tokens ----------
const GLYPHS = ['{', '}', ';', '++', '&&', '%d', '==', '()', '*', '#', '\\n', '<=', '&', 'int', '0;'];
const COLORS = ['#7cf2c5', '#ffb86b', '#ff7ab2', '#6bdfff', '#9ef0a3', '#c792ea', '#ffd166'];
export function burst(intensity = 1) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d')!; ctx.scale(dpr, dpr);
  const N = Math.round(70 * intensity);
  const ps = Array.from({ length: N }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.62,
    vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 15 - 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    g: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], c: COLORS[Math.floor(Math.random() * COLORS.length)], s: 12 + Math.random() * 10,
  }));
  const t0 = performance.now();
  const tick = (t: number) => {
    const el = t - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - el / 1900);
      ctx.fillStyle = p.c; ctx.font = `700 ${p.s}px "JetBrains Mono Variable", monospace`;
      ctx.fillText(p.g, 0, 0); ctx.restore();
    }
    if (el < 1900) requestAnimationFrame(tick); else cv.remove();
  };
  requestAnimationFrame(tick);
}

export function buzz(ms: number | number[] = 12) { try { navigator.vibrate?.(ms); } catch { /* */ } }

export function Ring({ value, size = 44, stroke = 4, color = 'var(--acc)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line2)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  );
}
