import type React from 'react';
import { useEffect, useRef, useState, Fragment } from 'react';
import { compile, run, Compiled, RunResult } from '../engine/interp';
import type { Diag } from '../engine/lexer';

export interface RunState {
  phase: 'idle' | 'compiling' | 'running' | 'waiting' | 'done';
  compiled?: Compiled; result?: RunResult; echoes: { at: number; text: string }[]; stdin: string;
}

export function useRunner() {
  const [st, setSt] = useState<RunState>({ phase: 'idle', echoes: [], stdin: '' });
  const ref = useRef(st); ref.current = st;
  const exec = (compiled: Compiled, stdin: string, echoes: RunState['echoes']) => {
    const result = run(compiled, { stdin, interactive: true, trace: true, traceLimit: 2500 });
    setSt({ phase: result.status === 'needInput' ? 'waiting' : 'done', compiled, result, echoes, stdin });
    return result;
  };
  return {
    st,
    start(code: string, onDone?: (c: Compiled) => void) {
      setSt({ phase: 'compiling', echoes: [], stdin: '' });
      setTimeout(() => {
        const c = compile(code);
        if (!c.ok) { setSt({ phase: 'done', compiled: c, echoes: [], stdin: '' }); onDone?.(c); return; }
        exec(c, '', []); onDone?.(c);
      }, 380);
    },
    submit(text: string) {
      const s = ref.current; if (!s.compiled || !s.result) return;
      exec(s.compiled, s.stdin + text + '\n', [...s.echoes, { at: s.result.output.length, text }]);
    },
    stop() { setSt(s => ({ ...s, phase: 'done' })); },
    reset() { setSt({ phase: 'idle', echoes: [], stdin: '' }); },
  };
}

export function DiagList({ diags, src, onLine }: { diags: Diag[]; src: string; onLine?: (l: number) => void }) {
  const lines = src.split('\n');
  return (
    <div className="diags">
      {diags.map((d, i) => (
        <div key={i} className={`diag ${d.sev}`} onClick={() => onLine?.(d.line)}>
          <div className="diag-h"><span className={`sev ${d.sev}`}>{d.sev}</span><span className="loc">main.c:{d.line}</span></div>
          <div className="diag-m">{d.msg}</div>
          {lines[d.line - 1] !== undefined && d.line > 0 && (
            <pre className="diag-src"><span className="gut">{d.line} |</span> {lines[d.line - 1].replace(/^\s+/, '')}</pre>
          )}
          {d.hint && <div className="diag-hint">💡 {d.hint}</div>}
        </div>
      ))}
    </div>
  );
}

export function Output({ text, echoes = [] }: { text: string; echoes?: { at: number; text: string }[] }) {
  const parts: React.ReactElement[] = []; let last = 0;
  echoes.forEach((e, i) => {
    parts.push(<Fragment key={'o' + i}>{text.slice(last, e.at)}</Fragment>);
    parts.push(<span key={'e' + i} className="echo">{e.text}{'\n'}</span>);
    last = e.at;
  });
  parts.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

export function Console({ st, onSubmit, onLine, title = 'TERMINAL' }: { st: RunState; onSubmit: (s: string) => void; onLine?: (l: number) => void; title?: string }) {
  const [val, setVal] = useState('');
  const inp = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (st.phase === 'waiting') { inp.current?.focus({ preventScroll: true }); } }, [st.phase, st.result]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [st]);
  if (st.phase === 'idle') return null;
  const c = st.compiled, r = st.result;
  const warns = c?.diags.filter(d => d.sev !== 'error') ?? [];
  const errs = c?.diags.filter(d => d.sev === 'error') ?? [];
  return (
    <div className="console">
      <div className="console-h"><span className="dot r" /><span className="dot y" /><span className="dot g" /><span className="console-t">{title}</span></div>
      <div className="console-b" ref={box}>
        <div className="cmd">$ gcc main.c -o main{st.phase === 'compiling' && <span className="spin"> ⠋ compiling</span>}</div>
        {c && errs.length > 0 && <>
          <DiagList diags={errs} src={c.src} onLine={onLine} />
          <div className="sys bad">✗ Compilation failed: {errs.length} error{errs.length > 1 ? 's' : ''}. Fix {errs.length > 1 ? 'the first one' : 'it'} and run again.</div>
        </>}
        {c && warns.length > 0 && <DiagList diags={warns} src={c.src} onLine={onLine} />}
        {r && <>
          <div className="cmd">$ ./main</div>
          <pre className="out"><Output text={r.output} echoes={st.echoes} />{st.phase === 'waiting' && (
            <form className="stdin" onSubmit={e => { e.preventDefault(); onSubmit(val); setVal(''); }}>
              <input ref={inp} value={val} onChange={e => setVal(e.target.value)} inputMode="decimal" autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="send" aria-label="Program input" placeholder="type input, press ↵" />
              <button type="submit" className="btn small">↵</button>
            </form>
          )}</pre>
          {r.rdiags.length > 0 && <DiagList diags={r.rdiags} src={c!.src} onLine={onLine} />}
          {r.status === 'ok' && <div className="sys">Process exited with code {r.exitCode} · {r.steps.toLocaleString()} steps</div>}
          {(r.status === 'error' || r.status === 'timeout' || r.status === 'inputEnd') && r.error && (
            <div className="rt-err" onClick={() => onLine?.(r.error!.line)}>
              <div className="rt-t">💥 {r.error.msg}{r.error.line ? <span className="loc"> · line {r.error.line}</span> : null}</div>
              {r.error.hint && <div className="diag-hint">💡 {r.error.hint}</div>}
            </div>
          )}
        </>}
      </div>
    </div>
  );
}
