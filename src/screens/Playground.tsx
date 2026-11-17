import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Workflow, Activity, FileCode2, FilePlus2 } from 'lucide-react';
import { Editor, EditorApi, KeyBar } from '../components/Editor';
import { Console, useRunner } from '../components/Console';
import { Flowchart } from '../components/Flowchart';
import { Tracer } from '../components/Tracer';
import { compile } from '../engine/interp';
import { buildFlow, Flow } from '../engine/flow';
import { getProgress, update } from '../lib/store';
import { C, STARTER, STARTER_MATH } from '../content/types';
import { P11, P6 } from '../content/lessons';

const EXAMPLES: { name: string; code: string }[] = [
  { name: 'Hello', code: C`
#include <stdio.h>

int main() {
    printf("Hello, C!\n");
    return 0;
}
` },
  { name: 'Problem 11 (guard + sum)', code: P11 },
  { name: 'Frustum SA (Problem 1)', code: C`
#include <stdio.h>
#include <math.h>
#define PI 3.14159

int main() {
    double R, r, h, s, total;
    printf("Enter R, r, h: ");
    scanf("%lf %lf %lf", &R, &r, &h);
    s = sqrt(h * h + (R - r) * (R - r));
    total = PI * r * r + PI * R * R + PI * (R + r) * s;
    printf("Total surface area = %.2f\n", total);
    return 0;
}
` },
  { name: 'Bug hunt (5 bugs!)', code: C`
#include <stdio.h>

int main() {
    int n, i, sum;
    double avg;
    printf("Enter N: ");
    scanf("%d", n);
    for (i = 1; i <= n; i++) {
        sum = sum + i;
    }
    avg = sum / n;
    if (avg = 0) printf("zero\n");
    printf("Sum = %d, avg = %d\n", sum, avg);
    return 0;
}
` },
  { name: 'GWA honors (Problem 6)', code: P6 },
  { name: 'Grade ladder', code: C`
#include <stdio.h>

int main() {
    int score;
    printf("Score: ");
    scanf("%d", &score);
    if (score >= 90) printf("A\n");
    else if (score >= 80) printf("B\n");
    else if (score >= 70) printf("C\n");
    else printf("F\n");
    return 0;
}
` },
  { name: 'Star pattern', code: C`
#include <stdio.h>

int main() {
    int i, j, n = 5;
    for (i = 1; i <= n; i++) {
        for (j = 1; j <= i; j++) {
            printf("*");
        }
        printf("\n");
    }
    return 0;
}
` },
];

const TEMPLATES: { name: string; code: string }[] = [
  { name: 'Blank program', code: STARTER },
  { name: 'Blank + math.h', code: STARTER_MATH },
];
// the empty, indented line inside main() where you start typing
const bodyLine = (src: string) => src.split('\n').findIndex((l, i, a) => i > 0 && /^\s+$/.test(l) && /main\s*\(/.test(a[i - 1])) + 1;

export function Playground() {
  const [code, setCode] = useState(() => getProgress().playground || STARTER);
  const [tab, setTab] = useState<'term' | 'flow' | 'trace'>('term');
  const api = useRef<EditorApi | null>(null);
  const runner = useRunner();
  useEffect(() => { const t = setTimeout(() => update(p => { p.playground = code; }), 400); return () => clearTimeout(t); }, [code]);
  // live flowchart: recompile (debounced) as you type
  const [live, setLive] = useState<{ flow: Flow | null; err: string | null; diags: { line: number; sev: string }[] }>({ flow: null, err: null, diags: [] });
  const lastGood = useRef<Flow | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const c = compile(code);
      const diags = c.diags.map(d => ({ line: d.line, sev: d.sev }));
      if (c.prog && c.ok) { const f = buildFlow(c.prog); lastGood.current = f; setLive({ flow: f, err: null, diags }); }
      else setLive({ flow: lastGood.current, err: c.diags.find(d => d.sev === 'error')?.msg ?? 'error', diags });
    }, 350);
    return () => clearTimeout(t);
  }, [code]);
  const traceData = useMemo(() => (runner.st.phase === 'done' && runner.st.compiled?.ok && runner.st.result ? { compiled: runner.st.compiled, result: runner.st.result } : null), [runner.st]);
  const run = () => { setTab('term'); runner.start(code); };
  const load = (name: string, src: string, template: boolean) => {
    const untouched = !code.trim() || [...TEMPLATES, ...EXAMPLES].some(x => x.code === code);
    if (!untouched && !confirm(template ? 'Start a new file? Your current code will be replaced (↶ undo brings it back).' : `Replace your code with “${name}”? (↶ undo brings it back)`)) return;
    setCode(src); api.current?.set(src); runner.reset(); setTab('term');
    if (template) setTimeout(() => api.current?.goto(bodyLine(src)), 0); // cursor on the empty line inside main()
  };
  return (
    <div className="page play">
      <header className="page-h row">
        <h2>Playground</h2>
        <div className="pg-tools">
          <button className="btn small" onClick={() => load('Blank program', STARTER, true)} aria-label="New file from the boilerplate template"><FilePlus2 size={14} /> New</button>
          <label className="ex-pick"><FileCode2 size={15} />
            <select value="" aria-label="Load a template or an example" onChange={e => {
              const [kind, i] = e.target.value.split(':'); const it = (kind === 't' ? TEMPLATES : EXAMPLES)[+i];
              if (it) load(it.name, it.code, kind === 't');
            }}>
              <option value="">templates…</option>
              <optgroup label="Templates">{TEMPLATES.map((t, i) => <option key={'t' + i} value={`t:${i}`}>{t.name}</option>)}</optgroup>
              <optgroup label="Examples">{EXAMPLES.map((x, i) => <option key={'x' + i} value={`x:${i}`}>{x.name}</option>)}</optgroup>
            </select>
          </label>
        </div>
      </header>
      <div className="card ed">
        <div className="tabs"><span className="tab on">main.c</span><span className={`live-dot ${live.err ? 'bad' : 'ok'}`} title={live.err ?? 'compiles'}>{live.err ? '✗ ' + live.err.slice(0, 38) : '● compiles'}</span></div>
        <Editor value={code} onChange={setCode} marks={live.diags} apiRef={api} minH={260} />
        <KeyBar api={api} />
      </div>
      <div className="btnrow sticky-run">
        <button className="btn primary" onClick={run}><Play size={15} /> Run</button>
        <div className="seg">
          <button className={tab === 'term' ? 'on' : ''} onClick={() => setTab('term')}>Terminal</button>
          <button className={tab === 'flow' ? 'on' : ''} onClick={() => setTab('flow')}><Workflow size={13} /> Flowchart</button>
          <button className={tab === 'trace' ? 'on' : ''} onClick={() => setTab('trace')}><Activity size={13} /> Visualize</button>
        </div>
      </div>
      {tab === 'term' && (runner.st.phase === 'idle' ? <div className="empty-note">Press <b>Run</b>. If your program uses <code>scanf</code>, you will type the input right in the terminal.</div> : <Console st={runner.st} onSubmit={runner.submit} onLine={l => api.current?.goto(l)} />)}
      {tab === 'flow' && (live.flow ? <div className={live.err ? 'stale' : ''}>{live.err && <div className="sys bad">Showing the last version that compiled.</div>}<Flowchart flow={live.flow} /></div> : <div className="empty-note">Write a program with <code>int main()</code> — its flowchart appears here as you type.</div>)}
      {tab === 'trace' && (traceData ? <Tracer data={traceData} echoes={runner.st.echoes} /> : <div className="empty-note">{runner.st.phase === 'waiting' ? 'Finish entering the input in the Terminal first, then come back.' : <>Run your program to completion first, then press <b>Visualize</b> to replay it step by step.</>}</div>)}
    </div>
  );
}
