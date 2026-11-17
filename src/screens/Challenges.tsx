import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, X } from 'lucide-react';
import { CHALLENGES, DIFFS } from '../content/challenges';
import { STARTER } from '../content/types';
import { go } from '../lib/router';
import { addXp, update, useProgress } from '../lib/store';
import { CodeTask } from './Learn';
import { Md, burst } from '../components/ui';

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return <span className="stars">{[0, 1, 2].map(i => <Star key={i} size={size} className={i < n ? 'on' : ''} fill={i < n ? 'currentColor' : 'none'} />)}</span>;
}

export function LevelSelect() {
  const p = useProgress();
  const [diff, setDiff] = useState<string>(() => { try { return localStorage.getItem('chero-diff') || 'easy'; } catch { return 'easy'; } });
  const [page, setPage] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => { try { localStorage.setItem('chero-diff', diff); } catch { /* */ } strip.current?.scrollTo({ left: 0 }); setPage(0); }, [diff]);
  const levels = CHALLENGES.filter(c => c.diff === diff);
  const D = DIFFS.find(d => d.id === diff)!;
  const onScroll = () => { const el = strip.current; if (!el) return; setPage(Math.round(el.scrollLeft / (el.clientWidth * 0.84))); };
  const scrollTo = (k: number) => { const el = strip.current; if (!el) return; const card = el.children[k] as HTMLElement; card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); };
  return (
    <div className="page levels" style={{ ['--dc' as any]: D.color }}>
      <header className="page-h"><h2>Challenges</h2><p className="mut">30 levels of general C fluency. Earn up to 3 stars each.</p></header>
      <div className="diffs">
        {DIFFS.map(d => {
          const ls = CHALLENGES.filter(c => c.diff === d.id);
          const solved = ls.filter(c => p.challenges[c.id]?.solved).length;
          const st = ls.reduce((a, c) => a + (p.challenges[c.id]?.stars ?? 0), 0);
          return (
            <button key={d.id} className={`diff ${diff === d.id ? 'on' : ''}`} style={{ ['--dc' as any]: d.color }} onClick={() => setDiff(d.id)}>
              <span className="face">{d.face}</span><b>{d.label}</b><span className="mut">{solved}/10 · {st}★</span>
            </button>
          );
        })}
      </div>
      <p className="mut blurb">{D.blurb}</p>
      <div className="strip" ref={strip} onScroll={onScroll}>
        {levels.map((c, k) => {
          const s = p.challenges[c.id];
          return (
            <motion.div key={c.id} className={`lvl ${s?.solved ? 'solved' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.03 }}>
              <div className="lvl-top"><span className="lvl-n">LEVEL {c.n}</span><Stars n={s?.stars ?? 0} /></div>
              <div className="lvl-face">{D.face}</div>
              <h3>{c.title}</h3>
              <p className="lvl-story">{c.story}</p>
              <div className="tags">{c.tags.map(t => <span key={t} className={`tag ${t === 'workbook' || t.startsWith('Problem') ? 'gold' : ''}`}>{t}</span>)}</div>
              <div className="lvl-bar"><span style={{ width: `${s?.best ?? 0}%` }} /><em>{s?.best ?? 0}%</em></div>
              <button className="btn primary big" onClick={() => go('/challenges/' + c.id)}>{s?.solved ? 'Replay' : 'Play'} ▶</button>
            </motion.div>
          );
        })}
      </div>
      <div className="pager">
        <button className="ic-btn" onClick={() => scrollTo(Math.max(0, page - 1))} aria-label="Previous level"><ChevronLeft /></button>
        {levels.map((c, k) => <button key={c.id} className={`pdot ${k === page ? 'on' : ''} ${p.challenges[c.id]?.solved ? 'ok' : ''}`} onClick={() => scrollTo(k)} aria-label={`Level ${k + 1}`}>{k + 1}</button>)}
        <button className="ic-btn" onClick={() => scrollTo(Math.min(levels.length - 1, page + 1))} aria-label="Next level"><ChevronRight /></button>
      </div>
    </div>
  );
}

export function ChallengePlay({ id }: { id: string }) {
  const c = CHALLENGES.find(x => x.id === id);
  const p = useProgress();
  const [win, setWin] = useState<{ stars: number; xp: number } | null>(null);
  const [attempt, setAttempt] = useState(1);
  if (!c) return <div className="page"><p>Level not found.</p></div>;
  const D = DIFFS.find(d => d.id === c.diff)!;
  const same = CHALLENGES.filter(x => x.diff === c.diff);
  const next = same[same.indexOf(c) + 1];
  const prev = p.challenges[c.id];
  return (
    <div className="player chal" style={{ ['--dc' as any]: D.color }}>
      <header className="pl-top">
        <button className="ic-btn" onClick={() => go('/challenges')} aria-label="Back to levels"><X size={20} /></button>
        <div className="chal-h"><span className="lvl-n">{D.label.toUpperCase()} · {c.n}</span><b>{c.title}</b></div>
        <span className="attempt">attempt {attempt}</span>
      </header>
      <div className="step">
        <CodeTask
          starter={STARTER} tests={c.tests} hints={c.hints} solution={c.solution} storeKey={'ch-' + c.id}
          body={
            <div className="problem">
              <p className="story">“{c.story}”</p>
              <Md text={c.io} />
              <div className="sample"><div><span className="lbl">sample input</span><pre>{c.sample.in}</pre></div><div><span className="lbl">sample output</span><pre>{c.sample.out}</pre></div></div>
              <p className="mut small">Prompts like "Enter N:" are fine — the grader looks for the answer values in your output.</p>
            </div>
          }
          onFail={() => setAttempt(a => a + 1)}
          onPass={m => {
            if (m.fails === -1) { if (next) go('/challenges/' + next.id); else go('/challenges'); return; }
            const stars = 1 + (m.hints === 0 ? 1 : 0) + (m.fails <= 1 ? 1 : 0);
            const xp = { easy: 20, medium: 35, hard: 50 }[c.diff] * (prev?.solved ? 0.3 : 1);
            update(q => {
              const o = q.challenges[c.id];
              q.challenges[c.id] = { solved: true, stars: Math.max(stars, o?.stars ?? 0), hints: m.hints, fails: m.fails, best: 100 };
            });
            addXp(Math.round(xp));
            setTimeout(() => { setWin({ stars, xp: Math.round(xp) }); burst(2); }, 500);
          }}
        />
      </div>
      {win && (
        <div className="win-wrap" onClick={() => setWin(null)}>
          <motion.div className="win" initial={{ scale: 0.6, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} onClick={e => e.stopPropagation()}>
            <div className="win-t">LEVEL COMPLETE!</div>
            <div className="win-stars">{[0, 1, 2].map(i => (
              <motion.span key={i} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.25 + i * 0.22, type: 'spring', stiffness: 300, damping: 12 }}>
                <Star size={46} className={i < win.stars ? 'on' : ''} fill={i < win.stars ? 'currentColor' : 'none'} />
              </motion.span>
            ))}</div>
            <ul className="win-crit">
              <li className="on">★ solved</li>
              <li className={win.stars >= 2 || (win.stars === 2) ? '' : ''}>{'★ no hints'}</li>
              <li>{'★ ≤ 1 failed check'}</li>
            </ul>
            <div className="finish-xp">+{win.xp} XP · attempt {attempt}</div>
            <div className="finish-btns">
              {next && <button className="btn primary big" onClick={() => go('/challenges/' + next.id)}>Next level →</button>}
              <button className="btn big" onClick={() => go('/challenges')}>All levels</button>
              <button className="btn" onClick={() => setWin(null)}>Stay here</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
