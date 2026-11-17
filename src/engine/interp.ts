// Tree-walking interpreter for the C subset, with trace recording for the visualizer
import { CError, Diag } from './lexer';
import { parse, Base, N, Program, Ty } from './parser';
import { check, CONSTS, fmtSpecs, isFloat } from './check';

export interface VarSnap { name: string; type: string; val: string }
export interface TraceEv { key: string; line: number; vars: VarSnap[]; out: number; fn: string; depth: number; note?: string }
export interface RunOpts { stdin?: string; interactive?: boolean; trace?: boolean; maxSteps?: number; traceLimit?: number; timeLimitMs?: number }
export interface RunResult {
  status: 'ok' | 'error' | 'needInput' | 'timeout' | 'inputEnd';
  output: string; exitCode: number;
  error?: { msg: string; line: number; hint?: string };
  rdiags: Diag[]; trace: TraceEv[]; traceTruncated: boolean; stdinLeft: string; steps: number;
}
export interface Compiled { ok: boolean; prog: Program | null; diags: Diag[]; src: string }

export function compile(src: string): Compiled {
  try {
    const prog = parse(src);
    const diags = check(prog);
    diags.sort((a, b) => (a.sev === b.sev ? a.line - b.line : a.sev === 'error' ? -1 : 1));
    return { ok: !diags.some(d => d.sev === 'error'), prog, diags, src };
  } catch (e) {
    if (e instanceof CError) return { ok: false, prog: null, diags: [{ sev: 'error', line: e.line, col: e.col, msg: e.message, hint: e.hint }], src };
    return { ok: false, prog: null, diags: [{ sev: 'error', line: 1, col: 1, msg: 'internal compiler error: ' + (e as Error).message }], src };
  }
}

class Ptr {
  constructor(public data: any[], public idx: number, public b: Base, public p: number, public dims: number[], public owner?: Var) {}
}
interface Var { name: string; b: Base; p: number; data: any[]; dims: number[]; init: boolean; isArr: boolean }
interface Loc { data: any[]; idx: number; b: Base; p: number; dims: number[]; v?: Var }
interface Frame { fn: N; scopes: Map<string, Var>[]; ret: any }

class NeedInput { }
class ExitSig { constructor(public code: number) { } }
class RtErr { constructor(public msg: string, public line: number, public hint?: string, public kind: 'error' | 'timeout' | 'inputEnd' = 'error') { } }

const GARBAGE_INT = -858993460;
const GARBAGE_DBL = -9.255963134931783e61;
const prod = (a: number[]) => a.reduce((x, y) => x * y, 1);
const isSpace = (c: string) => c === ' ' || c === '\n' || c === '\t' || c === '\r' || c === '\f' || c === '\v';

function w32(v: number) {
  v = Math.trunc(v);
  if (v >= -2147483648 && v <= 2147483647) return v;
  if (!isFinite(v)) return -2147483648;
  return Number(BigInt.asIntN(32, BigInt(v)));
}
function w64(v: number) {
  v = Math.trunc(v);
  if (!isFinite(v)) return -9223372036854775808;
  if (Math.abs(v) < 9.2e18) return v;
  return Number(BigInt.asIntN(64, BigInt(v)));
}
export function conv(v: any, b: Base, p: number): any {
  if (p > 0) return v;
  if (v instanceof Ptr) return 4198400 + v.idx * 4; // pointer stuffed into an int: an "address"
  v = Number(v);
  switch (b) {
    case 'int': return w32(v);
    case 'long': return w64(v);
    case 'char': return ((Math.trunc(v) & 255) << 24) >> 24;
    case 'bool': return v ? 1 : 0;
    case 'float': return Math.fround(v);
    default: return v;
  }
}
function intStr(n: number) { return Number.isSafeInteger(n) ? String(n) : BigInt(Math.trunc(n)).toString(); }
function cExp(x: number, p: number, up: boolean) {
  let s = x.toExponential(p);
  s = s.replace(/e([+-])(\d)$/, 'e$10$2');
  return up ? s.toUpperCase() : s;
}
function cFixed(x: number, p: number) {
  if (!isFinite(x)) return isNaN(x) ? 'nan' : (x < 0 ? '-inf' : 'inf');
  if (Math.abs(x) >= 1e21) return BigInt(Math.round(x)).toString() + (p > 0 ? '.' + '0'.repeat(p) : '');
  return x.toFixed(Math.min(p, 100));
}
function cG(x: number, p: number, alt: boolean, up: boolean) {
  if (!isFinite(x)) return cFixed(x, 0);
  if (p === 0) p = 1;
  if (x === 0) return '0';
  const X = Math.floor(Math.log10(Math.abs(Number(x.toExponential(p - 1)))));
  let s = (p > X && X >= -4) ? x.toFixed(Math.max(0, p - 1 - X)) : cExp(x, p - 1, up);
  if (!alt) {
    if (s.includes('e') || s.includes('E')) s = s.replace(/\.?0+(?=[eE])/, '');
    else if (s.includes('.')) s = s.replace(/\.?0+$/, '');
  }
  return s;
}

export function fmtNum(v: number, b: Base) {
  if (b === 'float' || b === 'double') {
    if (!isFinite(v)) return String(v);
    if (Number.isInteger(v) && Math.abs(v) < 1e15) return v.toFixed(1);
    return String(parseFloat(v.toPrecision(b === 'float' ? 7 : 10)));
  }
  if (b === 'char') return v >= 32 && v < 127 ? `'${String.fromCharCode(v)}'` : v === 10 ? "'\\n'" : v === 0 ? "'\\0'" : String(v);
  return intStr(v);
}

class Machine {
  out = ''; inp: string; ip = 0; steps = 0; trace: TraceEv[] = []; truncated = false;
  globals = new Map<string, Var>(); frames: Frame[] = []; rdiags: Diag[] = [];
  warned = new Set<string>(); seed = 1; eofCalls = 0; t0 = 0;
  traceOn: boolean; tLimit: number; maxSteps: number; timeLimit: number; interactive: boolean;
  strCache = new Map<N, Ptr>();
  constructor(public prog: Program, o: RunOpts) {
    this.inp = o.stdin ?? ''; this.traceOn = !!o.trace; this.tLimit = o.traceLimit ?? 1500;
    this.maxSteps = o.maxSteps ?? 3_000_000; this.timeLimit = o.timeLimitMs ?? 2500; this.interactive = !!o.interactive;
  }
  frame() { return this.frames[this.frames.length - 1]; }
  scope() { const f = this.frame(); return f.scopes[f.scopes.length - 1]; }
  lookup(name: string): Var | undefined {
    const f = this.frame();
    if (f) for (let i = f.scopes.length - 1; i >= 0; i--) { const v = f.scopes[i].get(name); if (v) return v; }
    return this.globals.get(name);
  }
  tick(line: number) {
    if (++this.steps > this.maxSteps || ((this.steps & 8191) === 0 && performance.now() - this.t0 > this.timeLimit))
      throw new RtErr('Your program ran for too long and was stopped — most likely an infinite loop.', line, 'Check that the loop variable changes every time (like i++ or n = n / 10) so the condition eventually becomes false.', 'timeout');
  }
  rdiag(line: number, msg: string, hint?: string) {
    if (this.warned.has(msg)) return; this.warned.add(msg);
    this.rdiags.push({ sev: 'warning', line, col: 1, msg, hint });
  }
  rec(key: string, line: number, note?: string) {
    if (!this.traceOn) return;
    if (this.trace.length >= this.tLimit) { this.truncated = true; return; }
    this.trace.push({ key, line, vars: this.snap(), out: this.out.length, fn: this.frame()?.fn.name ?? '', depth: this.frames.length, note });
  }
  vsnap(v: Var): VarSnap {
    const type = `${v.b}${'*'.repeat(v.p)}${v.dims.map(d => `[${d}]`).join('')}`;
    let val: string;
    if (v.isArr) {
      if (v.b === 'char' && v.dims.length === 1) {
        let s = ''; for (const c of v.data) { if (c === 0) break; s += String.fromCharCode(c); }
        val = JSON.stringify(s);
      } else {
        const shown = v.data.slice(0, 12).map(x => (x instanceof Ptr ? '→' : fmtNum(x, v.b)));
        val = `{${shown.join(', ')}${v.data.length > 12 ? ', …' : ''}}`;
      }
    } else if (!v.init) val = '?';
    else {
      const x = v.data[0];
      if (x instanceof Ptr && v.b === 'char' && v.p === 1) {
        let s = ''; for (let i = x.idx; i < x.data.length && x.data[i] !== 0 && s.length < 32; i++) s += String.fromCharCode(x.data[i] & 255);
        val = JSON.stringify(s);
      } else val = x instanceof Ptr ? `→ ${x.owner ? x.owner.name : '?'}${x.owner?.isArr ? `[${x.idx}]` : ''}` : (v.p > 0 ? 'NULL' : fmtNum(x, v.b));
    }
    return { name: v.name, type, val };
  }
  snap(): VarSnap[] {
    const m = new Map<string, VarSnap>();
    for (const [k, v] of this.globals) m.set(k, this.vsnap(v));
    const f = this.frame();
    if (f) for (const s of f.scopes) for (const [k, v] of s) m.set(k, this.vsnap(v));
    return [...m.values()];
  }
  write(s: string, line: number) {
    this.out += s;
    if (this.out.length > 200_000) throw new RtErr('Your program printed way too much output — probably an infinite loop.', line, undefined, 'timeout');
  }

  // ---------- input ----------
  peekc(): string | null {
    if (this.ip < this.inp.length) return this.inp[this.ip];
    if (this.interactive) throw new NeedInput();
    return null;
  }
  noteEOF(line: number) {
    if (++this.eofCalls > 25) throw new RtErr('Your program keeps asking for input, but there is no more input.', line, 'If you have a validation loop, make sure it stops once a valid value is entered.', 'inputEnd');
  }

  // ---------- declarations ----------
  declare(it: any, scope: Map<string, Var>, zero = false) {
    const ty = it.ty;
    const dims: (number | null)[] = ty.dims.map((d: N | null) => (d ? w32(this.eval(d) as number) : null));
    if (dims.length && dims[0] === null) {
      if (it.init?.k === 'initlist') dims[0] = Math.ceil(this.countInit(it.init) / prod(dims.slice(1) as number[]));
      else if (it.init?.k === 'str') dims[0] = it.init.v.length + 1;
      else throw new RtErr(`array size missing in '${it.name}'`, it.line, `Give a size, e.g. ${it.name}[10]`);
    }
    for (const d of dims) if ((d as number) <= 0 || (d as number) > 1e6) throw new RtErr(`invalid array size ${d} for '${it.name}'`, it.line, dims.length && (d as number) <= 0 ? 'The size must be a positive number. If you used a variable, was it given a value first?' : undefined);
    const isArr = dims.length > 0;
    const size = isArr ? prod(dims as number[]) : 1;
    const v: Var = {
      name: it.name, b: ty.b, p: ty.p, dims: dims as number[], isArr, init: isArr || zero,
      data: new Array(size).fill(isArr || zero ? 0 : (ty.p > 0 ? 0 : (ty.b === 'double' || ty.b === 'float' ? GARBAGE_DBL : GARBAGE_INT))),
    };
    scope.set(it.name, v);
    if (it.init) {
      if (isArr) {
        if (it.init.k === 'str') { const s: string = it.init.v; for (let i = 0; i < size; i++) v.data[i] = i < s.length ? s.charCodeAt(i) : 0; }
        else { const flat: N[] = []; this.flatInit(it.init, flat); flat.slice(0, size).forEach((e, i) => { v.data[i] = conv(this.eval(e), v.b, v.p); }); }
      } else {
        const init = it.init.k === 'initlist' ? it.init.items[0] : it.init;
        v.data[0] = conv(this.eval(init), v.b, v.p); v.init = true;
      }
    }
    return v;
  }
  countInit(e: N): number { return e.k === 'initlist' ? e.items.reduce((a: number, x: N) => a + this.countInit(x), 0) : 1; }
  flatInit(e: N, out: N[]) { if (e.k === 'initlist') e.items.forEach((x: N) => this.flatInit(x, out)); else out.push(e); }

  // ---------- execution ----------
  callUser(fn: N, args: any[], at: N): any {
    if (this.frames.length > 2500) throw new RtErr('Stack overflow — too many nested function calls (infinite recursion?)', at.line, 'A recursive function needs a base case that stops calling itself.');
    const fr: Frame = { fn, scopes: [new Map()], ret: undefined };
    fn.params.forEach((p: any, i: number) => {
      if (!p.name) return;
      fr.scopes[0].set(p.name, { name: p.name, b: p.ty.b, p: p.ty.p, data: [conv(args[i], p.ty.b, p.ty.p)], dims: [], init: true, isArr: false });
    });
    this.frames.push(fr);
    this.rec(`f:${fn.name}:enter`, fn.line);
    const sig = this.execBlock(fn.body.body, true);
    if (sig !== 3) this.rec(`f:${fn.name}:exit`, fn.body.endLine ?? fn.line);
    this.frames.pop();
    if (sig === 3) return conv(fr.ret ?? 0, fn.ret.b, fn.ret.p);
    return fn.ret.b === 'void' ? 0 : (fn.name === 'main' ? 0 : GARBAGE_INT);
  }
  execBlock(list: N[], scoped: boolean): number {
    const f = this.frame();
    if (scoped) f.scopes.push(new Map());
    try {
      for (const s of list) { const sig = this.exec(s); if (sig) return sig; }
      return 0;
    } finally { if (scoped) f.scopes.pop(); }
  }
  truthy(v: any) { return v instanceof Ptr ? true : v !== 0; }
  exec(s: N): number {
    switch (s.k) {
      case 'block': return this.execBlock(s.body, true);
      case 'decl': this.tick(s.line); for (const it of s.items) this.declare(it, this.scope()); this.rec(String(s.id), s.line); return 0;
      case 'expr': this.tick(s.line); this.eval(s.e); this.rec(String(s.id), s.line); return 0;
      case 'if': {
        this.tick(s.line);
        const c = this.truthy(this.eval(s.cond));
        this.rec(`${s.id}:cond`, s.line, c ? 'true' : 'false');
        if (c) return this.exec(s.then);
        return s.els ? this.exec(s.els) : 0;
      }
      case 'while': {
        for (;;) {
          this.tick(s.line);
          const c = this.truthy(this.eval(s.cond));
          this.rec(`${s.id}:cond`, s.line, c ? 'true' : 'false');
          if (!c) break;
          const sig = this.exec(s.body);
          if (sig === 1) break; if (sig === 3) return 3;
        }
        return 0;
      }
      case 'do': {
        for (;;) {
          this.tick(s.line);
          const sig = this.exec(s.body);
          if (sig === 1) break; if (sig === 3) return 3;
          const c = this.truthy(this.eval(s.cond));
          this.rec(`${s.id}:cond`, s.condLine ?? s.line, c ? 'true' : 'false');
          if (!c) break;
        }
        return 0;
      }
      case 'for': {
        const f = this.frame(); f.scopes.push(new Map());
        try {
          if (s.init) {
            if (s.init.k === 'decl') for (const it of s.init.items) this.declare(it, this.scope());
            else this.eval(s.init);
            this.rec(`${s.id}:init`, s.line);
          }
          for (;;) {
            this.tick(s.line);
            if (s.cond) {
              const c = this.truthy(this.eval(s.cond));
              this.rec(`${s.id}:cond`, s.line, c ? 'true' : 'false');
              if (!c) break;
            }
            const sig = this.exec(s.body);
            if (sig === 1) break; if (sig === 3) return 3;
            if (s.update) { this.eval(s.update); this.rec(`${s.id}:update`, s.line); }
          }
        } finally { f.scopes.pop(); }
        return 0;
      }
      case 'switch': {
        this.tick(s.line);
        const v = this.eval(s.disc);
        const body: N[] = s.body.k === 'block' ? s.body.body : [s.body];
        let start = body.findIndex(st => st.k === 'case' && this.eval(st.value) === v);
        if (start < 0) start = body.findIndex(st => st.k === 'default');
        this.rec(`${s.id}:cond`, s.line, start < 0 ? 'no match' : body[start].k === 'default' ? 'default' : `case ${v}`);
        if (start < 0) return 0;
        const f = this.frame(); f.scopes.push(new Map());
        try {
          for (let i = start; i < body.length; i++) {
            const sig = this.exec(body[i]);
            if (sig === 1) break; if (sig) return sig;
          }
        } finally { f.scopes.pop(); }
        return 0;
      }
      case 'case': case 'default': case 'empty': return 0;
      case 'break': this.rec(String(s.id), s.line); return 1;
      case 'continue': this.rec(String(s.id), s.line); return 2;
      case 'return': {
        this.tick(s.line);
        this.frame().ret = s.e ? this.eval(s.e) : 0;
        this.rec(String(s.id), s.line);
        return 3;
      }
    }
    return 0;
  }

  // ---------- expressions ----------
  lval(e: N): Loc {
    switch (e.k) {
      case 'id': {
        const v = this.lookup(e.name);
        if (!v) throw new RtErr(`'${e.name}' is not a variable`, e.line);
        return { data: v.data, idx: 0, b: v.b, p: v.p, dims: v.dims, v };
      }
      case 'index': {
        const base = this.eval(e.arr);
        if (!(base instanceof Ptr)) throw new RtErr('Segmentation fault — indexing something that is not an array', e.line);
        const i = w32(Number(this.eval(e.idx)));
        const stride = prod(base.dims);
        const idx = base.idx + i * stride;
        if (idx < 0 || idx + stride > base.data.length) {
          const n = Math.floor(base.data.length / stride);
          throw new RtErr(`array index ${i} is out of bounds${base.owner ? ` for '${base.owner.name}'` : ''}`, e.line,
            `This array has ${n} element${n === 1 ? '' : 's'}, so valid indexes are 0 to ${n - 1}. (Real C would silently corrupt memory here!)`);
        }
        return { data: base.data, idx, b: base.b, p: base.p, dims: base.dims, v: base.owner && !base.owner.isArr ? base.owner : undefined };
      }
      case 'unary':
        if (e.op === '*') {
          const p = this.eval(e.e);
          if (!(p instanceof Ptr)) throw new RtErr('Segmentation fault — dereferencing something that is not a pointer', e.line);
          if (p.idx < 0 || p.idx >= p.data.length) throw new RtErr('Segmentation fault — pointer points outside its array', e.line);
          return { data: p.data, idx: p.idx, b: p.b, p: p.p, dims: p.dims, v: p.owner && !p.owner.isArr ? p.owner : undefined };
        }
    }
    throw new RtErr('cannot assign to this expression', e.line);
  }
  load(l: Loc, e: N): any {
    if (l.dims.length) return new Ptr(l.data, l.idx, l.b, l.p, l.dims.slice(1), l.v);
    if (l.v && !l.v.init) {
      this.rdiag(e.line, `'${l.v.name}' was used before it was given a value — it contains GARBAGE`, `Initialize it when you declare it, e.g.  ${l.v.b} ${l.v.name} = 0;  (accumulators like sum must start at 0, products at 1)`);
    }
    return l.data[l.idx];
  }
  store(l: Loc, v: any, e: N) {
    if (l.dims.length) throw new RtErr('cannot assign to a whole array', e.line, 'Assign one element at a time, e.g. arr[i] = value;');
    const c = conv(v, l.b, l.p);
    l.data[l.idx] = c;
    if (l.v) l.v.init = true;
    return c;
  }
  strPtr(e: N): Ptr {
    let p = this.strCache.get(e);
    if (!p) {
      const data = [...e.v].map((c: string) => c.charCodeAt(0)); data.push(0);
      p = new Ptr(data, 0, 'char', 0, []);
      this.strCache.set(e, p);
    }
    return p;
  }
  cstr(v: any, line: number): string {
    if (!(v instanceof Ptr)) throw new RtErr('expected a string here', line, 'Strings are written in double quotes: "like this"');
    let s = '';
    for (let i = v.idx; i < v.data.length && v.data[i] !== 0; i++) s += String.fromCharCode(v.data[i] & 255);
    return s;
  }
  arith(op: string, l: any, r: any, t: Ty, e: N): any {
    if (l instanceof Ptr || r instanceof Ptr) {
      if (op === '+' || op === '-') {
        if (l instanceof Ptr && r instanceof Ptr) return op === '-' ? (l.idx - r.idx) / Math.max(1, prod(l.dims)) : 0;
        const p = (l instanceof Ptr ? l : r) as Ptr; const n = Number(l instanceof Ptr ? r : l) * (op === '-' ? -1 : 1);
        return new Ptr(p.data, p.idx + n * prod(p.dims), p.b, p.p, p.dims, p.owner);
      }
      const li = l instanceof Ptr ? l.idx : l, ri = r instanceof Ptr ? r.idx : r;
      switch (op) { case '==': return (l instanceof Ptr && r instanceof Ptr) ? (l.data === r.data && l.idx === r.idx ? 1 : 0) : 0; case '!=': return (l instanceof Ptr && r instanceof Ptr) ? (l.data === r.data && l.idx === r.idx ? 0 : 1) : 1; case '<': return li < ri ? 1 : 0; case '>': return li > ri ? 1 : 0; case '<=': return li <= ri ? 1 : 0; case '>=': return li >= ri ? 1 : 0; }
      throw new RtErr(`invalid pointer arithmetic '${op}'`, e.line);
    }
    const fl = t.b === 'float' || t.b === 'double';
    const fix = (x: number) => conv(x, t.b, 0);
    switch (op) {
      case '+': return fix(l + r);
      case '-': return fix(l - r);
      case '*': return t.b === 'int' ? Math.imul(l, r) : fix(l * r);
      case '/':
        if (!fl) {
          if (r === 0) throw new RtErr('Floating point exception — division by zero', e.line, 'You divided an integer by 0, which crashes a C program. Make sure the divisor is never 0.');
          return fix(Math.trunc(l / r));
        }
        return fix(l / r);
      case '%':
        if (r === 0) throw new RtErr('Floating point exception — modulo by zero', e.line, 'x % 0 crashes a C program. Make sure the right side of % is never 0.');
        return fix(l % r);
      case '<': return l < r ? 1 : 0; case '>': return l > r ? 1 : 0;
      case '<=': return l <= r ? 1 : 0; case '>=': return l >= r ? 1 : 0;
      case '==': return l === r ? 1 : 0; case '!=': return l !== r ? 1 : 0;
      case '&': return l & r; case '|': return l | r; case '^': return l ^ r;
      case '<<': return w32(l << r); case '>>': return l >> r;
    }
    throw new RtErr(`unknown operator ${op}`, e.line);
  }
  eval(e: N): any {
    switch (e.k) {
      case 'num': return e.v;
      case 'str': return this.strPtr(e);
      case 'id': {
        const v = this.lookup(e.name);
        if (!v) { const c = CONSTS[e.name]; if (c) return c.v; throw new RtErr(`'${e.name}' undeclared`, e.line); }
        if (v.isArr) return new Ptr(v.data, 0, v.b, v.p, v.dims.slice(1), v);
        if (!v.init) this.rdiag(e.line, `'${v.name}' was used before it was given a value — it contains GARBAGE`, `Initialize it when you declare it, e.g.  ${v.b} ${v.name} = 0;  (accumulators like sum start at 0, products at 1)`);
        return v.data[0];
      }
      case 'index': return this.load(this.lval(e), e);
      case 'unary': {
        switch (e.op) {
          case '-': { const v = this.eval(e.e); return conv(-v, e.ty!.b, 0); }
          case '+': return this.eval(e.e);
          case '!': return this.truthy(this.eval(e.e)) ? 0 : 1;
          case '~': return ~this.eval(e.e);
          case '&': {
            const l = this.lval(e.e);
            return new Ptr(l.data, l.idx, l.b, l.p, l.dims, l.v ?? (e.e.k === 'index' ? this.lookupOwner(e.e) : undefined));
          }
          case '*': return this.load(this.lval(e), e);
        }
        break;
      }
      case 'update': {
        const l = this.lval(e.e);
        const old = this.load(l, e.e);
        let nv: any;
        if (old instanceof Ptr) nv = new Ptr(old.data, old.idx + (e.op === '++' ? 1 : -1) * prod(old.dims), old.b, old.p, old.dims, old.owner);
        else nv = old + (e.op === '++' ? 1 : -1);
        const st = this.store(l, nv, e);
        return e.prefix ? st : old;
      }
      case 'bin': {
        if (e.op === '&&') return this.truthy(this.eval(e.l)) && this.truthy(this.eval(e.r)) ? 1 : 0;
        if (e.op === '||') return this.truthy(this.eval(e.l)) || this.truthy(this.eval(e.r)) ? 1 : 0;
        const l = this.eval(e.l), r = this.eval(e.r);
        return this.arith(e.op, l, r, e.ty ?? { b: 'int', p: 0, a: 0 }, e);
      }
      case 'assign': {
        const l = this.lval(e.l);
        if (e.op === '=') return this.store(l, this.eval(e.r), e);
        const cur = this.load(l, e.l);
        const r = this.eval(e.r);
        const lt = e.l.ty!, rt = e.r.ty!;
        const bs = [lt.b, rt.b];
        const t: Ty = { b: bs.includes('double') ? 'double' : bs.includes('float') ? 'float' : bs.includes('long') ? 'long' : 'int', p: 0, a: 0 };
        return this.store(l, this.arith(e.op.slice(0, -1), cur, r, t, e), e);
      }
      case 'cond': return this.truthy(this.eval(e.c)) ? this.eval(e.t) : this.eval(e.f);
      case 'comma': this.eval(e.l); return this.eval(e.r);
      case 'cast': { const v = this.eval(e.e); return conv(v, e.to.b, e.to.p); }
      case 'sizeof': {
        const sz = (b: Base) => ({ int: 4, long: 8, char: 1, float: 4, double: 8, void: 1, bool: 1 } as any)[b];
        if (e.to) return e.to.p ? 8 : sz(e.to.b);
        if (e.e.k === 'id') { const v = this.lookup(e.e.name); if (v) return (v.p ? 8 : sz(v.b)) * (v.isArr ? prod(v.dims) : 1); }
        const t = e.e.ty as Ty; return t && t.p ? 8 : sz(t?.b ?? 'int');
      }
      case 'call': {
        const fn = this.prog.funcs[e.name];
        if (fn) { this.tick(e.line); return this.callUser(fn, e.args.map((a: N) => this.eval(a)), e); }
        return this.builtin(e);
      }
    }
    throw new RtErr(`cannot evaluate '${e.k}'`, e.line);
  }
  lookupOwner(e: N): Var | undefined {
    let x = e; while (x.k === 'index') x = x.arr;
    return x.k === 'id' ? this.lookup(x.name) : undefined;
  }

  // ---------- library ----------
  builtin(e: N): any {
    const a: N[] = e.args; const L = e.line;
    const num = (i: number) => Number(this.eval(a[i]));
    switch (e.name) {
      case 'printf': {
        const fmt = this.cstr(this.eval(a[0]), L);
        const s = this.format(fmt, a.slice(1), L);
        this.write(s, L); return s.length;
      }
      case 'puts': { const s = this.cstr(this.eval(a[0]), L) + '\n'; this.write(s, L); return 1; }
      case 'putchar': { const c = num(0); this.write(String.fromCharCode(c & 255), L); return c; }
      case 'scanf': return this.scanf(e);
      case 'getchar': { const c = this.peekc(); if (c === null) { this.noteEOF(L); return -1; } this.ip++; return c.charCodeAt(0); }
      case 'getch': case 'getche': case 'clrscr': case 'system': case 'fflush': a.forEach(x => this.eval(x)); return 0;
      case 'pow': return Math.pow(num(0), num(1));
      case 'sqrt': { const x = num(0); if (x < 0) this.rdiag(L, `sqrt of a negative number (${fmtNum(x, 'double')}) gives nan`, 'Check your formula — maybe the subtraction inside sqrt is in the wrong order?'); return Math.sqrt(x); }
      case 'fabs': return Math.abs(num(0)); case 'ceil': return Math.ceil(num(0)); case 'floor': return Math.floor(num(0));
      case 'round': { const x = num(0); return Math.sign(x) * Math.round(Math.abs(x)); }
      case 'trunc': return Math.trunc(num(0));
      case 'sin': return Math.sin(num(0)); case 'cos': return Math.cos(num(0)); case 'tan': return Math.tan(num(0));
      case 'asin': return Math.asin(num(0)); case 'acos': return Math.acos(num(0)); case 'atan': return Math.atan(num(0));
      case 'atan2': return Math.atan2(num(0), num(1)); case 'exp': return Math.exp(num(0));
      case 'log': return Math.log(num(0)); case 'log10': return Math.log10(num(0)); case 'log2': return Math.log2(num(0));
      case 'cbrt': return Math.cbrt(num(0)); case 'hypot': return Math.hypot(num(0), num(1));
      case 'fmod': { const x = num(0), y = num(1); return x % y; }
      case 'abs': return w32(Math.abs(num(0))); case 'labs': return Math.abs(num(0));
      case 'rand': this.seed = (this.seed * 1103515245 + 12345) % 2147483648; return Math.floor(this.seed / 65536) % 32768;
      case 'srand': this.seed = num(0) >>> 0; return 0;
      case 'time': return Math.floor(Date.now() / 1000);
      case 'exit': throw new ExitSig(num(0));
      case 'toupper': { const c = num(0); return c >= 97 && c <= 122 ? c - 32 : c; }
      case 'tolower': { const c = num(0); return c >= 65 && c <= 90 ? c + 32 : c; }
      case 'isdigit': { const c = num(0); return c >= 48 && c <= 57 ? 1 : 0; }
      case 'isalpha': { const c = num(0); return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ? 1 : 0; }
      case 'isupper': { const c = num(0); return c >= 65 && c <= 90 ? 1 : 0; }
      case 'islower': { const c = num(0); return c >= 97 && c <= 122 ? 1 : 0; }
      case 'isspace': { const c = num(0); return isSpace(String.fromCharCode(c)) ? 1 : 0; }
      case 'strlen': return this.cstr(this.eval(a[0]), L).length;
      case 'strcmp': { const x = this.cstr(this.eval(a[0]), L), y = this.cstr(this.eval(a[1]), L); return x < y ? -1 : x > y ? 1 : 0; }
      case 'strcpy': case 'strcat': {
        const d = this.eval(a[0]) as Ptr; const src = this.cstr(this.eval(a[1]), L);
        if (!(d instanceof Ptr)) throw new RtErr(`${e.name} needs a char array`, L);
        const start = e.name === 'strcat' ? d.idx + this.cstr(d, L).length : d.idx;
        if (start + src.length + 1 > d.data.length) throw new RtErr(`${e.name}: the destination array is too small`, L, 'Make the char array bigger.');
        for (let i = 0; i < src.length; i++) d.data[start + i] = src.charCodeAt(i);
        d.data[start + src.length] = 0; if (d.owner) d.owner.init = true;
        return d;
      }
    }
    throw new RtErr(`function '${e.name}' is not available`, L);
  }

  format(fmt: string, argNodes: N[], L: number): string {
    const re = /%([-+ #0]*)(\d+|\*)?(?:\.(\d*|\*))?(hh|h|ll|l|L|z|j|t)?([diouxXeEfFgGcspn%])/g;
    let out = '', last = 0, ai = 0, m: RegExpExecArray | null;
    const next = () => { const n = argNodes[ai++]; return n ? { v: this.eval(n), n } : null; };
    while ((m = re.exec(fmt))) {
      out += fmt.slice(last, m.index); last = re.lastIndex;
      const flags = m[1]; let width = m[2]; let prec = m[3]; const conv = m[5];
      if (conv === '%') { out += '%'; continue; }
      if (width === '*') width = String(next()?.v ?? 0);
      if (prec === '*') prec = String(next()?.v ?? 6);
      const arg = next();
      const isF = arg ? isFloat(arg.n.ty) : false;
      let v: any = arg ? arg.v : GARBAGE_INT;
      let s = '';
      const P = prec === undefined ? undefined : (prec === '' ? 0 : +prec);
      const sign = (x: number, str: string) => (x >= 0 && !Object.is(x, -0) ? (flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') : '') + str;
      switch (conv) {
        case 'd': case 'i': {
          let n = v instanceof Ptr ? 4198400 : isF ? 1717986918 : Math.trunc(Number(v));
          if (!arg) n = 32767;
          let digits = intStr(Math.abs(n));
          if (P !== undefined) digits = digits.padStart(P, '0');
          s = (n < 0 ? '-' : '') + digits; s = n >= 0 ? sign(n, s) : s; break;
        }
        case 'u': s = String((isF ? 0 : Math.trunc(Number(v))) >>> 0); break;
        case 'x': case 'X': case 'o': { const n = (isF ? 0 : Math.trunc(Number(v))) >>> 0; s = n.toString(conv === 'o' ? 8 : 16); if (conv === 'X') s = s.toUpperCase(); if (flags.includes('#') && n) s = (conv === 'o' ? '0' : conv === 'x' ? '0x' : '0X') + s; break; }
        case 'f': case 'F': { const xx = isF ? Number(v) : 0; s = cFixed(Math.abs(xx), P ?? 6); if (xx < 0 || Object.is(xx, -0)) s = '-' + s; else s = sign(xx, s); break; }
        case 'e': case 'E': { const x = isF ? Number(v) : 0; s = cExp(x, P ?? 6, conv === 'E'); s = x >= 0 ? sign(x, s) : s; break; }
        case 'g': case 'G': { const x = isF ? Number(v) : 0; s = cG(x, P ?? 6, flags.includes('#'), conv === 'G'); s = x >= 0 ? sign(x, s) : s; break; }
        case 'c': s = String.fromCharCode(Math.trunc(Number(v)) & 255); break;
        case 's': { s = v instanceof Ptr ? this.cstr(v, L) : '(null)'; if (P !== undefined) s = s.slice(0, P); break; }
        case 'p': s = '0x7ffd' + (4198400 + (v instanceof Ptr ? v.idx * 4 : 0)).toString(16); break;
        case 'n': break;
      }
      if (width) {
        const w = +width;
        if (s.length < w) {
          if (flags.includes('-')) s = s.padEnd(w);
          else if (flags.includes('0') && 'diouxXeEfFgG'.includes(conv) && P === undefined || (flags.includes('0') && 'eEfFgG'.includes(conv))) {
            const neg = /^[-+ ]/.test(s) ? s[0] : ''; s = neg + s.slice(neg.length).padStart(w - neg.length, '0');
          } else s = s.padStart(w);
        }
      }
      out += s;
    }
    return out + fmt.slice(last);
  }

  scanf(e: N): number {
    const L = e.line;
    const fmt = this.cstr(this.eval(e.args[0]), L);
    const targets = e.args.slice(1).map((n: N) => ({ n, v: this.eval(n) }));
    let fi = 0, ai = 0, count = 0;
    const eof = () => { this.noteEOF(L); return count === 0 ? -1 : count; };
    while (fi < fmt.length) {
      const fc = fmt[fi];
      if (isSpace(fc)) {
        fi++;
        if (fi >= fmt.length) break; // trailing whitespace: don't block
        for (;;) { const c = this.peekc(); if (c === null || !isSpace(c)) break; this.ip++; }
        continue;
      }
      if (fc !== '%') {
        for (;;) { const c = this.peekc(); if (c === null) return eof(); if (isSpace(c) && !isSpace(fc)) { this.ip++; continue; } break; }
        const c = this.peekc(); if (c === null) return eof();
        if (c !== fc) return count;
        this.ip++; fi++; continue;
      }
      const m = /^%(\*)?(\d+)?(hh|h|ll|l|L)?([diufFeEgGcsx%])/.exec(fmt.slice(fi));
      if (!m) { fi++; continue; }
      fi += m[0].length;
      const [, suppress, widthS, len, cv] = m;
      const width = widthS ? +widthS : Infinity;
      if (cv === '%') { const c = this.peekc(); if (c === '%') this.ip++; continue; }
      if (cv !== 'c') {
        for (;;) { const c = this.peekc(); if (c === null) return eof(); if (!isSpace(c)) break; this.ip++; }
      }
      let val: any;
      if ('diux'.includes(cv)) {
        const st = this.ip; let tok = '';
        const c0 = this.peekc(); if (c0 === '+' || c0 === '-') { tok += c0; this.ip++; }
        for (;;) { const c = this.peekc(); if (c === null || tok.length >= width) break; if ((cv === 'x' ? /[0-9a-fA-F]/ : /[0-9]/).test(c)) { tok += c; this.ip++; } else break; }
        if (!/[0-9a-fA-F]/.test(tok)) { this.ip = st; return count; }
        val = parseInt(tok, cv === 'x' ? 16 : 10);
      } else if ('fFeEgG'.includes(cv)) {
        const st = this.ip; let tok = '';
        const c0 = this.peekc(); if (c0 === '+' || c0 === '-') { tok += c0; this.ip++; }
        let seenDot = false, seenE = false;
        for (;;) {
          const c = this.peekc(); if (c === null || tok.length >= width) break;
          if (/[0-9]/.test(c)) { tok += c; this.ip++; }
          else if (c === '.' && !seenDot && !seenE) { seenDot = true; tok += c; this.ip++; }
          else if ((c === 'e' || c === 'E') && !seenE && /[0-9]/.test(tok)) { seenE = true; tok += c; this.ip++; const s2 = this.peekc(); if (s2 === '+' || s2 === '-') { tok += s2; this.ip++; } }
          else break;
        }
        if (!/[0-9]/.test(tok)) { this.ip = st; return count; }
        val = parseFloat(tok);
      } else if (cv === 'c') {
        const c = this.peekc(); if (c === null) return eof(); this.ip++; val = c.charCodeAt(0);
      } else {
        let s = '';
        for (;;) { const c = this.peekc(); if (c === null || isSpace(c) || s.length >= width) break; s += c; this.ip++; }
        val = s;
      }
      if (suppress) continue;
      const t = targets[ai++];
      if (!t) throw new RtErr('scanf has more % codes than variables', L, 'Each % code needs one &variable after the format string.');
      if (!(t.v instanceof Ptr)) {
        const name = this.prog.src.slice(t.n.s, t.n.end);
        throw new RtErr(`Segmentation fault — scanf was given the VALUE of ${name}, not its address`, L, `Write &${name}. scanf needs to know WHERE to store what the user types.`);
      }
      const p = t.v as Ptr;
      if (cv === 's') {
        const s: string = val;
        if (p.idx + s.length + 1 > p.data.length) throw new RtErr('scanf %s: the typed word is longer than the char array', L, 'Make the array bigger, e.g. char name[50];');
        for (let i = 0; i < s.length; i++) p.data[p.idx + i] = s.charCodeAt(i);
        p.data[p.idx + s.length] = 0; if (p.owner) p.owner.init = true;
      } else {
        let stored = val;
        const tb = p.b;
        if ('fFeEgG'.includes(cv)) {
          const wantD = len === 'l' || len === 'L';
          if (tb === 'double' && !wantD) stored = 5.299808824e-315;
          else if (tb === 'float' && wantD) stored = 0;
          else if (tb !== 'double' && tb !== 'float') stored = 1084227584;
        } else if (cv !== 'c' && (tb === 'double' || tb === 'float')) stored = tb === 'double' ? 2.1e-314 : 1.4e-44;
        p.data[p.idx] = conv(stored, tb, p.p);
        if (p.owner && !p.owner.isArr) p.owner.init = true;
      }
      count++;
    }
    return count;
  }
}

export function run(c: Compiled, o: RunOpts = {}): RunResult {
  const prog = c.prog!;
  const m = new Machine(prog, o);
  m.t0 = performance.now();
  let status: RunResult['status'] = 'ok', exitCode = 0, error: RunResult['error'];
  try {
    m.frames.push({ fn: prog.funcs.main, scopes: [new Map()], ret: 0 });
    for (const g of prog.globals) for (const it of g.items) m.declare(it, m.globals, true);
    m.frames.pop();
    const r = m.callUser(prog.funcs.main, [], prog.funcs.main);
    exitCode = typeof r === 'number' ? r : 0;
  } catch (ex) {
    if (ex instanceof NeedInput) status = 'needInput';
    else if (ex instanceof ExitSig) exitCode = ex.code;
    else if (ex instanceof RtErr) { status = ex.kind === 'timeout' ? 'timeout' : ex.kind === 'inputEnd' ? 'inputEnd' : 'error'; error = { msg: ex.msg, line: ex.line, hint: ex.hint }; }
    else if (ex instanceof RangeError) { status = 'error'; error = { msg: 'Stack overflow — the program went too deep (infinite recursion?)', line: 0 }; }
    else { status = 'error'; error = { msg: 'Internal error: ' + (ex as Error).message, line: 0 }; console.error(ex); }
  }
  return {
    status, output: m.out, exitCode, error, rdiags: m.rdiags, trace: m.trace, traceTruncated: m.truncated,
    stdinLeft: m.inp.slice(m.ip), steps: m.steps,
  };
}

export { fmtSpecs };
