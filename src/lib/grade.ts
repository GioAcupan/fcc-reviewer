import { compile, run, Compiled } from '../engine/interp';

export interface TestCase { input: string; nums?: number[]; has?: string[]; not?: string[]; block?: string; all?: boolean; label?: string }
export interface TestResult { ok: boolean; why: string; input: string; output: string; expect: string; status: string }

const NUM_RE = /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g;
const norm = (s: string) => s.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n');
const near = (a: number, b: number) => {
  if (Number.isInteger(b)) return Math.abs(a - b) < 1e-6;
  return Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.002);
};

export function describeExpect(t: TestCase) {
  const parts: string[] = [];
  if (t.nums?.length) parts.push(t.nums.join(', '));
  if (t.has?.length) parts.push(t.has.map(h => `"${h}"`).join(', '));
  if (t.block) parts.push(t.block);
  if (t.not?.length) parts.push('NOT ' + t.not.map(h => `"${h}"`).join(', '));
  return parts.join('  ·  ');
}

export function gradeOne(c: Compiled, t: TestCase): TestResult {
  const r = run(c, { stdin: t.input, maxSteps: 2_000_000, timeLimitMs: 1500 });
  const base = { input: t.input, output: r.output, expect: describeExpect(t), status: r.status };
  if (r.status === 'error' || r.status === 'timeout' || r.status === 'inputEnd') return { ...base, ok: false, why: r.error ? `${r.error.msg}${r.error.line ? ` (line ${r.error.line})` : ''}` : 'Program crashed' };
  const out = r.output;
  if (t.nums?.length) {
    const got = (out.match(NUM_RE) || []).map(Number);
    let j = 0;
    for (const g of got) if (j < t.nums.length && near(g, t.nums[j])) j++;
    if (j < t.nums.length) return { ...base, ok: false, why: `Expected to see ${t.nums[j]} in the output${j > 0 ? ` (after ${t.nums.slice(0, j).join(', ')})` : ''}.` };
  }
  const low = out.toLowerCase().replace(/\s+/g, ' ');
  for (const h of t.has ?? []) if (!low.includes(h.toLowerCase().replace(/\s+/g, ' '))) return { ...base, ok: false, why: `Expected the output to contain "${h}".` };
  for (const h of t.not ?? []) if (low.includes(h.toLowerCase())) return { ...base, ok: false, why: `The output should NOT contain "${h}" for this input.` };
  if (t.block && !norm(out).includes(norm(t.block))) return { ...base, ok: false, why: 'The printed pattern does not match exactly (check spaces and new lines).' };
  if (t.all && r.stdinLeft.trim()) return { ...base, ok: false, why: `Your program stopped before reading all inputs (left: ${r.stdinLeft.trim().split(/\s+/).join(', ')}). Did it ask again after an invalid value?` };
  return { ...base, ok: true, why: 'Passed' };
}

export function gradeAll(code: string, tests: TestCase[]) {
  const c = compile(code);
  if (!c.ok) return { compiled: c, results: [] as TestResult[], pass: false };
  const results = tests.map(t => gradeOne(c, t));
  return { compiled: c, results, pass: results.every(r => r.ok) };
}
