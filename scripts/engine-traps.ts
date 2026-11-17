// Regression checks: the engine must reproduce real-C behavior on exam traps.
import { compile, run } from '../src/engine/interp';

let fails = 0;
const prog = (body: string) => `#include <stdio.h>\n#include <string.h>\nint main() {\n${body}\nreturn 0;\n}\n`;
function expectOut(name: string, body: string, stdin: string, want: string) {
  const c = compile(prog(body));
  if (!c.ok) { fails++; console.log(`✗ ${name}: did not compile —`, c.diags.map(d => d.msg).join(' | ')); return; }
  const r = run(c, { stdin, trace: true });
  const ok = r.output.trim() === want;
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} ${name}: got ${JSON.stringify(r.output.trim())}${ok ? '' : ` want ${JSON.stringify(want)}`}`);
  return r;
}
function expectError(name: string, body: string, msgPart: string) {
  const c = compile(prog(body));
  const hit = c.diags.find(d => d.sev === 'error' && d.msg.includes(msgPart));
  if (!hit) fails++;
  console.log(`${hit ? '✓' : '✗'} ${name}: ${hit ? hit.msg + ' // ' + hit.hint : 'missing error, got ' + JSON.stringify(c.diags.map(d => d.msg))}`);
}

expectOut('float GWA 1.20 vs double literal (real C: Magna)', 'float g; scanf("%f", &g); if (g <= 1.20) printf("Summa"); else printf("Magna");', '1.20\n', 'Magna');
expectOut('double GWA 1.20 boundary (Summa)', 'double g; scanf("%lf", &g); if (g <= 1.20) printf("Summa"); else printf("Magna");', '1.20\n', 'Summa');
expectOut('float vs 1.20f literal (Summa)', 'float g; scanf("%f", &g); if (g <= 1.20f) printf("Summa"); else printf("Magna");', '1.20\n', 'Summa');
const r = expectOut('char* text variable', 'char *h; h = "Cum Laude"; printf("%s", h);', '', 'Cum Laude');
const snap = r?.trace.at(-1)?.vars.find(v => v.name === 'h');
console.log(`${snap?.val === '"Cum Laude"' ? '✓' : '✗'} trace shows text: ${snap?.val}`); if (snap?.val !== '"Cum Laude"') fails++;
expectOut('strcpy into char array', 'char h[30]; strcpy(h, "Magna Cum Laude"); printf("%s", h);', '', 'Magna Cum Laude');
expectError('char = "string" is rejected', 'char h; h = "Summa";', "can't hold a \"string\"");
expectError('array = "string" is rejected', 'char h[30]; h = "Summa";', 'array type');

// data-types lesson
function expectWarn(name: string, body: string, msgPart: string) {
  const c = compile(prog(body));
  const hit = c.diags.find(d => d.sev === 'warning' && d.msg.includes(msgPart));
  if (!hit) fails++;
  console.log(`${hit ? '✓' : '✗'} ${name}: ${hit ? hit.msg : 'missing warning, got ' + JSON.stringify(c.diags.map(d => d.msg))}`);
}
expectOut('int overflow wraps around', 'int big = 2147483647; big = big + 1; printf("%d", big);', '', '-2147483648');
expectOut('long long holds it', 'long long b = 2147483647; b = b + 1; printf("%lld", b);', '', '2147483648');
expectOut('decimal chopped into int', 'int x = 3.99; printf("%d", x);', '', '3');
expectOut('char is a small number', "char c = 'A'; c = c + 1; printf(\"%c %d\", c, c);", '', 'B 66');
expectOut('float stores 1.20 imprecisely', 'float f = 1.20; printf("%.10f", f);', '', '1.2000000477');
expectOut('%d with a double prints garbage', 'printf("%d", 49.5);', '', '1717986918');
expectWarn('chop warning on assignment', 'int area; area = 3.14159 * 2 * 2;', 'thrown away');
expectWarn('chop warning on declaration', 'int x = 3.99;', 'thrown away');
const fr = expectOut('trace shows a float as stored', 'float f = 1.20; printf("ok");', '', 'ok');
const fv = fr?.trace.at(-1)?.vars.find(v => v.name === 'f')?.val;
console.log(`${fv === '1.200000048' ? '✓' : '✗'} float chip shows ${fv}`); if (fv !== '1.200000048') fails++;
console.log(fails ? `\n${fails} FAILED` : '\nall traps behave like real C');
