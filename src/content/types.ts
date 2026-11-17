import type { TestCase } from '../lib/grade';

export type Step =
  | { t: 'read'; title: string; body: string; code?: string; anno?: Record<number, string>; flow?: boolean }
  | { t: 'link'; title: string; body: string; code: string }
  | { t: 'trace'; title: string; body: string; code: string; stdin?: string }
  | { t: 'quiz'; title: string; q: string; code?: string; opts: string[]; a: number; why: string }
  | { t: 'fill'; title: string; body: string; code: string; extra?: string[]; why?: string }
  | { t: 'order'; title: string; body: string; lines: string[]; given?: number; why?: string }
  | { t: 'code'; title: string; body: string; starter: string; tests: import('../lib/grade').TestCase[]; hints: string[]; solution: string; blueprint?: boolean; paper?: boolean }
  | { t: 'shape'; title: string; body: string; shape: string }
  | { t: 'sort'; title: string; body: string; cats: string[]; items: { t: string; a: number; why?: string }[] };

export interface Lesson { id: string; unit: number; title: string; sub: string; icon: string; boss?: boolean; mini?: boolean; steps: Step[] }
export interface Unit { n: number; title: string; tag: string; color: string }

export interface Challenge {
  id: string; diff: 'easy' | 'medium' | 'hard'; n: number; title: string; tags: string[];
  story: string; io: string; sample: { in: string; out: string };
  starter?: string; tests: TestCase[]; hints: string[]; solution: string;
}

export const C = (s: TemplateStringsArray, ...v: unknown[]) => String.raw(s, ...v).replace(/^\n/, '');
export const STARTER = C`
#include <stdio.h>

int main() {

    return 0;
}
`;
export const STARTER_MATH = C`
#include <stdio.h>
#include <math.h>
#define PI 3.14159

int main() {

    return 0;
}
`;
