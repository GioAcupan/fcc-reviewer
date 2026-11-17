import { compile, run } from '../src/engine/interp';
import { buildFlow } from '../src/engine/flow';

const cases: [string, string, string][] = [
  ['p11', `#include <stdio.h>
int main() {
    int n, sum = 0, counter;
    printf("Enter an integer N: ");
    scanf("%d", &n);
    if (n <= 15 || n % 3 != 0) {
        printf("Error: Must be a multiple of 3 > 15\\n");
    } else {
        counter = 15;
        do {
            sum = sum + counter;
            counter = counter + 3;
        } while (counter <= n);
        printf("Sum of multiples of 3 from 15 to %d is: %d\\n", n, sum);
    }
    return 0;
}`, '21\n'],
  ['frustum', `#include <stdio.h>
#include <math.h>
#define PI 3.14159
int main() {
    double R, r, h, s, top, base, lat, total;
    printf("Enter R, r, h: ");
    scanf("%lf %lf %lf", &R, &r, &h);
    s = sqrt(h * h + pow(R - r, 2));
    top = PI * r * r;
    base = PI * pow(R, 2);
    lat = PI * (R + r) * s;
    total = top + base + lat;
    printf("Total Surface Area of the Frustum: %.2f\\n", total);
    return 0;
}`, '5 3 4\n'],
  ['loops', `#include <stdio.h>
int main() {
  int i, j, n = 4; float avg; int a[5] = {1,2,3,4,5}; int sum = 0;
  for (i = 0; i < 5; i++) sum += a[i];
  avg = sum / 5;
  printf("%d %f %.3f %5.1f|%-4d|%04d %c %s %e %g\\n", sum, avg, 2.0/3, 3.14159, 7, 42, 'A', "hey", 12345.678, 0.0001);
  for (i = 1; i <= n; i++) { for (j = 1; j <= i; j++) printf("*"); printf("\\n"); }
  int k = 10; while (k > 0) { if (k == 4) break; k -= 3; } printf("k=%d 7/2=%d 7%%2=%d -7/2=%d\\n", k, 7/2, 7%2, -7/2);
  switch (k) { case 4: printf("four\\n"); break; default: printf("other\\n"); }
  return 0;
}`, ''],
  ['errors', `#include <stdio.h>
int main() {
  int x
  printf("%d", x);
}`, ''],
  ['warn', `int main() {
  int n; double r;
  scanf("%d", n);
  printf("%d", r);
  if (n = 5) printf("five");
  return 0;
}`, '3\n'],
  ['uninit', `#include <stdio.h>
int main() { int i, sum; for (i = 1; i <= 3; i++) sum += i; printf("%d\\n", sum); return 0; }`, ''],
  ['func', `#include <stdio.h>
int fact(int n) { if (n <= 1) return 1; return n * fact(n - 1); }
int main() { long long f = 1; int i; for (i = 1; i <= 20; i++) f *= i; printf("%d %lld\\n", fact(5), f); return 0; }`, ''],
];

for (const [name, src, stdin] of cases) {
  const c = compile(src);
  console.log(`\n=== ${name} ok=${c.ok}`);
  for (const d of c.diags) console.log(`  ${d.sev} L${d.line}: ${d.msg}${d.hint ? '  // ' + d.hint : ''}`);
  if (!c.ok) continue;
  const r = run(c, { stdin, trace: true });
  console.log(`  status=${r.status} steps=${r.steps} trace=${r.trace.length}`);
  if (r.error) console.log('  ERR', r.error);
  for (const d of r.rdiags) console.log('  rt-warn', d.msg);
  console.log(r.output.split('\n').map(l => '  | ' + l).join('\n'));
  const f = buildFlow(c.prog!);
  if (f) console.log('  flow nodes:', f.nodes.map(n => `[${n.shape}] ${n.lines.join(' / ')}`).join('  ->  '));
  const keys = new Set(r.trace.map(t => t.key));
  const unmapped = [...keys].filter(k => f && f.keyMap[k] === undefined);
  console.log('  unmapped trace keys:', unmapped.join(',') || 'none');
}
// interactive
const c = compile(cases[0][1]);
let r = run(c, { interactive: true });
console.log('\ninteractive first:', r.status, JSON.stringify(r.output));
r = run(c, { interactive: true, stdin: '14\n' });
console.log('interactive second:', r.status, JSON.stringify(r.output));
