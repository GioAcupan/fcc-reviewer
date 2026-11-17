import { useSyncExternalStore } from 'react';

export interface CardState { due: number; ivl: number; ease: number; reps: number }
export interface Progress {
  lessons: Record<string, { done: boolean; step: number }>;
  challenges: Record<string, { solved: boolean; stars: number; hints: number; fails: number; code?: string; best?: number }>;
  xp: number;
  streak: { last: string; count: number };
  cards: Record<string, CardState>;
  playground: string;
  name?: string;
  lastLesson?: string;
}
const KEY = 'chero-progress-v1';
const fresh = (): Progress => ({ lessons: {}, challenges: {}, xp: 0, streak: { last: '', count: 0 }, cards: {}, playground: '' });

let state: Progress = (() => {
  try { const s = localStorage.getItem(KEY); if (s) return { ...fresh(), ...JSON.parse(s) }; } catch { /* private mode */ }
  return fresh();
})();
const subs = new Set<() => void>();
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }

export function getProgress() { return state; }
export function update(fn: (p: Progress) => void) {
  const next = structuredClone(state); fn(next); state = next; save(); subs.forEach(s => s());
}
export function useProgress(): Progress {
  return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => state, () => state);
}
const today = () => new Date().toISOString().slice(0, 10);
export function addXp(n: number) {
  update(p => {
    p.xp += n;
    const t = today();
    if (p.streak.last !== t) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      p.streak.count = p.streak.last === y ? p.streak.count + 1 : 1;
      p.streak.last = t;
    }
  });
}
export function resetProgress() { state = fresh(); save(); subs.forEach(s => s()); }
