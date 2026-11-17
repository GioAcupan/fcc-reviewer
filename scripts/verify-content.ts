// Runs every reference solution against its tests + checks every traced/flow code compiles.
import { LESSONS } from '../src/content/lessons';
import { CHALLENGES } from '../src/content/challenges';
import { gradeAll } from '../src/lib/grade';
import { compile, run } from '../src/engine/interp';
import { buildFlow } from '../src/engine/flow';

let bad = 0, ok = 0;
const check = (label: string, code: string, tests: any[]) => {
  const g = gradeAll(code, tests);
  if (!g.compiled.ok) { bad++; console.log(`✗ ${label}: COMPILE`, g.compiled.diags.map(d => `L${d.line} ${d.msg}`).join(' | ')); return; }
  const warns = g.compiled.diags.filter(d => d.sev === 'warning');
  if (warns.length) console.log(`  ⚠ ${label}:`, warns.map(d => `L${d.line} ${d.msg}`).join(' | '));
  g.results.forEach((r, i) => {
    if (!r.ok) { bad++; console.log(`✗ ${label} test ${i + 1}: ${r.why}\n    in=${JSON.stringify(r.input)} out=${JSON.stringify(r.output)}`); }
    else ok++;
  });
};
for (const l of LESSONS) {
  l.steps.forEach((s, i) => {
    const label = `${l.id}#${i + 1} ${s.title}`;
    if (s.t === 'code') check(label, s.solution, s.tests);
    if (s.t === 'trace' || s.t === 'link' || (s.t === 'read' && s.flow)) {
      const c = compile(s.code!);
      if (!c.ok) { bad++; console.log(`✗ ${label}: trace code does not compile`, c.diags.map(d => d.msg)); return; }
      const r = run(c, { stdin: (s as any).stdin ?? '', trace: true });
      const f = buildFlow(c.prog!);
      const unm = [...new Set(r.trace.map(t => t.key))].filter(k => f!.keyMap[k] === undefined);
      console.log(`  · ${label}: ${r.status} trace=${r.trace.length} flowNodes=${f!.nodes.length} unmapped=${unm.length} out=${JSON.stringify(r.output.slice(0, 60))}`);
      ok++;
    }
    if (s.t === 'fill') {
      const n = (s.code.match(/\[\[/g) || []).length;
      if (!n) { bad++; console.log(`✗ ${label}: no blanks`); }
    }
  });
}
for (const ch of CHALLENGES) check(`challenge ${ch.id} ${ch.title}`, ch.solution, ch.tests);
console.log(`\n${ok} ok, ${bad} problems`);
