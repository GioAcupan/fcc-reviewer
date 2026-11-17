import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, RotateCcw } from 'lucide-react';
import { SHEETS, CARDS } from '../content/reference';
import { Code, Md, buzz, burst } from '../components/ui';
import { go } from '../lib/router';
import { update, useProgress, CardState } from '../lib/store';

function Sheet() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>('skeleton');
  const list = SHEETS.filter(s => !q || (s.title + s.body + (s.code ?? '')).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <label className="search"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="search: scanf, %lf, frustum, mod…" aria-label="Search the cheat sheet" /></label>
      <div className="sheets">
        {list.map(s => {
          const on = open === s.id || !!q;
          return (
            <section key={s.id} className={`sheet ${on ? 'on' : ''}`}>
              <button className="sheet-h" onClick={() => setOpen(open === s.id ? null : s.id)}><span className="sheet-ic">{s.icon}</span><b>{s.title}</b><span className="chev">{on ? '−' : '+'}</span></button>
              {on && <div className="sheet-b">{s.code && <Code code={s.code} compact />}<Md text={s.body} /></div>}
            </section>
          );
        })}
        {!list.length && <p className="mut">Nothing matches “{q}”.</p>}
      </div>
    </>
  );
}

const MIN = 60_000, DAY = 86_400_000;
function schedule(c: CardState | undefined, grade: 0 | 1 | 2 | 3): CardState {
  const s = c ?? { due: 0, ivl: 0, ease: 2.5, reps: 0 };
  let { ivl, ease } = s;
  if (grade === 0) { ivl = 0; ease = Math.max(1.3, ease - 0.2); return { due: Date.now() + MIN, ivl, ease, reps: s.reps + 1 }; }
  if (grade === 1) { ivl = ivl ? ivl * 1.2 : 0.007; ease = Math.max(1.3, ease - 0.15); }
  if (grade === 2) ivl = ivl ? ivl * ease : 0.5;
  if (grade === 3) { ivl = ivl ? ivl * ease * 1.3 : 2; ease += 0.15; }
  return { due: Date.now() + ivl * DAY, ivl, ease, reps: s.reps + 1 };
}
const fmtIvl = (d: number) => (d < 0.01 ? '10m' : d < 1 ? `${Math.round(d * 24)}h` : `${Math.round(d)}d`);

function Cards() {
  const p = useProgress();
  const [flip, setFlip] = useState(false);
  const [ahead, setAhead] = useState(false);
  const [done, setDone] = useState(0);
  const now = Date.now();
  const queue = useMemo(() => {
    const due = CARDS.filter(c => p.cards[c.id] && p.cards[c.id].due <= now).sort((a, b) => p.cards[a.id].due - p.cards[b.id].due);
    const fresh = CARDS.filter(c => !p.cards[c.id]);
    const later = ahead ? CARDS.filter(c => p.cards[c.id] && p.cards[c.id].due > now).sort((a, b) => p.cards[a.id].due - p.cards[b.id].due) : [];
    return [...due, ...fresh.slice(0, 15), ...later];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.cards, ahead, done]);
  const card = queue[0];
  const learned = Object.values(p.cards).filter(c => c.reps > 0 && c.ivl >= 0.5).length;
  const rate = (g: 0 | 1 | 2 | 3) => {
    if (!card) return;
    buzz(g === 0 ? [20, 30, 20] : 8);
    update(q => { q.cards[card.id] = schedule(q.cards[card.id], g); });
    setFlip(false); setDone(d => d + 1);
    if (queue.length === 1) burst(0.8);
  };
  const s = card ? p.cards[card.id] : undefined;
  return (
    <div className="deck">
      <div className="deck-stats"><span><b>{queue.length}</b> in queue</span><span><b>{learned}</b>/{CARDS.length} learned</span><span><b>{done}</b> reviewed now</span></div>
      <AnimatePresence mode="wait">
        {card ? (
          <motion.div key={card.id + done} className={`fcard ${flip ? 'flip' : ''}`} initial={{ y: 30, opacity: 0, rotate: -2 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ x: -80, opacity: 0, rotate: -6 }} transition={{ duration: 0.25 }} onClick={() => { setFlip(f => !f); buzz(5); }}>
            <div className="fc-inner">
              <div className="fc-face fc-front"><span className="fc-tag">{s ? 'review' : 'new'}</span><Md text={card.f} /><span className="fc-hint">tap to flip</span></div>
              <div className="fc-face fc-back"><span className="fc-tag">answer</span><Md text={card.b} /></div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" className="fcard empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="fc-face"><h3>All caught up ✓</h3><p className="mut">Come back later — spaced repetition shows each card right before you'd forget it.</p><button className="btn" onClick={() => setAhead(true)}>Study ahead anyway</button></div>
          </motion.div>
        )}
      </AnimatePresence>
      {card && (
        <div className={`grades ${flip ? 'show' : ''}`}>
          {flip ? (
            <>
              <button className="g again" onClick={() => rate(0)}>Again<small>1m</small></button>
              <button className="g hard" onClick={() => rate(1)}>Hard<small>{fmtIvl(schedule(s, 1).ivl)}</small></button>
              <button className="g good" onClick={() => rate(2)}>Good<small>{fmtIvl(schedule(s, 2).ivl)}</small></button>
              <button className="g easy" onClick={() => rate(3)}>Easy<small>{fmtIvl(schedule(s, 3).ivl)}</small></button>
            </>
          ) : <button className="btn primary big" onClick={() => setFlip(true)}>Show answer</button>}
        </div>
      )}
      <button className="btn ghost small reset" onClick={() => { if (confirm('Reset all flashcard progress?')) update(q => { q.cards = {}; }); }}><RotateCcw size={13} /> reset deck</button>
    </div>
  );
}

export function Reference({ tab }: { tab: 'sheet' | 'cards' }) {
  return (
    <div className="page ref">
      <header className="page-h"><h2>Reference</h2></header>
      <div className="seg big">
        <button className={tab === 'sheet' ? 'on' : ''} onClick={() => go('/ref')}>Cheat sheet</button>
        <button className={tab === 'cards' ? 'on' : ''} onClick={() => go('/ref/cards')}>Flashcards</button>
      </div>
      {tab === 'sheet' ? <Sheet /> : <Cards />}
    </div>
  );
}
