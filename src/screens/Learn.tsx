import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Lightbulb, Play, Eye, CheckCheck, Map as MapIcon } from 'lucide-react';
import { LESSONS, UNITS } from '../content/lessons';
import type { Lesson, Step } from '../content/types';
import { go } from '../lib/router';
import { addXp, update, useProgress, getProgress } from '../lib/store';
import { ActionBar, AState, Code, Md, burst, buzz, Ring } from '../components/ui';
import { Flowchart, SHAPE_NAMES } from '../components/Flowchart';
import { Tracer, traceCode } from '../components/Tracer';
import { Editor, EditorApi, KeyBar } from '../components/Editor';
import { Console, DiagList, useRunner } from '../components/Console';
import { ShapeLab } from '../components/ShapeLab';
import { compile } from '../engine/interp';
import { buildFlow } from '../engine/flow';
import { gradeAll, TestResult } from '../lib/grade';
import { hlLine } from '../lib/highlight';
import { resumeTarget } from '../lib/resume';

// ───────────── course map ─────────────
export function CourseMap() {
  const p = useProgress();
  const target = resumeTarget(p);
  const nextId = target.lesson.id;
  let k = 0;
  return (
    <div className="page map">
      <header className="page-h"><h2>Learn</h2><p className="mut">Flowchart → C → exam. Follow the path; bosses at the end are the exact exam problem types.</p></header>
      {UNITS.map(u => (
        <section key={u.n} className="unit" style={{ ['--uc' as any]: u.color }}>
          <div className="unit-h"><span className="t-com">// UNIT {u.n + 1}</span><b>{u.title}</b><span className="mut">{u.tag}</span></div>
          <div className="path">
            {LESSONS.filter(l => l.unit === u.n).map(l => {
              const st = p.lessons[l.id];
              const prog = st?.done ? 1 : (st?.step ?? 0) / l.steps.length;
              const off = (Math.sin(k++ * 1.1) + 1) * 11;
              return (
                <button key={l.id} className={`node ${st?.done ? 'done' : ''} ${l.id === nextId ? 'next' : ''} ${l.boss ? 'boss' : ''} ${l.mini ? 'mini' : ''}`} style={{ ['--off' as any]: `${off}%` }} onClick={() => go('/learn/' + l.id)}>
                  <Ring value={prog} size={l.boss ? 78 : l.mini ? 72 : 66} stroke={4} color={st?.done ? 'var(--ok)' : u.color}>
                    <span className="node-ic">{st?.done ? '✓' : l.icon}</span>
                  </Ring>
                  <span className="node-t"><b>{l.title}</b><span>{l.sub}</span>
                    {(l.id === nextId || l.boss || l.mini) && (
                      <span className="node-tags">
                        {l.boss && <em className="boss-tag">boss</em>}
                        {l.mini && <em className="boss-tag">mini-boss</em>}
                        {l.id === nextId && <em className="next-tag">{target.tag}</em>}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ───────────── shared bits ─────────────
const XP: Record<Step['t'], number> = { read: 5, link: 5, trace: 5, quiz: 10, fill: 10, order: 10, sort: 10, shape: 15, code: 25 };
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function LinkedView({ code, big }: { code: string; big?: boolean }) {
  const compiled = useMemo(() => compile(code), [code]);
  const flow = useMemo(() => (compiled.prog ? buildFlow(compiled.prog) : null), [compiled]);
  const [lines, setLines] = useState<Set<number>>(new Set());
  const [nodes, setNodes] = useState<Set<number>>(new Set());
  const [label, setLabel] = useState('');
  if (!flow) return <Code code={code} />;
  const pickNode = (i: number) => {
    const n = flow.nodes[i]; const ls = new Set<number>();
    for (let l = n.l0; l <= n.l1; l++) ls.add(l);
    setLines(ls); setNodes(new Set([i])); setLabel(SHAPE_NAMES[n.shape]); buzz(6);
  };
  const pickLine = (ln: number) => {
    const cands = flow.nodes.filter(n => n.l0 <= ln && ln <= n.l1).sort((a, b) => (a.l1 - a.l0) - (b.l1 - b.l0));
    if (!cands.length) { setLines(new Set([ln])); setNodes(new Set()); setLabel('no symbol — declarations without a value are not drawn'); return; }
    pickNode(cands[0].i);
  };
  return (
    <div className={`linked ${big ? 'big' : ''}`}>
      <Code code={code} hi={lines} onLine={pickLine} />
      <div className={`link-label ${label ? 'show' : ''}`}>{label ? <>◆ {label}</> : 'tap a line or a symbol'}</div>
      <Flowchart flow={flow} hiNodes={nodes} onNode={pickNode} maxH="60vh" />
    </div>
  );
}

// ───────────── step views ─────────────
type SP<T extends Step['t']> = { step: Extract<Step, { t: T }>; done: (firstTry?: boolean) => void };

function ReadStep({ step, done }: SP<'read'>) {
  return (
    <>
      <Md text={step.body} />
      {step.code && (step.flow ? <LinkedView code={step.code} /> : <Code code={step.code} anno={step.anno} reveal />)}
      {step.flow && step.anno && <div className="anno-list">{Object.entries(step.anno).map(([l, t]) => <div key={l}><span className="t-num">L{l}</span> {t}</div>)}</div>}
      <ActionBar state="read" onContinue={() => done()} />
    </>
  );
}
function LinkStep({ step, done }: SP<'link'>) {
  return <><Md text={step.body} /><LinkedView code={step.code} big /><ActionBar state="read" onContinue={() => done()} /></>;
}
function TraceStep({ step, done }: SP<'trace'>) {
  const data = useMemo(() => traceCode(step.code, step.stdin ? step.stdin + '\n' : ''), [step]);
  return (
    <>
      <Md text={step.body} />
      {step.stdin && <div className="stdin-chip">stdin ⟶ <code>{step.stdin}</code></div>}
      {data && <Tracer data={data} autoplay />}
      <ActionBar state="read" onContinue={() => done()} />
    </>
  );
}
function QuizStep({ step, done }: SP<'quiz'>) {
  const [sel, setSel] = useState<number | null>(null);
  const [state, setState] = useState<AState>('idle');
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const check = () => {
    if (sel === null) return;
    if (sel === step.a) { setState('ok'); buzz(15); } else { setState('bad'); setWrong(w => new Set(w).add(sel)); buzz([30, 50, 30]); }
  };
  return (
    <>
      <Md text={step.q} className="q" />
      {step.code && <Code code={step.code} />}
      <div className="opts">
        {step.opts.map((o, i) => (
          <button key={i} disabled={wrong.has(i) || state === 'ok'} className={`opt ${sel === i ? 'sel' : ''} ${state === 'ok' && i === step.a ? 'right' : ''} ${wrong.has(i) ? 'wrong' : ''} ${state === 'bad' && sel === i ? 'shake' : ''}`} onClick={() => { if (state === 'idle') { setSel(i); buzz(5); } }}>
            <span className="opt-k">{String.fromCharCode(65 + i)}</span><span className="opt-t">{/[;(){}=%]|\\n/.test(o) && o.length < 60 ? <code>{hlLine(o).map((t, j) => <span key={j} className={'t-' + t.c}>{t.t}</span>)}</code> : o}</span>
          </button>
        ))}
      </div>
      <ActionBar state={state} disabled={sel === null} onCheck={check} explain={step.why} onRetry={() => { setState('idle'); setSel(null); }} onContinue={() => done(wrong.size === 0)} />
    </>
  );
}

function FillStep({ step, done }: SP<'fill'>) {
  const blanks = useMemo(() => [...step.code.matchAll(/\[\[(.+?)\]\]/g)].map(m => m[1].split('|').map(s => s.trim())), [step]);
  const bank = useMemo(() => shuffle([...blanks.map(b => b[0]), ...(step.extra ?? [])].map((t, i) => ({ id: i, t }))), [blanks, step]);
  const [fill, setFill] = useState<(number | null)[]>(() => blanks.map(() => null));
  const [state, setState] = useState<AState>('idle');
  const [marks, setMarks] = useState<(boolean | null)[]>([]);
  const [tries, setTries] = useState(0);
  const used = new Set(fill.filter(x => x !== null) as number[]);
  const place = (id: number) => {
    if (state !== 'idle') return;
    setFill(cur => { if (cur.includes(id)) return cur; const k = cur.findIndex(x => x === null); if (k < 0) return cur; const f = [...cur]; f[k] = id; return f; });
    setMarks([]); buzz(5);
  };
  const clear = (k: number) => { if (state !== 'idle' || fill[k] === null) return; const f = [...fill]; f[k] = null; setFill(f); setMarks([]); };
  const norm = (s: string) => s.replace(/\s+/g, '');
  const check = () => {
    const m = fill.map((id, k) => id !== null && blanks[k].some(a => norm(a) === norm(bank.find(b => b.id === id)!.t)));
    setMarks(m); setTries(t => t + 1);
    if (m.every(Boolean)) { setState('ok'); buzz(15); } else { setState('bad'); buzz([30, 50, 30]); }
  };
  let bi = 0;
  const lines = step.code.replace(/\n$/, '').split('\n');
  return (
    <>
      <Md text={step.body} />
      <div className="code fillcode">
        {lines.map((l, i) => (
          <div className="row" key={i}><span className="gut">{i + 1}</span><span className="src">
            {l.split(/(\[\[.+?\]\])/).map((seg, j) => {
              if (/^\[\[/.test(seg)) {
                const k = bi++; const id = fill[k];
                return <button key={j} className={`blank ${id !== null ? 'filled' : ''} ${marks[k] === true ? 'right' : marks[k] === false ? 'wrong' : ''}`} onClick={() => clear(k)}>{id !== null ? bank.find(b => b.id === id)!.t : '   '}</button>;
              }
              return hlLine(seg).map((t, q) => <span key={j + '-' + q} className={'t-' + t.c}>{t.t}</span>);
            })}
          </span></div>
        ))}
      </div>
      <div className="bank">
        {bank.map(b => <button key={b.id} className={`tile ${used.has(b.id) ? 'used' : ''}`} disabled={used.has(b.id)} onClick={() => place(b.id)}>{b.t}</button>)}
      </div>
      <ActionBar state={state} disabled={fill.some(x => x === null)} onCheck={check} explain={state === 'ok' ? step.why : 'Red blanks are wrong — tap them to clear, then try again.' + (step.why && tries > 1 ? '\n\n' + step.why : '')}
        onRetry={() => { setState('idle'); setFill(f => f.map((x, k) => (marks[k] ? x : null))); setMarks([]); }} onContinue={() => done(tries <= 1)} />
    </>
  );
}

function indentOf(lines: string[]) {
  let d = 0;
  return lines.map(l => { if (/^\s*}/.test(l)) d = Math.max(0, d - 1); const r = d; if (/{\s*$/.test(l)) d++; return r; });
}
function OrderStep({ step, done }: SP<'order'>) {
  const given = step.given ?? 0;
  const items = useMemo(() => step.lines.map((t, i) => ({ id: i, t })), [step]);
  const [pool, setPool] = useState(() => { let s = shuffle(items.slice(given)); let n = 0; while (s.every((x, i) => x.id === given + i) && n++ < 5) s = shuffle(s); return s; });
  const [ans, setAns] = useState(() => items.slice(0, given));
  const [state, setState] = useState<AState>('idle');
  const [bad, setBad] = useState(-1);
  const [tries, setTries] = useState(0);
  const check = () => {
    setTries(t => t + 1);
    const k = ans.findIndex((a, i) => a.t.trim() !== step.lines[i].trim());
    if (k < 0) { setState('ok'); buzz(15); } else { setBad(k); setState('bad'); buzz([30, 50, 30]); }
  };
  const ind = indentOf(ans.map(a => a.t));
  return (
    <>
      <Md text={step.body} />
      <div className="order-ans code">
        {ans.map((a, i) => (
          <button key={a.id} className={`oline ${i < given ? 'fixed' : ''} ${i === bad ? 'wrong' : ''} ${state === 'ok' ? 'right' : ''}`} style={{ paddingLeft: 10 + ind[i] * 18 }} onClick={() => { if (i < given || state !== 'idle') return; setAns(cur => cur.filter(x => x.id !== a.id)); setPool(cur => (cur.some(x => x.id === a.id) ? cur : [...cur, a])); setBad(-1); }}>
            <span className="gut">{i + 1}</span>{hlLine(a.t).map((t, j) => <span key={j} className={'t-' + t.c}>{t.t}</span>)}
          </button>
        ))}
        {pool.length > 0 && <div className="oline ghost"><span className="gut">{ans.length + 1}</span>tap a line below…</div>}
      </div>
      <div className="order-pool">
        {pool.map(a => <button key={a.id} className="tile code-tile" onClick={() => { if (state !== 'idle') return; setPool(cur => cur.filter(x => x.id !== a.id)); setAns(cur => (cur.some(x => x.id === a.id) ? cur : [...cur, a])); setBad(-1); buzz(5); }}>{hlLine(a.t).map((t, j) => <span key={j} className={'t-' + t.c}>{t.t}</span>)}</button>)}
      </div>
      <ActionBar state={state} disabled={pool.length > 0} onCheck={check} explain={state === 'ok' ? step.why : `Line ${bad + 1} is out of place. Tap lines to send them back.`}
        onRetry={() => { setState('idle'); }} onContinue={() => done(tries <= 1)} />
    </>
  );
}

const catName = (c: string) => c.split('|')[0]; // "text|char *" → main label + small subtitle
function SortStep({ step, done }: SP<'sort'>) {
  const [k, setK] = useState(0);
  const kRef = useRef(0); // source of truth for fast double-taps
  const [wrong, setWrong] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const item = step.items[k];
  const finished = k >= step.items.length;
  const lockUntil = useRef(0); // ignore the 2nd tap of a double-tap while the next card slides in
  const pick = (c: number) => {
    const cur = kRef.current;
    if (cur >= step.items.length || performance.now() < lockUntil.current) return;
    if (c === step.items[cur].a) { kRef.current = cur + 1; lockUntil.current = performance.now() + 250; buzz(8); setWrong(null); setK(cur + 1); }
    else { buzz([30, 50, 30]); setWrong(c); setMisses(m => m + 1); }
  };
  return (
    <>
      <Md text={step.body} />
      <div className="sorter">
        <div className="sort-progress"><span style={{ width: `${(k / step.items.length) * 100}%` }} /><b>{k}/{step.items.length}</b></div>
        {!finished ? (
          <div key={`${k}-${misses}`} className={`sort-card ${wrong !== null ? 'shake' : ''}`}>
            <Md text={item.t} />
            {wrong !== null && <div className="sort-why">Not {catName(step.cats[wrong])}.{item.why ? ' ' + item.why : ' Try another box.'}</div>}
          </div>
        ) : (
          <div className="sort-card done"><Md text={misses === 0 ? '**Perfect sort!** Every value in the right box.' : `**All sorted** with ${misses} slip${misses > 1 ? 's' : ''}.`} /></div>
        )}
        <div className="sort-cats">
          {step.cats.map((c, i) => <button key={i} className={`sort-cat ${wrong === i ? 'wrong' : ''}`} disabled={finished} onClick={() => pick(i)}>{catName(c)}{c.includes('|') && <small>{c.split('|')[1]}</small>}</button>)}
        </div>
        {k > 0 && (
          <div className="sort-done">
            {step.items.slice(0, k).map((it, i) => <span key={i} className="sort-chip">{it.t.replace(/~/g, '')} <b>→ {catName(step.cats[it.a])}</b></span>)}
          </div>
        )}
      </div>
      <ActionBar state={finished ? 'ok' : 'idle'} disabled label="Sort every value first" onContinue={() => done(misses === 0)} title={misses === 0 ? 'Perfect sort!' : 'All sorted!'} />
    </>
  );
}

function ShapeStep({ step, done }: SP<'shape'>) {
  const [ok, setOk] = useState(false);
  return (
    <>
      <Md text={step.body} />
      <ShapeLab shape={step.shape} onComplete={() => { setOk(true); buzz(20); }} />
      <ActionBar state={ok ? 'ok' : 'idle'} disabled label="Count every face first" onContinue={() => done(true)} title="Face Method mastered" />
    </>
  );
}

export function CodeTask({ starter, tests, hints, solution, blueprint, paper, storeKey, onPass, onFail, body }: {
  starter: string; tests: any[]; hints: string[]; solution: string; blueprint?: boolean; paper?: boolean; storeKey: string;
  onPass: (meta: { hints: number; fails: number }) => void; onFail?: () => void; body?: React.ReactNode;
}) {
  const [code, setCode] = useState(() => { try { return localStorage.getItem('draft:' + storeKey) ?? starter; } catch { return starter; } });
  useEffect(() => { try { localStorage.setItem('draft:' + storeKey, code); } catch { /* */ } }, [code, storeKey]);
  const runner = useRunner();
  const api = useRef<EditorApi | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [cdiags, setCdiags] = useState<ReturnType<typeof compile> | null>(null);
  const [hintN, setHintN] = useState(0);
  const [fails, setFails] = useState(0);
  const [sol, setSol] = useState(false);
  const [state, setState] = useState<AState>('idle');
  const [busy, setBusy] = useState(false);
  const [showBp, setShowBp] = useState(true);
  const bp = useMemo(() => { if (!blueprint) return null; const c = compile(solution); return c.prog ? buildFlow(c.prog) : null; }, [blueprint, solution]);
  const marks = useMemo(() => (cdiags ?? runner.st.compiled)?.diags.map(d => ({ line: d.line, sev: d.sev })) ?? [], [cdiags, runner.st.compiled]);
  const check = () => {
    setBusy(true); setResults(null); setCdiags(null); runner.reset();
    setTimeout(() => {
      const g = gradeAll(code, tests);
      setBusy(false);
      if (!g.compiled.ok) { setCdiags(g.compiled); setFails(f => f + 1); setState('bad'); buzz([30, 50, 30]); onFail?.(); return; }
      setCdiags(g.compiled.diags.length ? g.compiled : null);
      setResults(g.results);
      if (g.pass) { setState('ok'); burst(); buzz([20, 40, 60]); onPass({ hints: hintN, fails }); }
      else { setFails(f => f + 1); setState('bad'); buzz([30, 50, 30]); onFail?.(); }
    }, 450);
  };
  const passed = results?.filter(r => r.ok).length ?? 0;
  return (
    <div className="codetask">
      {body}
      {bp && (
        <div className="card bp">
          <button className="card-h" onClick={() => setShowBp(s => !s)}><MapIcon size={15} /> Blueprint flowchart <span className="mut">{showBp ? 'hide' : 'show'}</span></button>
          {showBp && <Flowchart flow={bp} maxH="48vh" />}
        </div>
      )}
      <div className={`card ed ${paper ? 'paper' : ''}`}>
        <div className="tabs"><span className="tab on">{paper ? 'answer_sheet.c' : 'main.c'}</span>{paper && <span className="paper-tag">PAPER MODE</span>}</div>
        <Editor value={code} onChange={setCode} marks={paper && state === 'idle' ? [] : marks} plain={paper} apiRef={api} minH={paper ? 300 : 220} />
        <KeyBar api={api} />
      </div>
      <div className="btnrow">
        {!paper && <button className="btn" onClick={() => { setResults(null); setCdiags(null); runner.start(code); }}><Play size={15} /> Run</button>}
        <button className="btn" disabled={hintN >= hints.length} onClick={() => setHintN(h => h + 1)}><Lightbulb size={15} /> Hint {hintN < hints.length ? `(${hints.length - hintN})` : ''}</button>
        {(fails >= 2 || hintN >= hints.length) && <button className="btn" onClick={() => setSol(s => !s)}><Eye size={15} /> {sol ? 'Hide' : 'Show'} solution</button>}
        <button className="btn" onClick={() => { if (confirm('Reset your code to the starter?')) { setCode(starter); api.current?.set(starter); } }}>Reset</button>
      </div>
      {hintN > 0 && <div className="hints">{hints.slice(0, hintN).map((h, i) => <div key={i} className="tip"><b>Hint {i + 1}:</b> <code className="pre">{h}</code></div>)}</div>}
      {sol && <div className="card"><div className="card-h">Reference solution</div><Code code={solution} /><button className="btn small" onClick={() => { setCode(solution); api.current?.set(solution); }}>Load into editor</button></div>}
      <Console st={runner.st} onSubmit={runner.submit} onLine={l => api.current?.goto(l)} />
      {cdiags && <div className="console"><div className="console-b"><div className="cmd">$ gcc main.c -o main</div><DiagList diags={cdiags.diags} src={cdiags.src} onLine={l => api.current?.goto(l)} />{!cdiags.ok && <div className="sys bad">✗ Does not compile — fix the error{cdiags.diags.filter(d => d.sev === 'error').length > 1 ? 's' : ''} above.</div>}</div></div>}
      {busy && <div className="testing"><span className="spin">⠋</span> running {tests.length} hidden tests…</div>}
      {results && (
        <div className="results">
          <div className="res-bar"><span style={{ width: `${(passed / results.length) * 100}%` }} /><b>{Math.round((passed / results.length) * 100)}%</b></div>
          {results.map((r, i) => (
            <details key={i} className={`res ${r.ok ? 'ok' : 'bad'}`} open={!r.ok && results.findIndex(x => !x.ok) === i}>
              <summary>{r.ok ? '✓' : '✗'} Test {i + 1} <span className="mut">input: {r.input.trim().replace(/\n/g, ' ⏎ ') || '(none)'}</span></summary>
              {!r.ok && <div className="res-why">{r.why}</div>}
              <div className="res-io"><div><span className="lbl">expected</span><pre>{r.expect}</pre></div><div><span className="lbl">your output</span><pre>{r.output || '(nothing printed)'}</pre></div></div>
            </details>
          ))}
        </div>
      )}
      <ActionBar state={state} disabled={busy} label={paper ? 'Submit answer' : 'Check'} onCheck={check}
        explain={state === 'ok' ? `All ${tests.length} tests passed${hintN ? ` (${hintN} hint${hintN > 1 ? 's' : ''})` : ''}.` : cdiags && !cdiags.ok ? 'Compilation failed — read the first error above.' : 'Some tests failed. Open the red test to compare outputs.'}
        onRetry={() => setState('idle')} onContinue={() => onPass({ hints: hintN, fails: -1 })} />
    </div>
  );
}

function CodeStep({ step, done, sk }: SP<'code'> & { sk: string }) {
  const passed = useRef(false);
  return (
    <CodeTask starter={step.starter} tests={step.tests} hints={step.hints} solution={step.solution} blueprint={step.blueprint} paper={step.paper} storeKey={sk}
      body={<Md text={step.body} />}
      onPass={m => { if (m.fails === -1) done(true); else passed.current = true; }} />
  );
}

function StepView({ step, done, sk }: { step: Step; done: (ft?: boolean) => void; sk: string }) {
  switch (step.t) {
    case 'read': return <ReadStep step={step} done={done} />;
    case 'link': return <LinkStep step={step} done={done} />;
    case 'trace': return <TraceStep step={step} done={done} />;
    case 'quiz': return <QuizStep step={step} done={done} />;
    case 'fill': return <FillStep step={step} done={done} />;
    case 'order': return <OrderStep step={step} done={done} />;
    case 'shape': return <ShapeStep step={step} done={done} />;
    case 'sort': return <SortStep step={step} done={done} />;
    case 'code': return <CodeStep step={step} done={done} sk={sk} />;
  }
}

const KIND: Record<Step['t'], string> = { read: 'concept', link: 'explore', trace: 'watch it run', quiz: 'quiz', fill: 'fill the blanks', order: 'arrange', sort: 'sort it', shape: 'shape lab', code: 'code it' };

export function LessonPlayer({ id }: { id: string }) {
  const lesson = LESSONS.find(l => l.id === id) as Lesson | undefined;
  const [i, setI] = useState(() => { const s = getProgress().lessons[id]; return s && !s.done ? Math.min(s.step, (lesson?.steps.length ?? 1) - 1) : 0; });
  const [gained, setGained] = useState(0);
  const [finished, setFinished] = useState(false);
  useEffect(() => { if (lesson && getProgress().lastLesson !== id) update(p => { p.lastLesson = id; }); }, [id, lesson]);
  if (!lesson) return <div className="page"><p>Lesson not found.</p><button className="btn" onClick={() => go('/learn')}>Back</button></div>;
  const step = lesson.steps[i];
  const next = (firstTry = true) => {
    const xp = Math.round(XP[step.t] * (firstTry ? 1 : 0.5));
    setGained(g => g + xp); addXp(xp);
    if (i + 1 >= lesson.steps.length) {
      update(p => { p.lessons[id] = { done: true, step: lesson.steps.length }; });
      setFinished(true); burst(1.6); buzz([30, 60, 90]);
    } else {
      update(p => { p.lessons[id] = { done: p.lessons[id]?.done ?? false, step: i + 1 }; });
      setI(i + 1); window.scrollTo({ top: 0 });
    }
  };
  const li = LESSONS.indexOf(lesson);
  const nextLesson = LESSONS[li + 1];
  return (
    <div className="player">
      <header className="pl-top">
        <button className="ic-btn" onClick={() => go('/learn')} aria-label="Close lesson"><X size={20} /></button>
        <div className="pbar">{lesson.steps.map((_, k) => <span key={k} className={k < i || finished ? 'done' : k === i ? 'cur' : ''} />)}</div>
        <span className="xp-pill">+{gained} XP</span>
      </header>
      {finished ? (
        <motion.div className="finish" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}>
          <div className="finish-ic"><CheckCheck size={44} /></div>
          <div className="t-com">// return 0;</div>
          <h2>Lesson complete!</h2>
          <p className="mut">{lesson.title}</p>
          <div className="finish-xp">+{gained} XP</div>
          <div className="finish-btns">
            {nextLesson && <button className="btn primary big" onClick={() => go('/learn/' + nextLesson.id)}>Next: {nextLesson.title} →</button>}
            <button className="btn big" onClick={() => go('/learn')}>Course map</button>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={i} className="step" initial={{ x: 36, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -36, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
            <div className="step-kind"><span className={`kind k-${step.t}`}>{KIND[step.t]}</span><span className="mut">{lesson.title} · {i + 1}/{lesson.steps.length}</span></div>
            <h2 className="step-title">{step.title}</h2>
            <StepView step={step} done={next} sk={`${id}-${i}`} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
