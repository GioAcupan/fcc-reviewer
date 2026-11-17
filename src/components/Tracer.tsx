import { useEffect, useMemo, useRef, useState } from 'react';
import { compile, run, Compiled, RunResult } from '../engine/interp';
import { buildFlow, fx } from '../engine/flow';
import type { N } from '../engine/parser';
import { Flowchart } from './Flowchart';
import { Code } from './ui';
import { Output } from './Console';

function indexStmts(c: Compiled) {
  const map: Record<string, N> = {};
  const walk = (n: any) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (n.k && n.id) map[n.id] = n;
    for (const k of ['body', 'then', 'els', 'init', 'items']) if (n[k]) walk(n[k]);
  };
  c.prog?.funcList.forEach(f => walk(f.body));
  return map;
}

export function caption(key: string, note: string | undefined, stm: Record<string, N>, out: string, prevOut: number, curOut: number, vars: { name: string; val: string }[]) {
  if (key.startsWith('f:')) {
    const [, fn, what] = key.split(':');
    return what === 'enter' ? (fn === 'main' ? '▶ Start: the program begins inside main().' : `↪ Calling ${fn}()`) : (fn === 'main' ? '■ End: main() finished.' : `↩ ${fn}() finished`);
  }
  const [id, part] = key.split(':');
  const s = stm[id]; if (!s) return '';
  const v = (name: string) => vars.find(x => x.name === name)?.val;
  if (part === 'cond') {
    if (s.k === 'switch') return `◆ switch on ${fx(s.disc)} → ${note}`;
    const yes = note === 'true';
    const what = s.k === 'if' ? (yes ? 'take the Yes branch' : (s.els ? 'take the No (else) branch' : 'skip the if-body')) : s.k === 'do' ? (yes ? 'loop back up' : 'exit the loop') : (yes ? 'enter the loop body' : 'exit the loop');
    return `◆ Is ${fx(s.cond)}?  → ${yes ? 'YES' : 'NO'}, so ${what}.`;
  }
  if (part === 'init') return `⬡ Loop setup: ${s.init.k === 'decl' ? s.init.items.map((i: any) => `${i.name} = ${v(i.name)}`).join(', ') : fx(s.init)}`;
  if (part === 'update') { const n = s.update.e?.name ?? s.update.l?.name; return `▭ Update: ${fx(s.update)}${n ? ` → ${n} is now ${v(n)}` : ''}`; }
  switch (s.k) {
    case 'decl': {
      const parts = s.items.map((i: any) => `${i.name}${i.init ? ' = ' + v(i.name) : ' (no value yet → garbage)'}`);
      return `⬡ Create ${parts.join(', ')}`;
    }
    case 'return': return `■ return ${s.e ? fx(s.e) : ''}`;
    case 'break': return '⤳ break: jump out of the loop/switch.';
    case 'continue': return '⤳ continue: skip to the next round.';
    case 'expr': {
      const e = s.e; const call = e.k === 'call' ? e : e.k === 'assign' && e.r.k === 'call' ? e.r : null;
      if (call?.name === 'printf' || call?.name === 'puts' || call?.name === 'putchar') {
        const txt = out.slice(prevOut, curOut).replace(/\n/g, '⏎');
        return `▱ Display: “${txt.length > 48 ? txt.slice(0, 48) + '…' : txt}”`;
      }
      if (call?.name === 'scanf') {
        const names = call.args.slice(1).map((a: N) => (a.k === 'unary' ? a.e.name : a.name)).filter(Boolean);
        return `▱ Input: read ${names.map((n: string) => `${n} = ${v(n)}`).join(', ')}`;
      }
      const tgt = e.k === 'assign' ? (e.l.name ?? fx(e.l)) : e.k === 'update' ? e.e.name : null;
      return `▭ ${fx(e)}${tgt ? `  → ${tgt} is now ${v(tgt) ?? '…'}` : ''}`;
    }
  }
  return '';
}

export interface TraceData { compiled: Compiled; result: RunResult; echoes?: { at: number; text: string }[] }
// Feeds stdin one line at a time (like a user typing) so the replay can show the typed input inline.
export function traceCode(code: string, stdin = ''): TraceData | null {
  const c = compile(code);
  if (!c.ok) return null;
  const lines = stdin.split('\n'); if (lines[lines.length - 1] === '') lines.pop();
  const echoes: { at: number; text: string }[] = [];
  let acc = '', k = 0;
  let r = run(c, { stdin: acc, interactive: true, trace: true, traceLimit: 3000 });
  while (r.status === 'needInput' && k < lines.length) {
    echoes.push({ at: r.output.length, text: lines[k] }); acc += lines[k] + '\n'; k++;
    r = run(c, { stdin: acc, interactive: true, trace: true, traceLimit: 3000 });
  }
  if (r.status === 'needInput') r = run(c, { stdin: acc, trace: true, traceLimit: 3000 });
  return { compiled: c, result: r, echoes };
}

export function Tracer({ data, autoplay = false, speed: sp0 = 1, echoes, compact, showFlow = true, height }: {
  data: TraceData; autoplay?: boolean; speed?: number; echoes?: { at: number; text: string }[]; compact?: boolean; showFlow?: boolean; height?: string;
}) {
  const { compiled, result } = data;
  echoes = echoes ?? data.echoes;
  const trace = result.trace;
  const flow = useMemo(() => (compiled.prog ? buildFlow(compiled.prog) : null), [compiled]);
  const stm = useMemo(() => indexStmts(compiled), [compiled]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(sp0);
  const [view, setView] = useState<'split' | 'code' | 'flow'>(showFlow ? 'split' : 'code');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => { setI(0); setPlaying(autoplay); }, [data, autoplay]);
  useEffect(() => {
    if (!playing) return;
    if (i >= trace.length - 1) { setPlaying(false); return; }
    timer.current = window.setTimeout(() => setI(x => Math.min(trace.length - 1, x + 1)), 900 / speed);
    return () => clearTimeout(timer.current);
  }, [playing, i, speed, trace.length]);
  if (!trace.length) return <div className="tracer empty">Nothing to trace.</div>;
  const ev = trace[Math.min(i, trace.length - 1)];
  const prev = i > 0 ? trace[i - 1] : null;
  const active = flow ? (flow.keyMap[ev.key] ?? -1) : -1;
  const visited = new Set<number>();
  if (flow) for (let k = 0; k <= i; k++) { const n = flow.keyMap[trace[k].key]; if (n !== undefined) visited.add(n); }
  const changed = new Set(ev.vars.filter(v => { const p = prev?.vars.find(x => x.name === v.name); return !p || p.val !== v.val; }).map(v => v.name));
  const cap = caption(ev.key, ev.note, stm, result.output, prev?.out ?? 0, ev.out, ev.vars);
  const done = i >= trace.length - 1;
  const condNote = ev.note && ev.key.endsWith(':cond') ? { line: ev.line, text: ev.note === 'true' ? 'YES' : ev.note === 'false' ? 'NO' : ev.note, ok: ev.note === 'true' ? true : ev.note === 'false' ? false : undefined } : null;
  return (
    <div className={`tracer ${compact ? 'compact' : ''}`}>
      <div className="cap" key={i}><span className="cap-step">{String(i + 1).padStart(2, '0')}/{trace.length}</span><span className="cap-t">{cap}</span></div>
      {showFlow && flow && (
        <div className="seg" role="tablist">
          {(['split', 'code', 'flow'] as const).map(v => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v === 'split' ? 'Code + Flow' : v === 'code' ? 'Code' : 'Flowchart'}</button>)}
        </div>
      )}
      <div className={`tr-panes ${view}`} style={height ? { maxHeight: height } : undefined}>
        {view !== 'flow' && <Code code={compiled.src} active={ev.line} note={condNote} className="tr-code" />}
        {view !== 'code' && flow && <Flowchart flow={flow} active={active} visited={visited} playing={playing} maxH={view === 'flow' ? '62vh' : '46vh'} />}
      </div>
      <div className="vars">
        {ev.vars.length === 0 && <span className="var empty">no variables yet</span>}
        {ev.vars.map(v => (
          <span key={v.name + (changed.has(v.name) ? i : '')} className={`var ${changed.has(v.name) ? 'chg' : ''} ${v.val === '?' ? 'garb' : ''}`}>
            <span className="vt">{v.type}</span><span className="vn">{v.name}</span><span className="vv">{v.val}</span>
          </span>
        ))}
      </div>
      <pre className="mini-out"><span className="mo-l">stdout</span><Output text={result.output.slice(0, ev.out)} echoes={(echoes ?? []).filter(e => e.at <= ev.out)} />{!done && <span className="caret">▌</span>}</pre>
      {done && result.error && <div className="rt-err small">💥 {result.error.msg}</div>}
      <div className="tctl">
        <button className="ic-btn" onClick={() => { setPlaying(false); setI(0); }} aria-label="Restart">⏮</button>
        <button className="ic-btn" onClick={() => { setPlaying(false); setI(x => Math.max(0, x - 1)); }} aria-label="Step back">◀</button>
        <button className="ic-btn play" onClick={() => { if (done) setI(0); setPlaying(p => !p); }} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
        <button className="ic-btn" onClick={() => { setPlaying(false); setI(x => Math.min(trace.length - 1, x + 1)); }} aria-label="Step forward">▶|</button>
        <input type="range" min={0} max={trace.length - 1} value={i} onChange={e => { setPlaying(false); setI(+e.target.value); }} aria-label="Scrub through steps" />
        <button className="ic-btn spd" onClick={() => setSpeed(s => (s >= 4 ? 0.5 : s * 2))}>{speed}×</button>
      </div>
      {result.traceTruncated && done && <div className="sys">Trace shows the first {trace.length} steps.</div>}
    </div>
  );
}
