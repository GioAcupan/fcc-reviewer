import { useEffect, useRef, useState } from 'react';
import { EditorState, StateEffect, StateField, RangeSetBuilder, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, Decoration, DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { syntaxHighlighting, HighlightStyle, indentOnInput, bracketMatching } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { tags as t } from '@lezer/highlight';

const style = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword], color: 'var(--kw)' },
  { tag: [t.typeName, t.standard(t.typeName)], color: 'var(--ty)' },
  { tag: [t.string, t.special(t.string), t.character], color: 'var(--str)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--num)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--com)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--fn)' },
  { tag: [t.processingInstruction, t.meta, t.macroName], color: 'var(--pre)' },
  { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--op)' },
  { tag: [t.escape], color: 'var(--num)' },
]);

const setMarks = StateEffect.define<{ line: number; sev: string }[]>();
const marks = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) if (e.is(setMarks)) {
      const b = new RangeSetBuilder<Decoration>();
      const seen = new Map<number, string>();
      for (const m of e.value) if (!seen.has(m.line) || m.sev === 'error') seen.set(m.line, m.sev);
      for (const [line, sev] of [...seen.entries()].sort((a, b) => a[0] - b[0])) {
        if (line < 1 || line > tr.state.doc.lines) continue;
        const l = tr.state.doc.line(line);
        b.add(l.from, l.from, Decoration.line({ class: 'cm-mark-' + sev }));
      }
      deco = b.finish();
    }
    return deco;
  },
  provide: f => EditorView.decorations.from(f),
});

const theme = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--fg)', fontSize: '13.5px' },
  '.cm-content': { fontFamily: 'var(--mono)', caretColor: 'var(--acc)', padding: '10px 0' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--mut)', border: 'none', fontFamily: 'var(--mono)' },
  '.cm-activeLine': { backgroundColor: 'rgba(124,242,197,0.06)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--acc)' },
  '.cm-cursor': { borderLeftColor: 'var(--acc)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(107,223,255,0.25) !important' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(255,184,107,0.2)', outline: '1px solid rgba(255,184,107,0.5)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' },
}, { dark: true });

export interface EditorApi { insert: (text: string, back?: number) => void; goto: (line: number) => void; focus: () => void; set: (code: string) => void }

export function Editor({ value, onChange, marks: mk, plain, apiRef, minH = 220, ariaLabel = 'C code editor' }: {
  value: string; onChange: (s: string) => void; marks?: { line: number; sev: string }[]; plain?: boolean;
  apiRef?: React.MutableRefObject<EditorApi | null>; minH?: number; ariaLabel?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(onChange); cb.current = onChange;
  const lang = useRef(new Compartment());
  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), history(), drawSelection(), indentOnInput(), bracketMatching(), highlightActiveLine(),
          lang.current.of(plain ? [] : [closeBrackets(), cpp(), syntaxHighlighting(style)]),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.lineWrapping, theme, marks,
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
          EditorView.updateListener.of(u => { if (u.docChanged) cb.current(u.state.doc.toString()); }),
        ],
      }),
    });
    view.current = v;
    if (apiRef) apiRef.current = {
      insert(text, back = 0) {
        const { from, to } = v.state.selection.main;
        v.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length - back }, scrollIntoView: true });
        v.focus();
      },
      goto(line) {
        const l = v.state.doc.line(Math.max(1, Math.min(line, v.state.doc.lines)));
        v.dispatch({ selection: { anchor: l.to }, scrollIntoView: true }); v.focus();
      },
      focus() { v.focus(); },
      set(code) { v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: code } }); },
    };
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const v = view.current; if (!v) return;
    if (value !== v.state.doc.toString()) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);
  useEffect(() => { view.current?.dispatch({ effects: setMarks.of(mk ?? []) }); }, [mk]);
  useEffect(() => { view.current?.dispatch({ effects: lang.current.reconfigure(plain ? [] : [closeBrackets(), cpp(), syntaxHighlighting(style)]) }); }, [plain]);
  return <div className={`editor ${plain ? 'plain' : ''}`} ref={host} style={{ minHeight: minH }} />;
}

const SYM: [string, string, number?][] = [
  ['⇥', '    '], [';', ';'], ['{', '{'], ['}', '}'], ['(', '('], [')', ')'], ['"', '"'], ['%d', '%d'], ['%lf', '%lf'], ['%.2f', '%.2f'],
  ['\\n', '\\n'], ['&', '&'], ['=', ' = '], ['==', ' == '], ['!=', ' != '], ['<', ' < '], ['<=', ' <= '], ['>', ' > '], ['>=', ' >= '],
  ['&&', ' && '], ['||', ' || '], ['%', ' % '], ['+', ' + '], ['-', ' - '], ['*', ' * '], ['/', ' / '], ['++', '++'], ['[', '['], [']', ']'],
  [',', ', '], ["'", "'"], ['#', '#'], ['!', '!'],
];
const SNIP: [string, string, number][] = [
  ['printf', 'printf("\\n");', 5], ['scanf', 'scanf("%d", &);', 2], ['if', 'if () {\n    \n}', 10], ['else', ' else {\n    \n}', 2],
  ['for', 'for (i = 1; i <= n; i++) {\n    \n}', 2], ['while', 'while () {\n    \n}', 10], ['do-while', 'do {\n    \n} while ();', 2],
  ['int', 'int ', 0], ['double', 'double ', 0], ['main', '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n', 17], ['math.h', '#include <math.h>\n', 0], ['return 0;', 'return 0;', 0],
];

export function KeyBar({ api }: { api: React.MutableRefObject<EditorApi | null> }) {
  const [snip, setSnip] = useState(false);
  const keep = (e: React.PointerEvent | React.MouseEvent) => e.preventDefault();
  const cmd = (f: (v: EditorView) => void) => () => { const el = document.querySelector('.editor .cm-editor') as any; const v = el && EditorView.findFromDOM(el); if (v) { f(v); v.focus(); } };
  return (
    <div className="keybar" onPointerDown={keep} onMouseDown={keep}>
      <button className={`kb-toggle ${snip ? 'on' : ''}`} onClick={() => setSnip(s => !s)} aria-label="Toggle snippets">{snip ? '{ }' : '⚡'}</button>
      <div className="kb-scroll">
        {!snip && <>
          <button className="kb" onClick={cmd(v => { const p = v.state.selection.main.head; v.dispatch({ selection: { anchor: Math.max(0, p - 1) } }); })} aria-label="Cursor left">←</button>
          <button className="kb" onClick={cmd(v => { const p = v.state.selection.main.head; v.dispatch({ selection: { anchor: Math.min(v.state.doc.length, p + 1) } }); })} aria-label="Cursor right">→</button>
        </>}
        {(snip ? SNIP : SYM).map(([label, text, back]) => (
          <button key={label} className={`kb ${snip ? 'snip' : ''}`} onClick={() => api.current?.insert(text, back ?? 0)}>{label}</button>
        ))}
        <button className="kb" onClick={cmd(v => { undo(v); })} aria-label="Undo">↶</button>
        <button className="kb" onClick={cmd(v => { redo(v); })} aria-label="Redo">↷</button>
      </div>
    </div>
  );
}
