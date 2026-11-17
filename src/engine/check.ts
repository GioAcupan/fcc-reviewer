// Semantic checker: types every expression and produces gcc-style errors + friendly "teacher" warnings
import type { Diag } from './lexer';
import type { Base, DeclTy, N, Program, Ty } from './parser';

export const INT: Ty = { b: 'int', p: 0, a: 0 };
export const DBL: Ty = { b: 'double', p: 0, a: 0 };
const CHR: Ty = { b: 'char', p: 0, a: 0 };

export interface BI { ret: Ty; h: string; n?: number }
const d1 = (h = 'math.h'): BI => ({ ret: DBL, h, n: 1 });
export const BUILTINS: Record<string, BI> = {
  printf: { ret: INT, h: 'stdio.h' }, scanf: { ret: INT, h: 'stdio.h' }, puts: { ret: INT, h: 'stdio.h', n: 1 },
  putchar: { ret: INT, h: 'stdio.h', n: 1 }, getchar: { ret: INT, h: 'stdio.h', n: 0 }, fflush: { ret: INT, h: 'stdio.h' },
  pow: { ret: DBL, h: 'math.h', n: 2 }, sqrt: d1(), fabs: d1(), ceil: d1(), floor: d1(), round: d1(), trunc: d1(),
  sin: d1(), cos: d1(), tan: d1(), asin: d1(), acos: d1(), atan: d1(), exp: d1(), log: d1(), log10: d1(), log2: d1(), cbrt: d1(),
  atan2: { ret: DBL, h: 'math.h', n: 2 }, fmod: { ret: DBL, h: 'math.h', n: 2 }, hypot: { ret: DBL, h: 'math.h', n: 2 },
  abs: { ret: INT, h: 'stdlib.h', n: 1 }, labs: { ret: { b: 'long', p: 0, a: 0 }, h: 'stdlib.h', n: 1 },
  rand: { ret: INT, h: 'stdlib.h', n: 0 }, srand: { ret: INT, h: 'stdlib.h', n: 1 }, exit: { ret: INT, h: 'stdlib.h', n: 1 },
  system: { ret: INT, h: 'stdlib.h', n: 1 }, time: { ret: { b: 'long', p: 0, a: 0 }, h: 'time.h', n: 1 },
  toupper: { ret: INT, h: 'ctype.h', n: 1 }, tolower: { ret: INT, h: 'ctype.h', n: 1 }, isdigit: { ret: INT, h: 'ctype.h', n: 1 },
  isalpha: { ret: INT, h: 'ctype.h', n: 1 }, isspace: { ret: INT, h: 'ctype.h', n: 1 }, isupper: { ret: INT, h: 'ctype.h', n: 1 },
  islower: { ret: INT, h: 'ctype.h', n: 1 },
  strlen: { ret: INT, h: 'string.h', n: 1 }, strcmp: { ret: INT, h: 'string.h', n: 2 },
  strcpy: { ret: { b: 'char', p: 1, a: 0 }, h: 'string.h', n: 2 }, strcat: { ret: { b: 'char', p: 1, a: 0 }, h: 'string.h', n: 2 },
  getch: { ret: INT, h: 'conio.h', n: 0 }, getche: { ret: INT, h: 'conio.h', n: 0 }, clrscr: { ret: INT, h: 'conio.h', n: 0 },
};
export const CONSTS: Record<string, { v: number; ty: Ty; h: string }> = {
  M_PI: { v: Math.PI, ty: DBL, h: 'math.h' }, M_E: { v: Math.E, ty: DBL, h: 'math.h' },
  EOF: { v: -1, ty: INT, h: 'stdio.h' }, NULL: { v: 0, ty: INT, h: 'stdio.h' },
  RAND_MAX: { v: 2147483647, ty: INT, h: 'stdlib.h' }, INT_MAX: { v: 2147483647, ty: INT, h: 'limits.h' },
  INT_MIN: { v: -2147483648, ty: INT, h: 'limits.h' }, true: { v: 1, ty: INT, h: 'stdbool.h' }, false: { v: 0, ty: INT, h: 'stdbool.h' },
};

export const isFloat = (t?: Ty) => !!t && t.p === 0 && t.a === 0 && (t.b === 'float' || t.b === 'double');
export const isPtr = (t?: Ty) => !!t && (t.p > 0 || t.a > 0);
export const isIntTy = (t?: Ty) => !!t && t.p === 0 && t.a === 0 && !isFloat(t);
export const tyStr = (t: Ty) => `${t.b}${'*'.repeat(t.p)}${t.a ? '[]'.repeat(t.a) : ''}`;
export function arith(l: Ty, r: Ty): Ty {
  const bs = [l.b, r.b];
  const b: Base = bs.includes('double') ? 'double' : bs.includes('float') ? 'float' : bs.includes('long') ? 'long' : 'int';
  return { b, p: 0, a: 0 };
}
export const declToTy = (d: DeclTy): Ty => ({ b: d.b, p: d.p, a: d.dims.length });

function lev(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
function closest(name: string, pool: string[]) {
  let best: string | null = null, bd = 3;
  for (const p of pool) { const d = lev(name.toLowerCase(), p.toLowerCase()); if (d < bd || (d === 0 && p !== name)) { bd = d; best = p; } }
  return best && best !== name ? best : null;
}

const FMT_RE = /%([-+ #0]*)(\d+|\*)?(?:\.(\d+|\*))?(hh|h|ll|l|L|z|j|t)?([diouxXeEfFgGcspn%])/g;
export function fmtSpecs(fmt: string) {
  const res: { conv: string; len: string; text: string }[] = [];
  let m: RegExpExecArray | null; FMT_RE.lastIndex = 0;
  while ((m = FMT_RE.exec(fmt))) { if (m[5] !== '%') res.push({ conv: m[5], len: m[4] || '', text: m[0] }); }
  return res;
}

export function check(prog: Program): Diag[] {
  const diags: Diag[] = [];
  const err = (n: { line: number; col: number }, msg: string, hint?: string) => diags.push({ sev: 'error', line: n.line, col: n.col, msg, hint });
  const warn = (n: { line: number; col: number }, msg: string, hint?: string) => {
    if (!diags.some(d => d.line === n.line && d.msg === msg)) diags.push({ sev: 'warning', line: n.line, col: n.col, msg, hint });
  };
  const inc = new Set(prog.includes);
  const warnedH = new Set<string>();
  const needHeader = (n: N, h: string, name: string) => {
    if (inc.has(h) || warnedH.has(h)) return;
    if (h === 'stdbool.h') return;
    warnedH.add(h);
    warn(n, `implicit declaration of '${name}' — did you forget #include <${h}>?`, `Add  #include <${h}>  at the top. On paper exams, a missing #include can cost points!`);
  };
  const scopes: Map<string, Ty>[] = [new Map()];
  const lookup = (name: string) => { for (let i = scopes.length - 1; i >= 0; i--) { const t = scopes[i].get(name); if (t) return t; } return undefined; };
  const visible = () => scopes.flatMap(s => [...s.keys()]);
  let loopDepth = 0, switchDepth = 0;
  let curFn: N | null = null;

  const art = (t: Ty) => (/^[aeiou]/.test(t.b) ? 'an' : 'a');
  const chopHint = (v: string) => `Storing a decimal in an int CHOPS it: 3.99 becomes 3 (no rounding). If ${v} should keep decimals, declare it as double. If you really want a whole number, write (int) in front to show you mean it.`;
  const isLval = (e: N): boolean => e.k === 'id' || e.k === 'index' || (e.k === 'unary' && e.op === '*');
  const nm = (e: N) => prog.src.slice(e.s, e.end);

  function findIntDiv(e: N | null | undefined, out: N[]) {
    if (!e) return;
    if (e.k === 'bin' && e.op === '/' && isIntTy(e.l.ty) && isIntTy(e.r.ty)) out.push(e);
    for (const k of ['l', 'r', 'e', 'c', 't', 'f']) if (e[k] && typeof e[k] === 'object' && e[k].k) findIntDiv(e[k], out);
    if (e.k === 'call') for (const a of e.args) findIntDiv(a, out);
  }
  function warnIntDiv(e: N | null | undefined) {
    const found: N[] = []; findIntDiv(e, found);
    for (const d of found) {
      const both = d.l.k === 'num' && d.r.k === 'num';
      warn(d, `integer division '${nm(d)}' throws away the decimal part`, both
        ? `Both numbers are integers, so ${nm(d)} is computed as an integer (e.g. 1/2 = 0!). Write ${d.l.raw}.0/${d.r.raw} or 0.5 instead.`
        : `Both sides of / are integers, so C truncates the result BEFORE storing it as a decimal. Write (double) ${nm(d.l)} / ${nm(d.r)} instead.`);
    }
  }

  function T(e: N): Ty { const t = T0(e); e.ty = t; return t; }
  function T0(e: N): Ty {
    switch (e.k) {
      case 'num': return e.isF ? { b: e.fl ? 'float' : 'double', p: 0, a: 0 } : (e.isChar ? CHR : INT);
      case 'str': return { b: 'char', p: 1, a: 0 };
      case 'id': {
        const t = lookup(e.name); if (t) return t;
        const c = CONSTS[e.name];
        if (c) { needHeader(e, c.h, e.name); e.builtin = true; return c.ty; }
        if (prog.funcs[e.name] || BUILTINS[e.name]) { err(e, `'${e.name}' is a function — call it with parentheses, e.g. ${e.name}(...)`); return INT; }
        const sug = closest(e.name, visible());
        err(e, `'${e.name}' undeclared (first use in this function)`, sug ? `Did you mean '${sug}'? (C is case-sensitive)` : `Declare it before using it, e.g.  int ${e.name};`);
        return INT;
      }
      case 'unary': {
        const t = T(e.e);
        switch (e.op) {
          case '-': case '+': return isFloat(t) ? t : (t.b === 'long' ? t : INT);
          case '!': case '~': return INT;
          case '&': if (!isLval(e.e)) err(e, "lvalue required as unary '&' operand", '& gives the address of a VARIABLE, e.g. &x'); return { b: t.b, p: t.p + 1, a: 0 };
          case '*': if (t.a > 0) return { ...t, a: t.a - 1 }; if (t.p > 0) return { ...t, p: t.p - 1 };
            err(e, `invalid use of unary '*' on a ${tyStr(t)}`, 'Did you mean multiplication? It needs a left side: a * b'); return INT;
        }
        return t;
      }
      case 'update': {
        const t = T(e.e);
        if (!isLval(e.e)) err(e, `lvalue required as ${e.op === '++' ? 'increment' : 'decrement'} operand`, `${e.op} only works on a variable, e.g. i${e.op}`);
        return t;
      }
      case 'bin': {
        const l = T(e.l), r = T(e.r);
        switch (e.op) {
          case '&&': case '||': return INT;
          case '<': case '>': case '<=': case '>=': case '==': case '!=':
            if (e.l.k === 'bin' && ['<', '>', '<=', '>='].includes(e.l.op) && ['<', '>', '<=', '>='].includes(e.op) && !e.l.paren)
              warn(e, `'${nm(e)}' does not work like in math`, `C checks (${nm(e.l)}) first, which gives 0 or 1, and then compares THAT. Write: ${nm(e.l)} && ${nm(e.l.r)} ${e.op} ${nm(e.r)}`);
            return INT;
          case '%':
            if (isFloat(l) || isFloat(r)) err(e, `invalid operands to binary % (have '${tyStr(l)}' and '${tyStr(r)}')`, '% (mod) only works on whole numbers (int). For decimals use fmod(a, b) from <math.h>.');
            return arith(l, r);
          case '^':
            warn(e, "'^' is NOT 'to the power of' in C — it is bitwise XOR", `For powers use pow(${nm(e.l)}, ${nm(e.r)}) from <math.h>, or multiply: ${nm(e.l)} * ${nm(e.l)}.`);
            return INT;
          case '&': case '|': case '<<': case '>>': return INT;
          case '+': case '-':
            if (isPtr(l) && isPtr(r)) return INT;
            if (isPtr(l)) return { b: l.b, p: l.p + (l.a ? 1 : 0), a: 0 };
            if (isPtr(r)) return { b: r.b, p: r.p + (r.a ? 1 : 0), a: 0 };
            return arith(l, r);
          default:
            if (isPtr(l) || isPtr(r)) err(e, `invalid operands to binary ${e.op}`);
            return arith(l, r);
        }
      }
      case 'assign': {
        const l = T(e.l); const r = T(e.r);
        if (!isLval(e.l)) err(e, 'lvalue required as left operand of assignment', 'The LEFT side of = must be a variable: area = l * w;  (math style  l * w = area  does not work in C)');
        else if (l.a > 0) err(e, `assignment to expression with array type`, 'Arrays can\'t be assigned with =. For text, declare  char *name;  instead, or copy with  strcpy(name, "...");  from <string.h>.');
        if (e.op === '%=' && (isFloat(l) || isFloat(r))) err(e, 'invalid operands to %=', '% only works with integers.');
        if (isFloat(l)) warnIntDiv(e.r);
        if (isIntTy(l) && isFloat(r)) warn(e, `'${nm(e.l)}' is ${art(l)} ${tyStr(l)}, so the decimal part of ${nm(e.r)} is thrown away`, chopHint(nm(e.l)));
        if (isIntTy(l) && e.r.k === 'str') err(e, `'${nm(e.l)}' is a single ${tyStr(l)} — it can't hold a "string"`, `A ${tyStr(l)} holds ONE value. For text declare  char *${nm(e.l)};  then  ${nm(e.l)} = "...";  (or use a char array + strcpy).`);
        return l;
      }
      case 'cond': { T(e.c); const a = T(e.t), b = T(e.f); return isPtr(a) ? a : isPtr(b) ? b : arith(a, b); }
      case 'comma': T(e.l); return T(e.r);
      case 'cast': T(e.e); return { b: e.to.b, p: e.to.p, a: 0 };
      case 'sizeof': if (e.e) T(e.e); return INT;
      case 'index': {
        const a = T(e.arr); const i = T(e.idx);
        if (isFloat(i)) err(e.idx, 'array subscript is not an integer', 'Array positions must be whole numbers: arr[i] where i is an int.');
        if (a.a > 0) return { ...a, a: a.a - 1 };
        if (a.p > 0) return { ...a, p: a.p - 1 };
        err(e, `'${nm(e.arr)}' is not an array`, `Declare it as an array first, e.g. int ${nm(e.arr)}[10];`);
        return INT;
      }
      case 'call': return callT(e);
      case 'initlist': e.items.forEach(T); return INT;
    }
    return INT;
  }

  function callT(e: N): Ty {
    const name: string = e.name;
    e.args.forEach(T);
    if (lookup(name)) { err(e, `'${name}' is a variable, not a function`, `Did you forget an operator? e.g. ${name} * (...)`); return INT; }
    const fn = prog.funcs[name] || prog.protos[name];
    if (fn) {
      if (e.args.length !== fn.params.length) err(e, `${e.args.length < fn.params.length ? 'too few' : 'too many'} arguments to function '${name}' (it takes ${fn.params.length})`);
      return declToTy(fn.ret);
    }
    const b = BUILTINS[name];
    if (!b) {
      const sug = closest(name, [...Object.keys(BUILTINS), ...Object.keys(prog.funcs)]);
      err(e, `implicit declaration of function '${name}'`, sug ? `Did you mean '${sug}'?` : 'This function does not exist. Check the spelling, or define it above main().');
      return INT;
    }
    needHeader(e, b.h, name);
    if (b.n !== undefined && e.args.length !== b.n) err(e, `${name}() takes ${b.n} argument${b.n === 1 ? '' : 's'} but got ${e.args.length}`, name === 'pow' ? 'pow(base, exponent) — e.g. pow(r, 2) means r²' : undefined);
    if (name === 'printf') checkPrintf(e);
    if (name === 'scanf') checkScanf(e);
    if (name === 'getch' || name === 'clrscr') { /* turbo-C habit, allowed */ }
    if (b.ret === DBL) for (const a of e.args) warnIntDiv(a);
    return b.ret;
  }

  function checkPrintf(e: N) {
    const f = e.args[0];
    if (!f) { err(e, 'printf needs at least a format string', 'Example: printf("Hello\\n");'); return; }
    if (f.k !== 'str') { if (!isPtr(f.ty)) err(f, 'the first argument of printf must be a "string"', `To print a number write: printf("%d", ${nm(f)});`); return; }
    const specs = fmtSpecs(f.v); const args = e.args.slice(1);
    if (specs.length > args.length) warn(e, `format has ${specs.length} placeholder${specs.length > 1 ? 's' : ''} but only ${args.length} value${args.length === 1 ? '' : 's'} given`, 'Each %d / %f / %c needs a matching variable after the string. Missing ones print garbage.');
    else if (specs.length < args.length) warn(e, `too many values for printf (${args.length} given, ${specs.length} placeholder${specs.length === 1 ? '' : 's'})`, 'Each value needs its own placeholder like %d in the string.');
    specs.forEach((s, i) => {
      const a = args[i]; if (!a || !a.ty) return;
      if ('diouxXc'.includes(s.conv)) {
        if (isFloat(a.ty)) warn(a, `'${s.text}' expects an int, but '${nm(a)}' is a ${a.ty.b}`, `Use %f (or %.2f) to print decimals. With ${s.text} you'll get garbage.`);
        else if (isPtr(a.ty) && a.k === 'unary' && a.op === '&') warn(a, `printf does not need & — you are printing the address of ${nm(a.e)}`, 'Only scanf uses &. Write printf("%d", x);');
      } else if ('feEgG'.includes(s.conv)) {
        if (isIntTy(a.ty)) warn(a, `'${s.text}' expects a double, but '${nm(a)}' is an ${a.ty.b}`, `Use %d for whole numbers, or convert: (double) ${nm(a)}`);
        else warnIntDiv(a);
      } else if (s.conv === 's' && !isPtr(a.ty)) warn(a, `'%s' expects a string, but '${nm(a)}' is a ${tyStr(a.ty)}`, 'Use %d for int, %f for double, %c for a single char.');
    });
  }

  function checkScanf(e: N) {
    const f = e.args[0];
    if (!f || f.k !== 'str') return;
    const specs = fmtSpecs(f.v); const args = e.args.slice(1);
    if (/[^\s%]/.test(f.v.replace(/%[*]?\d*(hh|h|ll|l|L)?[a-zA-Z]/g, '').replace(/\s/g, '')) && /[A-Za-z]{3,}/.test(f.v.replace(/%\w+/g, '')))
      warn(f, 'scanf does not print text — that text must be TYPED by the user', 'Put the prompt in a printf first: printf("Enter n: "); scanf("%d", &n);');
    if (/\\n|\n/.test(JSON.stringify(f.v)) && /\s$/.test(f.v)) warn(f, "remove the trailing \\n / space in scanf's format", 'scanf("%d\\n", ...) waits for extra input. Use scanf("%d", &x);');
    if (specs.length !== args.length) warn(e, `scanf has ${specs.length} placeholder${specs.length === 1 ? '' : 's'} but ${args.length} variable${args.length === 1 ? '' : 's'}`, 'Each % code needs one &variable.');
    specs.forEach((s, i) => {
      const a = args[i]; if (!a || !a.ty) return;
      if (!isPtr(a.ty)) {
        warn(a, `scanf needs the ADDRESS of '${nm(a)}' — write &${nm(a)}`, `Without &, scanf does not know where to store the value and the program crashes. Correct: scanf("${s.text}", &${nm(a)});`);
        return;
      }
      const target = a.ty.a > 0 ? a.ty.b : (a.ty.p === 1 ? a.ty.b : null);
      if (!target) return;
      if ('feEgG'.includes(s.conv)) {
        if (target === 'double' && s.len !== 'l' && s.len !== 'L') warn(a, `use %lf (not ${s.text}) to read into the double '${nm(a.e ?? a)}'`, 'scanf: %f → float, %lf → double. (printf can use %f for both.)');
        else if (target === 'float' && s.len === 'l') warn(a, `use %f (not ${s.text}) to read into the float '${nm(a.e ?? a)}'`, 'scanf: %f → float, %lf → double.');
        else if (target !== 'double' && target !== 'float') warn(a, `${s.text} reads a decimal but '${nm(a.e ?? a)}' is an ${target}`, 'Use %d to read an int.');
      } else if ('diu'.includes(s.conv) && (target === 'double' || target === 'float')) warn(a, `${s.text} reads an int but '${nm(a.e ?? a)}' is a ${target}`, `Use ${target === 'double' ? '%lf' : '%f'} to read a ${target}.`);
    });
  }

  function declItems(d: N, isGlobal = false) {
    for (const it of d.items) {
      for (const dim of it.ty.dims) if (dim) T(dim);
      if (it.ty.b === 'void' && it.ty.p === 0) err(it, `variable '${it.name}' declared void`, 'Use int, float, double or char.');
      const top = scopes[scopes.length - 1];
      if (top.has(it.name)) err(it, `redeclaration of '${it.name}'`, `'${it.name}' was already declared. Declare each variable only once.`);
      const ty = declToTy(it.ty);
      if (it.init) {
        T(it.init);
        if (it.init.k === 'str' && ty.a === 0 && ty.p === 0) err(it, `'${it.name}' is a single char but you gave it a "string"`, `Use an array: char ${it.name}[50] = "...";`);
        if (isFloat(ty)) warnIntDiv(it.init);
        if (isIntTy(ty) && it.init.k !== 'initlist' && isFloat(it.init.ty)) warn(it, `'${it.name}' is ${art(ty)} ${tyStr(ty)}, so the decimal part of ${nm(it.init)} is thrown away`, chopHint(it.name));
        if (ty.a > 0 && it.init.k !== 'initlist' && it.init.k !== 'str') err(it, 'invalid array initializer', 'Use braces: int a[3] = {1, 2, 3};');
      }
      if (isGlobal && it.init && !['num', 'str', 'initlist', 'unary'].includes(it.init.k) && !(it.init.k === 'id' && it.init.builtin)) {
        // allow constant expressions loosely
      }
      top.set(it.name, ty);
    }
  }

  function cond(e: N) {
    T(e);
    if (e.k === 'assign' && e.op === '=' && !e.paren) warn(e, `'=' inside a condition ASSIGNS — did you mean '=='?`, `${nm(e.l)} = ${nm(e.r)} stores ${nm(e.r)} into ${nm(e.l)}. To compare use ==.`);
  }
  function emptyBody(s: N, what: string) {
    if (s.k === 'empty') warn(s, `the ${what} has an empty body — is that ';' a mistake?`, `"${what} (...);" ends the ${what} immediately. Remove the semicolon before the {.`);
  }

  function stmt(s: N) {
    switch (s.k) {
      case 'block': scopes.push(new Map()); s.body.forEach(stmt); scopes.pop(); break;
      case 'decl': declItems(s); break;
      case 'expr':
        T(s.e);
        if (s.e.k === 'bin' && s.e.op === '==') warn(s, 'this comparison does nothing — did you mean = (assign)?', `To store a value write ${nm(s.e.l)} = ${nm(s.e.r)};`);
        else if (s.e.k === 'bin' || s.e.k === 'id' || s.e.k === 'num') warn(s, 'statement with no effect', s.e.k === 'bin' ? `The result of ${nm(s.e)} is computed and thrown away. Did you mean to store it, e.g. x = ${nm(s.e)};` : undefined);
        break;
      case 'if': cond(s.cond); emptyBody(s.then, 'if'); stmt(s.then); if (s.els) stmt(s.els); break;
      case 'while': cond(s.cond); emptyBody(s.body, 'while'); loopDepth++; stmt(s.body); loopDepth--; break;
      case 'do': loopDepth++; stmt(s.body); loopDepth--; cond(s.cond); break;
      case 'for':
        scopes.push(new Map());
        if (s.init) { if (s.init.k === 'decl') declItems(s.init); else T(s.init); }
        if (s.cond) cond(s.cond);
        if (s.update) T(s.update);
        emptyBody(s.body, 'for');
        loopDepth++; stmt(s.body); loopDepth--;
        scopes.pop();
        break;
      case 'switch': {
        const t = T(s.disc);
        if (isFloat(t)) err(s.disc, 'switch quantity is not an integer', 'switch only works with int or char. Use if / else if for decimals.');
        switchDepth++; stmt(s.body); switchDepth--; break;
      }
      case 'case': if (!switchDepth) err(s, "'case' label not within a switch statement"); T(s.value); break;
      case 'default': if (!switchDepth) err(s, "'default' label not within a switch statement"); break;
      case 'break': if (!loopDepth && !switchDepth) err(s, 'break statement not within loop or switch'); break;
      case 'continue': if (!loopDepth) err(s, 'continue statement not within a loop'); break;
      case 'return':
        if (s.e) { T(s.e); if (curFn && curFn.ret.b === 'void' && curFn.ret.p === 0) warn(s, `'return' with a value, in a void function`, 'void functions just write return; (or nothing).'); }
        else if (curFn && curFn.ret.b !== 'void' && curFn.name !== 'main') warn(s, `'return' with no value in a function that returns ${curFn.ret.b}`);
        break;
    }
  }

  for (const g of prog.globals) declItems(g, true);
  for (const fn of prog.funcList) {
    curFn = fn;
    const ps = new Map<string, Ty>();
    for (const p of fn.params) if (p.name) ps.set(p.name, declToTy(p.ty));
    scopes.push(ps);
    stmt(fn.body);
    scopes.pop();
  }
  const main = prog.funcs.main;
  if (!main) diags.push({ sev: 'error', line: 1, col: 1, msg: "undefined reference to 'main'", hint: 'Every C program needs  int main() { ... }  — that is the Start of your flowchart.' });
  else if (main.ret.b === 'void') warn(main, "return type of 'main' should be 'int'", 'Standard C: int main() { ... return 0; }. (Turbo C allowed void main, modern compilers complain.)');
  return diags;
}
