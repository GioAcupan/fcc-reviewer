import { LESSONS } from '../content/lessons';
import type { Lesson } from '../content/types';
import type { Progress } from './store';

/**
 * Where "continue" should take you — shared by the Home card and the Learn map tag.
 * The lesson you last opened (if unfinished); else the next unfinished one after it
 * (wrapping to the first unfinished); "review" once everything is done.
 */
export function resumeTarget(p: Progress): { lesson: Lesson; label: string; tag: string } {
  const unfinished = (l: Lesson) => !p.lessons[l.id]?.done;
  const out = (lesson: Lesson, tag: string) => ({ lesson, tag, label: tag + ' →' });
  const last = LESSONS.find(l => l.id === p.lastLesson);
  if (last && unfinished(last)) return out(last, 'continue');
  const nxt = LESSONS.slice(last ? LESSONS.indexOf(last) + 1 : 0).find(unfinished) ?? LESSONS.find(unfinished);
  if (!nxt) return out(last ?? LESSONS[LESSONS.length - 1], 'review');
  if ((p.lessons[nxt.id]?.step ?? 0) > 0) return out(nxt, 'continue');
  return out(nxt, last || Object.keys(p.lessons).length ? 'up next' : 'start here');
}
