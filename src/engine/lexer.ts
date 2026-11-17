// Mini C lexer with a tiny preprocessor (#include tracking, object-like #define)
export type Sev = 'error' | 'warning' | 'note';
export interface Diag { sev: Sev; line: number; col: number; msg: string; hint?: string }

export class CError extends Error {
  line: number; col: number; hint?: string;
  constructor(msg: string, line: number, col = 0, hint?: string) {
    super(msg); this.line = line; this.col = col; this.hint = hint;
  }
}

export interface Token {
  k: 'num' | 'char' | 'str' | 'id' | 'kw' | 'op' | 'eof';
  v: string; n?: number; f?: boolean; fl?: boolean;
  line: number; col: number; s: number; e: number; mac?: string;
}

export const KEYWORDS = new Set([
  'int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed', 'const', 'static',
  'if', 'else', 'while', 'do', 'for', 'switch', 'case', 'default', 'break', 'continue', 'return',
  'sizeof', 'struct', 'typedef', 'goto', 'bool', '_Bool', 'enum', 'union', 'extern', 'register',
  'auto', 'volatile', 'inline',
]);

const OPS3 = ['<<=', '>>=', '...'];
const OPS2 = ['->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|='];
const OPS1 = '+-*/%<>=!&|^~?:;,.()[]{}';

export interface LexOut { toks: Token[]; includes: string[]; defines: Record<string, Token[]> }

const isD = (c: string | undefined) => !!c && c >= '0' && c <= '9';
const isIdS = (c: string | undefined) => !!c && /[A-Za-z_]/.test(c);
const isId = (c: string | undefined) => !!c && /[A-Za-z0-9_]/.test(c);

function readEscape(src: string, i: number): [number, number] {
  const c = src[i + 1];
  switch (c) {
    case 'n': return [10, 2]; case 't': return [9, 2]; case 'r': return [13, 2];
    case '\\': return [92, 2]; case "'": return [39, 2]; case '"': return [34, 2];
    case 'a': return [7, 2]; case 'b': return [8, 2]; case 'f': return [12, 2]; case 'v': return [11, 2];
    case '?': return [63, 2];
    case 'x': { let j = i + 2; while (/[0-9a-fA-F]/.test(src[j] || '')) j++; return [parseInt(src.slice(i + 2, j) || '0', 16) & 255, j - i]; }
    default:
      if (c >= '0' && c <= '7') { let j = i + 1; while (j < i + 4 && src[j] >= '0' && src[j] <= '7') j++; return [parseInt(src.slice(i + 1, j), 8) & 255, j - i]; }
      return [c ? c.charCodeAt(0) : 92, 2];
  }
}

export function lex(src: string): LexOut {
  const toks: Token[] = [];
  const includes: string[] = [];
  const defines: Record<string, Token[]> = {};
  let i = 0, line = 1, col = 1, lineStart = true;
  const n = src.length;
  const adv = (k = 1) => {
    for (let j = 0; j < k && i < n; j++) {
      if (src[i] === '\n') { line++; col = 1; lineStart = true; } else col++;
      i++;
    }
  };
  const push = (t: Token) => {
    if (t.k === 'id' && defines[t.v]) {
      for (const m of defines[t.v]) toks.push({ ...m, line: t.line, col: t.col, s: t.s, e: t.e, mac: t.v });
      return;
    }
    toks.push(t);
  };

  while (i < n) {
    const c = src[i];
    if (c === '\n' || c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { adv(); continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') adv(); continue; }
    if (c === '/' && src[i + 1] === '*') {
      const sl = line, sc = col; adv(2);
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) adv();
      if (i >= n) throw new CError('unterminated comment', sl, sc, 'A /* comment must be closed with */');
      adv(2); continue;
    }
    if (c === '#' && lineStart) {
      const sl = line; let j = i;
      while (j < n && src[j] !== '\n') j++;
      const text = src.slice(i + 1, j).trim();
      let m: RegExpMatchArray | null;
      if ((m = text.match(/^include\s*[<"]([^>"]+)[>"]/))) includes.push(m[1].trim().toLowerCase());
      else if (/^include/.test(text)) throw new CError('#include expects <FILENAME> or "FILENAME"', sl, 1, 'Example: #include <stdio.h>');
      else if ((m = text.match(/^define\s+([A-Za-z_]\w*)(\()?\s*(.*)$/))) {
        if (m[2]) throw new CError(`function-like macro '${m[1]}(...)' is not supported here`, sl, 1, 'Use a normal function instead.');
        const body = lex(m[3].replace(/\/\/.*$/, '')).toks.filter(t => t.k !== 'eof');
        const expanded: Token[] = [];
        for (const t of body) { if (t.k === 'id' && defines[t.v]) expanded.push(...defines[t.v]); else expanded.push(t); }
        defines[m[1]] = expanded;
      }
      while (i < j) adv();
      continue;
    }
    lineStart = false;
    const s = i, sl = line, sc = col;

    if (isD(c) || (c === '.' && isD(src[i + 1]))) {
      let j = i, isF = false, val: number;
      if (c === '0' && (src[j + 1] === 'x' || src[j + 1] === 'X')) {
        j += 2; while (/[0-9a-fA-F]/.test(src[j] || '')) j++;
        val = parseInt(src.slice(i + 2, j), 16);
      } else {
        while (isD(src[j])) j++;
        if (src[j] === '.') { isF = true; j++; while (isD(src[j])) j++; }
        if (src[j] === 'e' || src[j] === 'E') {
          let k = j + 1; if (src[k] === '+' || src[k] === '-') k++;
          if (isD(src[k])) { isF = true; j = k; while (isD(src[j])) j++; }
        }
        const txt = src.slice(i, j);
        val = isF ? parseFloat(txt) : (txt.length > 1 && txt[0] === '0' ? parseInt(txt, 8) : parseInt(txt, 10));
      }
      let fl = false;
      while (/[uUlLfF]/.test(src[j] || '')) { if (/[fF]/.test(src[j])) fl = true; j++; }
      if (isIdS(src[j])) throw new CError(`invalid suffix "${src.slice(j).match(/^\w+/)![0]}" on number`, sl, sc, 'Variable names cannot start with a digit. Multiplication needs *, e.g. 2*r not 2r.');
      adv(j - i);
      push({ k: 'num', v: src.slice(s, i), n: val, f: isF || fl, fl, line: sl, col: sc, s, e: i });
      continue;
    }
    if (isIdS(c)) {
      let j = i; while (isId(src[j])) j++;
      const w = src.slice(i, j); adv(j - i);
      push({ k: KEYWORDS.has(w) ? 'kw' : 'id', v: w, line: sl, col: sc, s, e: i });
      continue;
    }
    if (c === "'") {
      adv(); let v: number;
      if (src[i] === '\\') { const [code, len] = readEscape(src, i); v = code; adv(len); }
      else if (src[i] === "'" || src[i] === '\n' || i >= n) throw new CError('empty character constant', sl, sc, "A char literal needs exactly one character, like 'A'.");
      else { v = src.charCodeAt(i); adv(); }
      if (src[i] !== "'") throw new CError("missing terminating ' character", sl, sc, `Single quotes hold ONE character, like 'a'. For text use double quotes: "hello".`);
      adv();
      push({ k: 'char', v: src.slice(s, i), n: v, line: sl, col: sc, s, e: i });
      continue;
    }
    if (c === '"') {
      adv(); let out = '';
      while (i < n && src[i] !== '"') {
        if (src[i] === '\n') throw new CError('missing terminating " character', sl, sc, 'Close your text with " on the same line. For a line break inside text use \\n.');
        if (src[i] === '\\') { const [code, len] = readEscape(src, i); out += String.fromCharCode(code); adv(len); }
        else { out += src[i]; adv(); }
      }
      if (i >= n) throw new CError('missing terminating " character', sl, sc, 'Close your text with "');
      adv();
      push({ k: 'str', v: out, line: sl, col: sc, s, e: i });
      continue;
    }
    const three = src.substr(i, 3), two = src.substr(i, 2);
    let op: string | null = null;
    if (OPS3.includes(three)) op = three; else if (OPS2.includes(two)) op = two; else if (OPS1.includes(c)) op = c;
    if (op) { adv(op.length); push({ k: 'op', v: op, line: sl, col: sc, s, e: i }); continue; }
    const curly = '“”‘’'.includes(c);
    throw new CError(`stray '${c}' in program`, sl, sc, curly ? 'Those are curly “smart” quotes (from Word/Docs/phone keyboards). C only understands straight quotes: " and \'.' : c === '#' ? 'Preprocessor lines (#include, #define) must start at the beginning of a line.' : 'This character is not part of C syntax.');
  }
  toks.push({ k: 'eof', v: '<end>', line, col, s: n, e: n });
  return { toks, includes, defines };
}
