// AST -> ANSI flowchart (structured auto-layout). Every node keeps the trace keys of the code it came from.
import type { N, Program } from './parser';
import { PREC } from './parser';

export type Shape = 'term' | 'io' | 'proc' | 'init' | 'dec' | 'call' | 'conn';
export interface FNode { i: number; shape: Shape; x: number; y: number; w: number; h: number; lines: string[]; keys: string[]; l0: number; l1: number }
export interface FEdge { pts: number[][]; arrow: boolean }
export interface FLabel { x: number; y: number; t: string; anchor?: 'start' | 'end' | 'middle' }
export interface Flow { nodes: FNode[]; edges: FEdge[]; labels: FLabel[]; dots: number[][]; minX: number; maxX: number; h: number; keyMap: Record<string, number> }

type F =
  | { t: 'node'; shape: Shape; text: string[]; keys: string[]; l0: number; l1: number; stop?: boolean }
  | { t: 'seq'; items: F[] }
  | { t: 'if'; text: string[]; keys: string[]; yes: F; no: F | null; l0: number; l1: number }
  | { t: 'while' | 'do'; text: string[]; keys: string[]; body: F; l0: number; l1: number };

const CW = 6.7, LH = 14, GAP = 24, HGAP = 30;
const FOPS: Record<string, string> = { '%': 'mod', '==': '=', '!=': '≠', '<=': '≤', '>=': '≥', '&&': 'and', '||': 'or', '*': '×' };
const SUP: Record<string, string> = { '2': '²', '3': '³' };

export function fx(e: N): string {
  const s = fx0(e);
  return e.paren ? `(${s})` : s;
}
function fx0(e: N): string {
  switch (e.k) {
    case 'num': if (e.mac) return /^(PI|M_PI)$/i.test(e.mac) ? 'π' : e.mac; return e.isChar ? e.raw : String(e.raw).replace(/[fFlLuU]+$/, '');
    case 'str': return JSON.stringify(e.v);
    case 'id': return e.name === 'M_PI' ? 'π' : e.name;
    case 'unary': if (e.op === '!') return 'not ' + fx(e.e); if (e.op === '&' || e.op === '+') return fx(e.e); return e.op + fx(e.e);
    case 'update': return `${fx(e.e)} = ${fx(e.e)} ${e.op === '++' ? '+' : '-'} 1`;
    case 'bin': return `${fx(e.l)} ${FOPS[e.op] ?? e.op} ${fx(e.r)}`;
    case 'assign': {
      if (e.op === '=') return `${fx(e.l)} = ${fx(e.r)}`;
      const op = e.op.slice(0, -1);
      const r = e.r.k === 'bin' && !e.r.paren && (PREC[e.r.op] ?? 99) <= (PREC[op] ?? 0) ? `(${fx(e.r)})` : fx(e.r);
      return `${fx(e.l)} = ${fx(e.l)} ${FOPS[op] ?? op} ${r}`;
    }
    case 'call': {
      const a: N[] = e.args;
      if (e.name === 'pow' && a.length === 2 && a[1].k === 'num' && SUP[a[1].raw]) {
        const b = fx(a[0]); return (/^[\w.π]+$/.test(b) || a[0].paren ? b : `(${b})`) + SUP[a[1].raw];
      }
      if (e.name === 'sqrt' && a.length === 1) { const b = fx(a[0]); return `√${b.startsWith('(') && a[0].paren ? b : `(${b})`}`; }
      if ((e.name === 'fabs' || e.name === 'abs') && a.length === 1) return `|${fx(a[0])}|`;
      return `${e.name}(${a.map(fx).join(', ')})`;
    }
    case 'cast': return fx(e.e);
    case 'cond': return `${fx(e.c)} ? ${fx(e.t)} : ${fx(e.f)}`;
    case 'index': return `${fx(e.arr)}[${fx(e.idx)}]`;
    case 'comma': return `${fx(e.l)}, ${fx(e.r)}`;
    case 'sizeof': return 'sizeof(…)';
  }
  return '…';
}

function wrap(text: string, max: number): string[] {
  const words = text.split(' '); const out: string[] = []; let cur = '';
  for (let w of words) {
    while (w.length > max) { if (cur) { out.push(cur); cur = ''; } out.push(w.slice(0, max)); w = w.slice(max); }
    if (!cur) cur = w; else if ((cur + ' ' + w).length <= max) cur += ' ' + w; else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

const FMT = /%[-+ #0]*(\d+|\*)?(?:\.(\d+|\*))?(hh|h|ll|l|L)?[diouxXeEfFgGcsp]/g;
function displayParts(call: N): string {
  const f = call.args[0];
  if (!f || f.k !== 'str') return 'Display ' + call.args.map(fx).join(', ');
  const parts: string[] = []; let last = 0, ai = 1; let m: RegExpExecArray | null;
  const clean = (t: string) => t.replace(/[\n\t\r]/g, ' ').replace(/%%/g, '%').replace(/\s+/g, ' ').trim();
  FMT.lastIndex = 0;
  while ((m = FMT.exec(f.v))) {
    const t = clean(f.v.slice(last, m.index)); if (t) parts.push(`"${t}"`);
    const a = call.args[ai++]; if (a) parts.push(fx(a));
    last = FMT.lastIndex;
  }
  const t = clean(f.v.slice(last)); if (t) parts.push(`"${t}"`);
  if (!parts.length) return 'Display new line';
  return 'Display ' + parts.join(', ');
}

type Cls = 'skip' | 'init' | 'proc' | 'in' | 'out' | 'call' | 'stop' | 'complex';
function callOf(s: N): N | null {
  if (s.k !== 'expr') return null;
  let e = s.e; if (e.k === 'assign' && e.r.k === 'call') e = e.r;
  return e.k === 'call' ? e : null;
}
function classify(s: N, prog: Program): Cls {
  switch (s.k) {
    case 'empty': case 'case': case 'default': return 'skip';
    case 'decl': return s.items.some((i: any) => i.init) ? 'init' : 'skip';
    case 'expr': {
      const c = callOf(s);
      if (c) {
        if (['printf', 'puts', 'putchar'].includes(c.name)) return 'out';
        if (['scanf', 'getchar', 'gets'].includes(c.name)) return 'in';
        if (['getch', 'getche', 'clrscr', 'system', 'fflush', 'srand'].includes(c.name)) return 'skip';
        if (c.name === 'exit') return 'stop';
        if (prog.funcs[c.name]) return 'call';
      }
      return 'proc';
    }
  }
  return 'complex';
}
const isPrompt = (s: N) => { const c = callOf(s); return !!c && c.name === 'printf' && c.args.length === 1; };
const key = (s: N) => String(s.id);

function lines(s: N, c: Cls): string[] {
  if (c === 'init') return [s.items.filter((i: any) => i.init).map((i: any) => `${i.name} = ${i.init.k === 'initlist' ? '{…}' : fx(i.init)}`).join(', ')];
  const call = callOf(s);
  if (c === 'out' && call) return [call.name === 'printf' ? displayParts(call) : `Display ${call.args.map(fx).join(', ')}`];
  if (c === 'in' && call) return [`Input ${call.args.slice(call.name === 'scanf' ? 1 : 0).map(fx).join(', ') || 'char'}`];
  if (c === 'call' && call) return [fx(s.e)];
  return [fx(s.e)];
}

function node(shape: Shape, text: string[], keys: string[], l0: number, l1: number, stop = false): F {
  return { t: 'node', shape, text, keys, l0, l1, stop };
}

function stmtsF(list: N[], prog: Program, fnName: string): F {
  const out: F[] = [];
  let i = 0;
  while (i < list.length) {
    const s = list[i]; const c = classify(s, prog);
    if (c === 'skip') { i++; continue; }
    if (c === 'out' && isPrompt(s) && i + 1 < list.length && classify(list[i + 1], prog) === 'in') {
      const nx = list[i + 1];
      out.push(node('io', lines(nx, 'in'), [key(s), key(nx)], s.line, nx.endLine ?? nx.line)); i += 2; continue;
    }
    if (c === 'init' || c === 'proc' || c === 'out' || c === 'in') {
      const grp = [s]; let j = i + 1;
      while (j < list.length && grp.length < 4 && classify(list[j], prog) === c && !(c === 'out' && isPrompt(list[j]) && j + 1 < list.length && classify(list[j + 1], prog) === 'in')) { grp.push(list[j]); j++; }
      let txt = grp.flatMap(g => lines(g, c));
      if (c === 'init' && txt.join(', ').length <= 26) txt = [txt.join(', ')];
      out.push(node(c === 'in' || c === 'out' ? 'io' : c, txt, grp.map(key), s.line, grp[grp.length - 1].endLine ?? grp[grp.length - 1].line));
      i = j; continue;
    }
    if (c === 'call') { out.push(node('call', lines(s, c), [key(s)], s.line, s.endLine ?? s.line)); i++; continue; }
    if (c === 'stop') { out.push(node('term', ['End'], [key(s)], s.line, s.line, true)); i++; continue; }
    out.push(complexF(s, prog, fnName)); i++;
  }
  return { t: 'seq', items: out };
}

function complexF(s: N, prog: Program, fnName: string): F {
  const sub = (x: N | null): F => (!x ? { t: 'seq', items: [] } : x.k === 'block' ? stmtsF(x.body, prog, fnName) : stmtsF([x], prog, fnName));
  const q = (e: N) => [`Is ${fx(e)}?`];
  switch (s.k) {
    case 'block': return stmtsF(s.body, prog, fnName);
    case 'if': return { t: 'if', text: q(s.cond), keys: [`${s.id}:cond`], yes: sub(s.then), no: s.els ? sub(s.els) : null, l0: s.line, l1: s.cond.endLine ?? s.line };
    case 'while': return { t: 'while', text: q(s.cond), keys: [`${s.id}:cond`], body: sub(s.body), l0: s.line, l1: s.line };
    case 'do': return { t: 'do', text: q(s.cond), keys: [`${s.id}:cond`], body: sub(s.body), l0: s.condLine ?? s.line, l1: s.condLine ?? s.line };
    case 'for': {
      const items: F[] = [];
      if (s.init) items.push(node('init', [s.init.k === 'decl' ? s.init.items.map((i: any) => `${i.name} = ${i.init ? fx(i.init) : '?'}`).join(', ') : fx(s.init)], [`${s.id}:init`], s.line, s.line));
      const body = sub(s.body) as { t: 'seq'; items: F[] };
      const bodyItems = [...body.items];
      if (s.update) bodyItems.push(node('proc', [fx(s.update)], [`${s.id}:update`], s.line, s.line));
      items.push({ t: 'while', text: s.cond ? q(s.cond) : ['Forever?'], keys: [`${s.id}:cond`], body: { t: 'seq', items: bodyItems }, l0: s.line, l1: s.line });
      return { t: 'seq', items };
    }
    case 'switch': {
      const body: N[] = s.body.k === 'block' ? s.body.body : [s.body];
      const groups: { label: N | null; stmts: N[] }[] = [];
      for (const st of body) {
        if (st.k === 'case' || st.k === 'default') groups.push({ label: st.k === 'case' ? st.value : null, stmts: [] });
        else if (groups.length && st.k !== 'break') groups[groups.length - 1].stmts.push(st);
      }
      let chain: F | null = null;
      for (let gi = groups.length - 1; gi >= 0; gi--) {
        const g = groups[gi];
        const blk = stmtsF(g.stmts, prog, fnName);
        if (!g.label) { chain = blk; continue; }
        chain = { t: 'if', text: [`Is ${fx(s.disc)} = ${fx(g.label)}?`], keys: [`${s.id}:cond`], yes: blk, no: chain, l0: s.line, l1: s.line };
      }
      return chain ?? { t: 'seq', items: [] };
    }
    case 'break': return node('conn', ['exit loop'], [key(s)], s.line, s.line, true);
    case 'continue': return node('conn', ['next round'], [key(s)], s.line, s.line, true);
    case 'return': return node('term', [fnName === 'main' ? 'End' : `Return ${s.e ? fx(s.e) : ''}`.trim()], [key(s)], s.line, s.line, true);
  }
  return { t: 'seq', items: [] };
}

// ---------------- layout ----------------
interface B { nodes: FNode[]; edges: FEdge[]; labels: FLabel[]; dots: number[][]; h: number; stop: boolean }
const empty = (): B => ({ nodes: [], edges: [], labels: [], dots: [], h: 0, stop: false });
function shift(b: B, dx: number, dy: number): B {
  return {
    nodes: b.nodes.map(n => ({ ...n, x: n.x + dx, y: n.y + dy })),
    edges: b.edges.map(e => ({ ...e, pts: e.pts.map(([x, y]) => [x + dx, y + dy]) })),
    labels: b.labels.map(l => ({ ...l, x: l.x + dx, y: l.y + dy })),
    dots: b.dots.map(([x, y]) => [x + dx, y + dy]), h: b.h, stop: b.stop,
  };
}
function merge(a: B, b: B) { a.nodes.push(...b.nodes); a.edges.push(...b.edges); a.labels.push(...b.labels); a.dots.push(...b.dots); }
function rightIn(b: B, y0: number, y1: number) {
  let r = -Infinity;
  for (const n of b.nodes) if (n.y < y1 && n.y + n.h > y0) r = Math.max(r, n.x + n.w);
  for (const e of b.edges) for (let i = 0; i < e.pts.length - 1; i++) {
    const [ax, ay] = e.pts[i], [bx, by] = e.pts[i + 1];
    if (Math.min(ay, by) <= y1 && Math.max(ay, by) >= y0) r = Math.max(r, ax, bx);
  }
  for (const l of b.labels) if (l.y > y0 && l.y < y1) r = Math.max(r, l.x + (l.anchor === 'end' ? 0 : l.t.length * 6));
  return r;
}
function leftAll(b: B) {
  let r = Infinity;
  for (const n of b.nodes) r = Math.min(r, n.x);
  for (const e of b.edges) for (const [x] of e.pts) r = Math.min(r, x);
  for (const l of b.labels) r = Math.min(r, l.anchor === 'end' ? l.x - l.t.length * 6 : l.x);
  return r;
}
function mkNode(shape: Shape, text: string[], keys: string[], l0: number, l1: number): FNode {
  const max = shape === 'dec' ? 20 : 26;
  const ls = text.flatMap(t => wrap(t, max));
  const tw = Math.max(...ls.map(l => l.length)) * CW, th = ls.length * LH;
  let w = 0, h = 0;
  switch (shape) {
    case 'term': w = Math.max(76, tw + 32); h = Math.max(30, th + 14); break;
    case 'io': w = Math.max(104, tw + 44); h = th + 18; break;
    case 'init': w = Math.max(104, tw + 40); h = th + 18; break;
    case 'proc': case 'call': w = Math.max(104, tw + 28); h = th + 18; break;
    case 'dec': w = Math.max(124, tw * 1.55 + 44); h = Math.max(62, th * 2 + 24); break;
    case 'conn': w = Math.max(70, tw + 26); h = 26; break;
  }
  return { i: 0, shape, x: -w / 2, y: 0, w, h, lines: ls, keys, l0, l1 };
}

function lay(f: F): B {
  switch (f.t) {
    case 'node': { const n = mkNode(f.shape, f.text, f.keys, f.l0, f.l1); const b = empty(); b.nodes.push(n); b.h = n.h; b.stop = !!f.stop; return b; }
    case 'seq': {
      const res = empty(); let y = 0, first = true;
      for (const it of f.items) {
        if (res.stop) break;
        const b = lay(it);
        if (!b.nodes.length && !b.edges.length) continue;
        if (!first) { res.edges.push({ pts: [[0, y], [0, y + GAP]], arrow: true }); y += GAP; }
        merge(res, shift(b, 0, y)); y += b.h; first = false; res.stop = b.stop;
      }
      res.h = y; return res;
    }
    case 'if': {
      const res = empty();
      const d = mkNode('dec', f.text, f.keys, f.l0, f.l1); res.nodes.push(d);
      const cy = d.h / 2;
      const yes = lay(f.yes), no = f.no ? lay(f.no) : null;
      const hasNo = !!no && (no.nodes.length > 0 || no.edges.length > 0);
      const noTop = d.h + GAP;
      const noB = hasNo ? shift(no!, 0, noTop) : null;
      const noBottom = noB ? noTop + no!.h : d.h;
      const yesTop = cy + 22;
      const yesEmpty = !yes.nodes.length;
      let clear = d.w / 2;
      if (noB) clear = Math.max(clear, rightIn(noB, yesTop - 6, yesTop + yes.h + 6));
      const tx = yesEmpty ? clear + HGAP : clear + HGAP - leftAll(yes);
      const yesB = shift(yes, tx, yesTop);
      merge(res, yesB); if (noB) merge(res, noB);
      const yesBottom = yesTop + yes.h;
      res.edges.push({ pts: [[d.w / 2, cy], [tx, cy], [tx, yesTop]], arrow: !yesEmpty });
      res.labels.push({ x: d.w / 2 + 5, y: cy - 6, t: 'Yes' });
      const mergeY = Math.max(yesBottom, noBottom) + GAP;
      if (noB) {
        res.edges.push({ pts: [[0, d.h], [0, noTop]], arrow: true });
        if (!no!.stop) res.edges.push({ pts: [[0, noBottom], [0, mergeY]], arrow: false });
      } else res.edges.push({ pts: [[0, d.h], [0, mergeY]], arrow: false });
      res.labels.push({ x: 7, y: d.h + 13, t: 'No' });
      if (!yes.stop) {
        let bus = tx;
        if (noB) { const r = rightIn(noB, yesBottom, mergeY); if (r + 12 > bus) bus = r + HGAP / 2; }
        const pts = [[tx, yesBottom]];
        if (bus !== tx) { pts.push([tx, yesBottom + GAP / 3]); pts.push([bus, yesBottom + GAP / 3]); }
        pts.push([bus, mergeY]); pts.push([0, mergeY]);
        res.edges.push({ pts, arrow: true });
      }
      res.stop = yes.stop && (hasNo ? no!.stop : false);
      if (!res.stop) res.dots.push([0, mergeY]);
      res.h = mergeY; return res;
    }
    case 'while': {
      const res = empty();
      const d = mkNode('dec', f.text, f.keys, f.l0, f.l1); d.y = 14; res.nodes.push(d);
      res.edges.push({ pts: [[0, 0], [0, d.y]], arrow: true });
      const cy = d.y + d.h / 2;
      const body = lay(f.body);
      const bTop = d.y + d.h + GAP;
      const bodyB = shift(body, 0, bTop); merge(res, bodyB);
      const bBottom = bTop + body.h;
      if (body.nodes.length) res.edges.push({ pts: [[0, d.y + d.h], [0, bTop]], arrow: true });
      res.labels.push({ x: 7, y: d.y + d.h + 13, t: 'Yes' });
      const backY = bBottom + GAP * 0.6;
      const leftX = Math.min(-d.w / 2, leftAll(bodyB)) - HGAP * 0.75;
      if (!body.stop) res.edges.push({ pts: [[0, body.nodes.length ? bBottom : d.y + d.h], [0, backY], [leftX, backY], [leftX, 7], [0, 7]], arrow: true });
      res.dots.push([0, 7]);
      const rightX = Math.max(d.w / 2, rightIn(bodyB, -1e9, 1e9)) + HGAP * 0.75;
      const exitY = backY + GAP * 0.75;
      res.edges.push({ pts: [[d.w / 2, cy], [rightX, cy], [rightX, exitY], [0, exitY]], arrow: true });
      res.labels.push({ x: d.w / 2 + 5, y: cy - 6, t: 'No' });
      res.h = exitY; return res;
    }
    case 'do': {
      const res = empty();
      const body = lay(f.body);
      const bTop = 14;
      res.edges.push({ pts: [[0, 0], [0, bTop]], arrow: true });
      const bodyB = shift(body, 0, bTop); merge(res, bodyB);
      const bBottom = bTop + body.h;
      const d = mkNode('dec', f.text, f.keys, f.l0, f.l1); d.y = bBottom + GAP; res.nodes.push(d);
      res.edges.push({ pts: [[0, bBottom], [0, d.y]], arrow: true });
      const cy = d.y + d.h / 2;
      const leftX = Math.min(-d.w / 2, leftAll(bodyB)) - HGAP * 0.75;
      res.edges.push({ pts: [[-d.w / 2, cy], [leftX, cy], [leftX, 7], [0, 7]], arrow: true });
      res.dots.push([0, 7]);
      res.labels.push({ x: -d.w / 2 - 5, y: cy - 6, t: 'Yes', anchor: 'end' });
      res.labels.push({ x: 7, y: d.y + d.h + 13, t: 'No' });
      res.h = d.y + d.h; return res;
    }
  }
}

export function buildFlow(prog: Program, fnName = 'main'): Flow | null {
  const fn = prog.funcs[fnName];
  if (!fn) return null;
  const body: N[] = [...fn.body.body];
  const endKeys = [`f:${fnName}:exit`];
  let endLabel = fnName === 'main' ? 'End' : 'Return';
  const last = body[body.length - 1];
  if (last && last.k === 'return') {
    endKeys.push(String(last.id)); body.pop();
    if (fnName !== 'main' && last.e) endLabel = `Return ${fx(last.e)}`;
  }
  const params = fn.params.filter((p: any) => p.name).map((p: any) => p.name).join(', ');
  const f: F = {
    t: 'seq', items: [
      node('term', [fnName === 'main' ? 'Start' : `${fnName}(${params})`], [`f:${fnName}:enter`], fn.line, fn.line),
      stmtsF(body, prog, fnName),
      node('term', [endLabel], endKeys, last && last.k === 'return' ? last.line : (fn.endLine ?? fn.line), fn.endLine ?? fn.line),
    ],
  };
  const b = lay(f);
  const keyMap: Record<string, number> = {};
  b.nodes.forEach((n, i) => { n.i = i; for (const k of n.keys) keyMap[k] = i; });
  let minX = Infinity, maxX = -Infinity;
  for (const n of b.nodes) { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x + n.w); }
  for (const e of b.edges) for (const [x] of e.pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
  for (const l of b.labels) { minX = Math.min(minX, l.anchor === 'end' ? l.x - 24 : l.x); maxX = Math.max(maxX, l.x + 24); }
  return { nodes: b.nodes, edges: b.edges, labels: b.labels, dots: b.dots, minX, maxX, h: b.h, keyMap };
}
