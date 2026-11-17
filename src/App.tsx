import type React from 'react';
import { useEffect, useState } from 'react';
import { BookOpen, Code2, Home as HomeIcon, Swords, Terminal } from 'lucide-react';
import { useRoute, go } from './lib/router';
import { useProgress } from './lib/store';
import { LESSONS } from './content/lessons';
import { CHALLENGES } from './content/challenges';
import { CourseMap, LessonPlayer } from './screens/Learn';
import { LevelSelect, ChallengePlay } from './screens/Challenges';
import { Reference } from './screens/Reference';
import { Playground } from './screens/Playground';
import { Ring } from './components/ui';
import { hlLine } from './lib/highlight';

const HERO = [
  '// made by Gio',
  '#include <stdio.h>',
  '',
  'int main() {',
  '    int you = 0;',
  '    while (you < 100) {',
  '        you = you + 1;   // level up',
  '    }',
  '    printf("Exam? EZ.\\n");',
  '    return 0;',
  '}',
];

function Typer() {
  const full = HERO.join('\n');
  const [n, setN] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(full.length); return; }
    let i = 0;
    const id = setInterval(() => { i += 2; setN(i); if (i >= full.length) clearInterval(id); }, 28);
    return () => clearInterval(id);
  }, [full.length]);
  const shown = full.slice(0, n).split('\n');
  const done = n >= full.length;
  return (
    <div className="hero-code">
      <div className="tabs"><span className="tab on">main.c</span><span className="tab">finals.c</span></div>
      <div className="code compact">
        {shown.map((l, i) => (
          <div className="row" key={i}><span className="gut">{i + 1}</span><span className="src">{hlLine(l).map((t, j) => <span key={j} className={'t-' + t.c}>{t.t}</span>)}{i === shown.length - 1 && <span className="caret">▌</span>}</span></div>
        ))}
      </div>
      <div className={`hero-out ${done ? 'show' : ''}`}><span className="mut">$ ./main</span><br />Exam? EZ.</div>
    </div>
  );
}

function Home() {
  const p = useProgress();
  const done = LESSONS.filter(l => p.lessons[l.id]?.done).length;
  const next = LESSONS.find(l => !p.lessons[l.id]?.done) ?? LESSONS[LESSONS.length - 1];
  const stars = Object.values(p.challenges).reduce((a, c) => a + (c.stars || 0), 0);
  const solved = Object.values(p.challenges).filter(c => c.solved).length;
  const modes = [
    { fn: 'learn', to: '/learn', c: 'var(--acc)', d: `${LESSONS.length} lessons · flowchart → C → exam`, k: '// zero to hero' },
    { fn: 'challenge', to: '/challenges', c: 'var(--num)', d: `${CHALLENGES.length} levels · easy → hard`, k: '// get fluent' },
    { fn: 'reference', to: '/ref', c: 'var(--str)', d: 'cheat sheet + flashcards', k: '// look it up' },
    { fn: 'playground', to: '/play', c: 'var(--fn)', d: 'write & visualize any C', k: '// free code' },
  ];
  return (
    <div className="home page">
      <div className="brand"><span className="logo">C</span><div><h1>C Hero</h1><p>FCC finals reviewer · zero → hero</p></div></div>
      <Typer />
      <div className="stats">
        <div className="stat"><Ring value={done / LESSONS.length} size={46}><b>{done}</b></Ring><span>lessons</span></div>
        <div className="stat"><div className="big">{p.xp}</div><span>XP</span></div>
        <div className="stat"><div className="big">{p.streak.count}<small>🔥</small></div><span>day streak</span></div>
        <div className="stat"><div className="big">{stars}<small>★</small></div><span>{solved}/{CHALLENGES.length} levels</span></div>
      </div>
      <button className="continue" onClick={() => go('/learn/' + next.id)}>
        <span className="mut">{done === 0 ? 'start here →' : done === LESSONS.length ? 'review →' : 'continue →'}</span>
        <b>{next.title}</b>
        <span className="sub">{next.sub}</span>
        <span className="cont-bar"><span style={{ width: `${((p.lessons[next.id]?.step ?? 0) / next.steps.length) * 100}%` }} /></span>
      </button>
      <div className="modes">
        {modes.map((m, i) => (
          <button key={m.fn} className="mode" style={{ ['--mc' as any]: m.c, animationDelay: `${i * 70}ms` }} onClick={() => go(m.to)}>
            <span className="ln">{4 + i}</span>
            <span className="mode-fn"><span className="t-fn">{m.fn}</span><span className="t-op">();</span> <span className="t-com">{m.k}</span></span>
            <span className="mode-d">{m.d}</span>
          </button>
        ))}
      </div>
      <p className="foot mut">Made for the FCC batch · works offline once loaded · add to home screen</p>
    </div>
  );
}

const NAV = [
  { to: '/', label: 'main.c', icon: HomeIcon, m: (r: string) => r === '/' },
  { to: '/learn', label: 'learn', icon: BookOpen, m: (r: string) => r.startsWith('/learn') },
  { to: '/challenges', label: 'levels', icon: Swords, m: (r: string) => r.startsWith('/challenges') },
  { to: '/ref', label: 'ref', icon: Code2, m: (r: string) => r.startsWith('/ref') },
  { to: '/play', label: 'play', icon: Terminal, m: (r: string) => r.startsWith('/play') },
];

export function App() {
  const r = useRoute();
  const parts = r.split('/').filter(Boolean);
  let view: React.ReactElement; let focus = false;
  if (parts[0] === 'learn' && parts[1]) { view = <LessonPlayer key={parts[1]} id={parts[1]} />; focus = true; }
  else if (parts[0] === 'learn') view = <CourseMap />;
  else if (parts[0] === 'challenges' && parts[1]) { view = <ChallengePlay key={parts[1]} id={parts[1]} />; focus = true; }
  else if (parts[0] === 'challenges') view = <LevelSelect />;
  else if (parts[0] === 'ref') view = <Reference tab={parts[1] === 'cards' ? 'cards' : 'sheet'} />;
  else if (parts[0] === 'play') view = <Playground />;
  else view = <Home />;
  return (
    <div className={`app ${focus ? 'focus' : ''}`}>
      <main className="view" key={parts[0] ?? 'home'}>{view}</main>
      {!focus && (
        <nav className="dock" aria-label="Main">
          {NAV.map(n => {
            const on = n.m(r); const I = n.icon;
            return <button key={n.to} className={on ? 'on' : ''} onClick={() => go(n.to)} aria-current={on ? 'page' : undefined}><I size={19} strokeWidth={on ? 2.4 : 1.8} /><span>{n.label}</span></button>;
          })}
        </nav>
      )}
    </div>
  );
}
