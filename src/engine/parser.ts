import { CError, Token, lex } from './lexer';

export type Base = 'int' | 'long' | 'char' | 'float' | 'double' | 'void' | 'bool';
export interface Ty { b: Base; p: number; a: number }
export interface DeclTy { b: Base; p: number; dims: (N | null)[]; unsigned?: boolean; konst?: boolean }
// AST node (loosely typed for speed of development)
export interface N { k: string; line: number; col: number; s: number; end: number; id: number; endLine?: number; ty?: Ty; [x: string]: any }
export interface Program {
  funcs: Record<string, N>; protos: Record<string, N>; funcList: N[]; globals: N[];
  src: string; includes: string[];
}

const TYPE_WORDS = new Set(['int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed', 'const', 'static', 'bool', '_Bool', 'register', 'auto', 'volatile', 'extern', 'inline']);
const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']);
export const PREC: Record<string, number> = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };

let NID = 1;
const desc = (t: Token) => t.k === 'eof' ? 'the end of the program' : t.k === 'str' ? 'a "string"' : `'${t.v}'`;

class Parser {
  t: Token[]; i = 0;
  funcs: Record<string, N> = {}; protos: Record<string, N> = {}; funcList: N[] = []; globals: N[] = [];
  constructor(t: Token[]) { this.t = t; }
  get cur() { return this.t[this.i]; }
  peek(o = 1) { return this.t[Math.min(this.i + o, this.t.length - 1)]; }
  is(v: string) { const c = this.cur; return (c.k === 'op' || c.k === 'kw') && c.v === v; }
  eat(v: string) { if (this.is(v)) return this.t[this.i++]; return null; }
  prev() { return this.t[this.i - 1] || this.t[0]; }
  expect(v: string, what?: string): Token {
    if (this.is(v)) return this.t[this.i++];
    const c = this.cur;
    if (v === ';') {
      const p = this.prev();
      throw new CError(`expected ';' after ${desc(p)}`, p.line, p.col + (p.e - p.s), 'Every statement in C ends with a semicolon ;  (check the end of this line)');
    }
    const hints: Record<string, string> = {
      ')': 'Every ( needs a matching ). Count your parentheses.',
      '}': 'Every { needs a matching }. Count your braces.',
      ']': 'Every [ needs a matching ].',
      '(': 'Conditions go inside parentheses, e.g. if (x > 0)',
      '{': 'A function body starts with {',
    };
    throw new CError(`expected '${v}'${what ? ' ' + what : ''} before ${desc(c)}`, c.line, c.col, hints[v]);
  }
  mk(k: string, at: { line: number; col: number; s: number }, extra: Record<string, any> = {}): N {
    return { k, line: at.line, col: at.col, s: at.s, end: at.s, id: NID++, ...extra };
  }
  fin(n: N) { const p = this.prev(); n.end = p.e; n.endLine = p.line; return n; }
  isTypeStart(j = this.i) { const c = this.t[j]; return !!c && c.k === 'kw' && (TYPE_WORDS.has(c.v) || c.v === 'struct' || c.v === 'enum' || c.v === 'union' || c.v === 'typedef'); }

  parseType(): DeclTy {
    const st = this.cur;
    if (this.is('struct') || this.is('union') || this.is('enum') || this.is('typedef'))
      throw new CError(`'${st.v}' is not supported in this practice compiler`, st.line, st.col, 'Stick to int, float, double, char and arrays — that is all the exam needs.');
    let b: Base | null = null, longc = 0, unsigned = false, konst = false;
    while (this.cur.k === 'kw' && TYPE_WORDS.has(this.cur.v)) {
      const w = this.t[this.i++].v;
      if (w === 'int') { if (!b) b = 'int'; }
      else if (w === 'char') b = 'char';
      else if (w === 'float') b = 'float';
      else if (w === 'double') b = 'double';
      else if (w === 'void') b = 'void';
      else if (w === 'bool' || w === '_Bool') b = 'bool';
      else if (w === 'long') longc++;
      else if (w === 'unsigned') unsigned = true;
      else if (w === 'const') konst = true;
    }
    if (!b) b = 'int';
    if (longc > 0 && b === 'int') b = 'long';
    return { b, p: 0, dims: [], unsigned, konst };
  }

  parseDeclarator(base: DeclTy) {
    let p = 0; while (this.eat('*')) p++;
    const nt = this.cur;
    if (nt.k !== 'id') {
      throw new CError(`expected a variable name before ${desc(nt)}`, nt.line, nt.col,
        nt.k === 'kw' ? `'${nt.v}' is a reserved keyword — choose a different name.` : nt.k === 'num' ? 'Variable names cannot start with a digit.' : undefined);
    }
    this.i++;
    const dims: (N | null)[] = [];
    while (this.eat('[')) { dims.push(this.is(']') ? null : this.parseAssign()); this.expect(']'); }
    return { name: nt.v, ty: { ...base, p: base.p + p, dims } as DeclTy, tok: nt };
  }

  parseProgram() {
    while (this.cur.k !== 'eof') {
      if (this.eat(';')) continue;
      const st = this.cur;
      let base: DeclTy;
      if (this.isTypeStart()) base = this.parseType();
      else if (st.k === 'id' && this.peek().v === '(') base = { b: 'int', p: 0, dims: [] };
      else throw new CError(`expected a declaration or a function before ${desc(st)}`, st.line, st.col,
        st.v === '}' ? 'There is an extra } here — check your braces.' : 'Code must live inside a function like int main() { ... }');
      const d = this.parseDeclarator(base);
      if (this.is('(')) this.parseFunctionRest(d, st);
      else this.globals.push(this.parseDeclRest(base, d, st));
    }
  }

  parseFunctionRest(d: { name: string; ty: DeclTy; tok: Token }, st: Token) {
    this.expect('(');
    const params: { name: string | null; ty: DeclTy; line: number }[] = [];
    if (this.is('void') && this.peek().v === ')') this.i++;
    else if (!this.is(')')) {
      do {
        if (this.eat('...')) break;
        const pt = this.parseType();
        let p = 0; while (this.eat('*')) p++;
        let name: string | null = null; const tok = this.cur;
        if (this.cur.k === 'id') { name = this.cur.v; this.i++; }
        const dims: (N | null)[] = [];
        while (this.eat('[')) { dims.push(this.is(']') ? null : this.parseAssign()); this.expect(']'); }
        params.push({ name, ty: { ...pt, p: pt.p + p + (dims.length ? 1 : 0), dims: dims.slice(1) }, line: tok.line });
      } while (this.eat(','));
    }
    this.expect(')', `to close the parameter list of ${d.name}()`);
    const fn = this.mk('func', st, { name: d.name, ret: d.ty, params, body: null });
    if (this.eat(';')) { this.protos[d.name] = fn; return; }
    if (!this.is('{')) { const c = this.cur; throw new CError(`expected '{' to start the body of ${d.name}()`, c.line, c.col, 'A function looks like: int main() { ... }'); }
    fn.body = this.parseBlock();
    this.fin(fn);
    if (this.funcs[d.name]) throw new CError(`redefinition of '${d.name}'`, st.line, st.col, `There are two functions named ${d.name}.`);
    this.funcs[d.name] = fn; this.funcList.push(fn);
  }

  parseDeclRest(base: DeclTy, first: { name: string; ty: DeclTy; tok: Token }, st: Token): N {
    const items: any[] = [];
    let d = first;
    for (;;) {
      let init: N | null = null;
      if (this.eat('=')) init = this.parseInitializer();
      items.push({ name: d.name, ty: d.ty, init, line: d.tok.line, col: d.tok.col });
      if (!this.eat(',')) break;
      d = this.parseDeclarator(base);
    }
    this.expect(';');
    return this.fin(this.mk('decl', st, { items }));
  }

  parseInitializer(): N {
    if (this.is('{')) {
      const st = this.cur; this.i++;
      const items: N[] = [];
      while (!this.is('}')) { items.push(this.parseInitializer()); if (!this.eat(',')) break; }
      this.expect('}');
      return this.fin(this.mk('initlist', st, { items }));
    }
    return this.parseAssign();
  }

  parseBlock(): N {
    const st = this.expect('{');
    const body: N[] = [];
    while (!this.is('}')) {
      if (this.cur.k === 'eof') throw new CError("expected '}' at the end of the program", st.line, st.col, `The { on line ${st.line} is never closed. Add a matching }.`);
      body.push(this.parseStmt());
    }
    this.i++;
    return this.fin(this.mk('block', st, { body }));
  }

  parseStmt(): N {
    const c = this.cur;
    if (c.k === 'op' && c.v === '{') return this.parseBlock();
    if (c.k === 'op' && c.v === ';') { this.i++; return this.fin(this.mk('empty', c)); }
    if (this.isTypeStart()) {
      const base = this.parseType();
      const d = this.parseDeclarator(base);
      if (this.is('(')) throw new CError(`function '${d.name}' cannot be defined inside another function`, c.line, c.col, 'Define functions outside (above) main().');
      return this.parseDeclRest(base, d, c);
    }
    if (c.k === 'kw') {
      switch (c.v) {
        case 'if': {
          this.i++; this.expect('(', "after 'if'");
          const cond = this.parseExpr(); this.expect(')', 'to close the if condition');
          const then = this.parseStmt();
          let els: N | null = null;
          if (this.eat('else')) els = this.parseStmt();
          return this.fin(this.mk('if', c, { cond, then, els }));
        }
        case 'else': throw new CError("'else' without a previous 'if'", c.line, c.col, 'Did you put a ; right after the if (...)? Or is a } misplaced?');
        case 'while': {
          this.i++; this.expect('(', "after 'while'");
          const cond = this.parseExpr(); this.expect(')', 'to close the while condition');
          const body = this.parseStmt();
          return this.fin(this.mk('while', c, { cond, body }));
        }
        case 'do': {
          this.i++;
          const body = this.parseStmt();
          const wt = this.cur;
          if (!this.eat('while')) throw new CError("expected 'while' after the do { ... } body", wt.line, wt.col, 'A do-while ends with: } while (condition);');
          this.expect('(');
          const cond = this.parseExpr(); this.expect(')');
          this.expect(';');
          return this.fin(this.mk('do', c, { body, cond, condLine: wt.line }));
        }
        case 'for': {
          this.i++; this.expect('(', "after 'for'");
          let init: N | null = null;
          if (this.isTypeStart()) {
            const st = this.cur; const base = this.parseType(); const d = this.parseDeclarator(base);
            init = this.parseDeclRest(base, d, st);
          } else {
            if (!this.is(';')) init = this.parseExpr();
            this.expect(';');
          }
          const cond = this.is(';') ? null : this.parseExpr();
          this.expect(';');
          const update = this.is(')') ? null : this.parseExpr();
          this.expect(')', 'to close the for (...)');
          const body = this.parseStmt();
          return this.fin(this.mk('for', c, { init, cond, update, body }));
        }
        case 'switch': {
          this.i++; this.expect('(');
          const disc = this.parseExpr(); this.expect(')');
          const body = this.parseStmt();
          return this.fin(this.mk('switch', c, { disc, body }));
        }
        case 'case': {
          this.i++; const value = this.parseCond(); this.expect(':', 'after the case value');
          return this.fin(this.mk('case', c, { value }));
        }
        case 'default': { this.i++; this.expect(':'); return this.fin(this.mk('default', c)); }
        case 'break': { this.i++; this.expect(';'); return this.fin(this.mk('break', c)); }
        case 'continue': { this.i++; this.expect(';'); return this.fin(this.mk('continue', c)); }
        case 'return': {
          this.i++; const e = this.is(';') ? null : this.parseExpr(); this.expect(';');
          return this.fin(this.mk('return', c, { e }));
        }
        case 'goto': throw new CError("'goto' is not supported here", c.line, c.col, 'Use loops instead of goto.');
      }
    }
    const e = this.parseExpr();
    this.expect(';');
    return this.fin(this.mk('expr', c, { e }));
  }

  parseExpr(): N {
    let l = this.parseAssign();
    while (this.is(',')) { this.i++; const r = this.parseAssign(); l = this.fin(this.mk('comma', l, { l, r })); }
    return l;
  }
  parseAssign(): N {
    const l = this.parseCond();
    const c = this.cur;
    if (c.k === 'op' && ASSIGN.has(c.v)) {
      this.i++; const r = this.parseAssign();
      return this.fin(this.mk('assign', l, { op: c.v, l, r }));
    }
    return l;
  }
  parseCond(): N {
    const c = this.parseBin(1);
    if (this.is('?')) {
      this.i++; const t = this.parseExpr(); this.expect(':', 'in the ?: expression'); const f = this.parseCond();
      return this.fin(this.mk('cond', c, { c, t, f }));
    }
    return c;
  }
  parseBin(min: number): N {
    let l = this.parseUnary();
    for (;;) {
      const c = this.cur;
      if (c.k !== 'op') break;
      const p = PREC[c.v];
      if (!p || p < min) break;
      this.i++;
      const r = this.parseBin(p + 1);
      l = this.fin(this.mk('bin', l, { op: c.v, l, r }));
    }
    return l;
  }
  parseUnary(): N {
    const c = this.cur;
    if (c.k === 'op') {
      if (c.v === '++' || c.v === '--') { this.i++; const e = this.parseUnary(); return this.fin(this.mk('update', c, { op: c.v, prefix: true, e })); }
      if ('-+!~&*'.includes(c.v) && c.v.length === 1) { this.i++; const e = this.parseUnary(); return this.fin(this.mk('unary', c, { op: c.v, e })); }
      if (c.v === '(' && this.isTypeStart(this.i + 1)) {
        this.i++; const to = this.parseType(); while (this.eat('*')) to.p++;
        this.expect(')', 'to close the cast');
        const e = this.parseUnary();
        return this.fin(this.mk('cast', c, { to, e }));
      }
    }
    if (c.k === 'kw' && c.v === 'sizeof') {
      this.i++;
      if (this.is('(') && this.isTypeStart(this.i + 1)) {
        this.i++; const to = this.parseType(); while (this.eat('*')) to.p++; this.expect(')');
        return this.fin(this.mk('sizeof', c, { to }));
      }
      const e = this.parseUnary();
      return this.fin(this.mk('sizeof', c, { e }));
    }
    return this.parsePostfix();
  }
  parsePostfix(): N {
    let e = this.parsePrimary();
    for (;;) {
      const c = this.cur;
      if (c.k !== 'op') break;
      if (c.v === '[') { this.i++; const idx = this.parseExpr(); this.expect(']'); e = this.fin(this.mk('index', e, { arr: e, idx })); continue; }
      if (c.v === '(') {
        if (e.k !== 'id') throw new CError('only named functions can be called', c.line, c.col, 'Multiplication needs a * sign: write 2 * (a + b), not 2(a + b).');
        this.i++;
        const args: N[] = [];
        if (!this.is(')')) { do { args.push(this.parseAssign()); } while (this.eat(',')); }
        this.expect(')', 'to close the function call');
        e = this.fin(this.mk('call', e, { name: e.name, args }));
        continue;
      }
      if (c.v === '++' || c.v === '--') { this.i++; e = this.fin(this.mk('update', e, { op: c.v, prefix: false, e })); continue; }
      if (c.v === '.' || c.v === '->') throw new CError('structs are not supported in this practice compiler', c.line, c.col);
      break;
    }
    return e;
  }
  parsePrimary(): N {
    const c = this.cur;
    switch (c.k) {
      case 'num': this.i++; return this.fin(this.mk('num', c, { v: c.n, isF: c.f, fl: c.fl, mac: c.mac, raw: c.v }));
      case 'char': this.i++; return this.fin(this.mk('num', c, { v: c.n, isChar: true, raw: c.v }));
      case 'str': { this.i++; let v = c.v; while (this.cur.k === 'str') { v += this.cur.v; this.i++; } return this.fin(this.mk('str', c, { v })); }
      case 'id': this.i++; return this.fin(this.mk('id', c, { name: c.v }));
      case 'op':
        if (c.v === '(') {
          this.i++; const e = this.parseExpr(); this.expect(')');
          const wrapped = { ...e, paren: true, s: c.s, line: c.line, col: c.col };
          wrapped.end = this.prev().e;
          return wrapped;
        }
    }
    let hint: string | undefined;
    if (c.k === 'eof') hint = 'The program ended too early — is a } or ) missing?';
    else if (c.v === ')') hint = 'Something is missing before this ) — maybe an extra ( or an empty condition?';
    else if (c.k === 'kw' && TYPE_WORDS.has(c.v)) hint = 'Declarations go on their own line, e.g.  int x;  (not inside an expression).';
    throw new CError(`expected an expression before ${desc(c)}`, c.line, c.col, hint);
  }
}

export function parse(src: string): Program {
  const lx = lex(src);
  const p = new Parser(lx.toks);
  p.parseProgram();
  return { funcs: p.funcs, protos: p.protos, funcList: p.funcList, globals: p.globals, src, includes: lx.includes };
}
