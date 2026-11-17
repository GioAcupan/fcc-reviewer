// Tiny line-based C syntax highlighter for static code views
export interface Tok { t: string; c: string }
const KW = new Set(['if', 'else', 'while', 'do', 'for', 'switch', 'case', 'default', 'break', 'continue', 'return', 'sizeof', 'const', 'static', 'struct', 'goto']);
const TY = new Set(['int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed', 'bool']);
const RE = /(\/\/.*$)|(\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"?)|('(?:[^'\\]|\\.)*'?)|(#\s*\w+(?:\s*<[^>]*>)?)|(\b\d+\.?\d*(?:[eE][-+]?\d+)?[fFuUlL]*\b|\.\d+)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_0-9"'#/]+|\/)/g;

export function hlLine(line: string): Tok[] {
  const out: Tok[] = [];
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(line))) {
    if (m[0] === '') { RE.lastIndex++; continue; }
    if (m[1] || m[2]) out.push({ t: m[0], c: 'com' });
    else if (m[3]) {
      // split string into format specifiers / escapes
      const parts = m[3].split(/(%[-+ #0]*\d*(?:\.\d+)?(?:hh|h|ll|l|L)?[diouxXeEfFgGcsp%]|\\.)/);
      for (const p of parts) if (p) out.push({ t: p, c: /^%/.test(p) ? 'fmt' : /^\\/.test(p) ? 'esc' : 'str' });
    }
    else if (m[4]) out.push({ t: m[0], c: 'str' });
    else if (m[5]) out.push({ t: m[0], c: 'pre' });
    else if (m[6]) out.push({ t: m[0], c: 'num' });
    else if (m[7]) {
      const w = m[7];
      const rest = line.slice(RE.lastIndex);
      out.push({ t: w, c: KW.has(w) ? 'kw' : TY.has(w) ? 'ty' : /^\s*\(/.test(rest) ? 'fn' : /^[A-Z_][A-Z0-9_]+$/.test(w) ? 'mac' : 'id' });
    }
    else if (m[8]) out.push({ t: m[0], c: '' });
    else out.push({ t: m[0], c: 'op' });
  }
  return out;
}
