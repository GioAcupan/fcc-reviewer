import { C } from './types';

export interface Sheet { id: string; title: string; icon: string; body: string; code?: string }
export const SHEETS: Sheet[] = [
  {
    id: 'skeleton', title: 'Program skeleton', icon: '{ }', body: 'Every exam answer starts here. Declare variables at the top of main, end every statement with ~;~.',
    code: C`
#include <stdio.h>      // printf, scanf
#include <math.h>       // sqrt, pow (only if needed)
#define PI 3.14159

int main() {
    // 1. declare   2. input   3. process   4. output
    return 0;
}
`,
  },
  {
    id: 'flow', title: 'Flowchart ↔ C', icon: '◆',
    body: `| Symbol | Meaning | C |
| Oval / pill | Start / End | ~int main() {~ … ~return 0; }~ |
| Parallelogram | Input | ~printf("prompt"); scanf("%d", &n);~ |
| Parallelogram | Output / Display | ~printf("Sum = %d\\n", sum);~ |
| Rectangle | Process | ~sum = sum + i;~ |
| Hexagon | Initialization | ~int sum = 0, i = 15;~ / for-loop start |
| Diamond | Decision | ~if (…)~, ~while (…)~, ~} while (…);~ |
| Double-sided box | Predefined process | a call to your own function |
| Arrow back up | Loop | ~while~ / ~do-while~ / ~for~ |`,
  },
  {
    id: 'types', title: 'Types & format codes', icon: '%d',
    body: `| Type | Holds | printf | scanf |
| ~int~ | whole numbers | ~%d~ | ~%d~ |
| ~long long~ | big whole numbers | ~%lld~ | ~%lld~ |
| ~float~ | decimals | ~%f~ | ~%f~ |
| ~double~ | decimals (precise) | ~%f~ / ~%.2f~ | ~%lf~ |
| ~char~ | one character | ~%c~ | ~" %c"~ |
| ~char s[50]~ | a word | ~%s~ | ~%s~ (no &) |

~%.2f~ = 2 decimals · ~%5d~ = width 5 · ~\\n~ new line · ~\\t~ tab · ~%%~ prints %

**Box limits:** ~int~ ≈ ±2.1 billion (past that it wraps around; use ~long long~) · ~float~ ≈ 7 digits, ~double~ ≈ 15 (use double) · storing a decimal in an int **chops** it: 3.99 → 3.`,
  },
  {
    id: 'ops', title: 'Operators & precedence', icon: '+−',
    body: `- Arithmetic: ~+ - * / %~ (~%~ = remainder, ints only)
- Compare: ~== != < > <= >=~ (result is 1 or 0)
- Logic: ~&&~ and, ~||~ or, ~!~ not
- Assign: ~= += -= *= /= %=~ · ~i++~ adds 1, ~i--~ subtracts 1
- Order: ~( )~ → ~! ++ --~ → ~* / %~ → ~+ -~ → ~< > <= >=~ → ~== !=~ → ~&&~ → ~||~ → ~=~

> int ÷ int is an int: ~7 / 2~ is 3. Use ~7.0 / 2~ or ~(double) a / b~ for 3.5.`,
  },
  {
    id: 'mod', title: '% and / tricks', icon: 'mod',
    body: `- even: ~n % 2 == 0~ · odd: ~n % 2 != 0~
- multiple of k: ~n % k == 0~
- last digit: ~n % 10~ · drop last digit: ~n / 10~
- digit loop: ~while (n > 0) { d = n % 10; n = n / 10; }~
- hours/minutes: ~t / 60~ and ~t % 60~`,
  },
  {
    id: 'math', title: 'math.h & formulas', icon: '√',
    body: `| Math | C |
| √x | ~sqrt(x)~ |
| xⁿ | ~pow(x, n)~ or ~x * x~ |
| abs value | ~fabs(x)~ (double), ~abs(n)~ (int) |
| π | ~PI~ via ~#define PI 3.14159~, or ~M_PI~ |
| ½bh | ~0.5 * b * h~ (never ~1/2~!) |
| round up / down | ~ceil(x)~ / ~floor(x)~ |

> ~^~ is NOT power in C. ~r^2~ is a bug.`,
  },
  {
    id: 'sa', title: 'Surface area: Face Method', icon: '⬢',
    body: `1. List every **outside** face. 2. Area of each. 3. Hidden lengths via Pythagoras. 4. Add.

| Solid | Total surface area |
| Box | ~2(lw + lh + wh)~ |
| Any prism | ~2·base area + base perimeter · length~ |
| Cylinder | ~2πr² + 2πrh~ |
| Cone | ~πr² + πrl~, ~l = √(r² + h²)~ |
| Frustum | ~πr² + πR² + π(R + r)s~, ~s = √(h² + (R − r)²)~ |
| Sphere | ~4πr²~ |
| Hemisphere | ~3πr²~ (dome 2πr² + flat πr²) |
| Square pyramid | ~b² + 2bs~, ~s = √(h² + (b/2)²)~ |

> Composite solids: glued faces are **not** counted.`,
  },
  {
    id: 'if', title: 'if / else / switch', icon: '?:',
    code: C`
if (score >= 90) {
    printf("A\n");
} else if (score >= 80) {
    printf("B\n");
} else {
    printf("F\n");
}

switch (choice) {          // int or char only
    case 1: printf("One\n"); break;
    case 2: printf("Two\n"); break;
    default: printf("Other\n");
}
`, body: 'The ladder stops at the **first** true branch. Never put ~;~ right after ~if (…)~. Each ~case~ needs ~break;~.',
  },
  {
    id: 'loops', title: 'Loops', icon: '↻',
    code: C`
while (i <= n) { ...; i++; }          // pre-test

do { ...; i++; } while (i <= n);      // post-test (note the ;)

for (i = 1; i <= n; i++) { ... }      // start; check; step
`,
    body: '**while** may run 0 times · **do-while** runs at least once (the workbook\'s loop shape) · **for** = start, check and step in one line. Every loop needs a step that moves toward the exit.',
  },
  {
    id: 'patterns', title: 'Accumulator patterns', icon: 'Σ',
    body: `| Series | Code |
| 1 + 2 + … + N | ~for (i = 1; i <= n; i++) sum += i;~ |
| 1 + 3 + 5 + … ≤ N | ~for (i = 1; i <= n; i += 2) sum += i;~ |
| M + … + N step k | ~for (i = m; i <= n; i += k) sum += i;~ |
| squares | ~sum += i * i;~ |
| 1 − 2 + 3 − … | ~sum += sign * i; sign = -sign;~ |
| product / factorial | ~prod = 1;~ … ~prod *= i;~ |
| count terms | ~count++;~ |
| max so far | ~if (x > max) max = x;~ |

Init **before** the loop (sum = 0, prod = 1). Print **after** the loop.`,
  },
  {
    id: 'p11', title: 'Exam template: guard + accumulate', icon: '⛨',
    code: C`
printf("Enter N: ");
scanf("%d", &n);
if (n <= 15 || n % 3 != 0) {          // INVALID condition
    printf("Error: ...\n");
} else {
    int sum = 0, term = 15;           // first term
    do {
        sum = sum + term;             // term expression
        term = term + 3;              // step
    } while (term <= n);
    printf("Sum = %d\n", sum);
}
`,
    body: 'Flip a valid condition into an error condition: negate each part and swap ~&&~ ↔ ~||~. Valid ~n > 15 && n % 3 == 0~ → invalid ~n <= 15 || n % 3 != 0~.',
  },
  {
    id: 'text', title: 'Text in variables (strings)', icon: '"s"',
    code: C`
char *honor;                    // points to text
honor = "Cum Laude";            // OK
printf("Honor: %s\n", honor);   // print text with %s

char name[30];                  // array of chars
scanf("%s", name);              // one word, no & for arrays
strcpy(name, "Juan");           // copy text in (<string.h>)
`,
    body: `~char x;~ holds ONE character. Arrays can't be assigned with ~=~: use ~char *~ or ~strcpy~. Compare text with ~strcmp(a, b) == 0~, never ~a == b~.

> GWA-type boundaries (1.20, 1.45, 1.75): use **double**, not float.`,
  },
  {
    id: 'errors', title: 'Top mistakes', icon: '✗',
    body: `1. Missing ~;~ at the end of a statement
2. ~if (x = 5)~ instead of ~if (x == 5)~
3. ~scanf("%d", n)~ — missing ~&~
4. ~%f~ in scanf for a ~double~ (use ~%lf~)
5. ~1/2~ or ~sum / n~ with ints → integer division
6. ~r^2~ instead of ~r * r~ / ~pow(r, 2)~
7. ~sum~ not initialized to 0 (garbage!)
8. Loop never changes its variable → infinite loop
9. ~;~ right after ~while (…)~ or ~for (…)~
10. Missing ~#include <math.h>~ for sqrt/pow
11. ~char honor;~ for text (use ~char *honor;~)
12. ~float~ for boundary checks like ~gwa <= 1.20~ (use ~double~)`,
  },
];

export interface Card { id: string; f: string; b: string; code?: boolean }
export const CARDS: Card[] = [
  { id: 'c1', f: 'Which header gives you printf and scanf?', b: '`#include <stdio.h>`' },
  { id: 'c2', f: 'Which header gives you sqrt and pow?', b: '`#include <math.h>`' },
  { id: 'c3', f: 'Format code to PRINT a double with 2 decimals', b: '`%.2f`' },
  { id: 'c4', f: 'Format code to READ a double with scanf', b: '`%lf`' },
  { id: 'c5', f: 'What does & mean in scanf("%d", &n)?', b: '"the address of n" — where scanf should store the value.' },
  { id: 'c6', f: 'What is 7 / 2 in C (both ints)?', b: '**3** — int ÷ int truncates.' },
  { id: 'c7', f: 'What is 17 % 5?', b: '**2** (the remainder)' },
  { id: 'c8', f: 'C condition: n is a multiple of 3', b: '`n % 3 == 0`' },
  { id: 'c9', f: 'C condition: n is odd', b: '`n % 2 != 0`' },
  { id: 'c10', f: 'Flowchart: hexagon means…', b: 'Initialization / preparation (e.g. Sum = 0, Counter = 15, or a for-loop start)' },
  { id: 'c11', f: 'Flowchart: parallelogram means…', b: 'Input or Output → `scanf` / `printf`' },
  { id: 'c12', f: 'Flowchart: diamond means…', b: 'Decision → `if`, `while`, `do … while` condition' },
  { id: 'c13', f: 'Flowchart: rectangle means…', b: 'Process → an assignment like `sum = sum + i;`' },
  { id: 'c14', f: 'Flowchart: oval / pill means…', b: 'Terminal: Start (`int main() {`) or End (`return 0; }`)' },
  { id: 'c15', f: 'Translate: N ≤ 15 or N mod 3 ≠ 0', b: '`n <= 15 || n % 3 != 0`' },
  { id: 'c16', f: 'Translate: x is between 1 and 10 inclusive', b: '`x >= 1 && x <= 10` (not `1 <= x <= 10`!)' },
  { id: 'c17', f: 'Flip into an ERROR condition: n > 20 && n % 4 == 0', b: '`n <= 20 || n % 4 != 0`' },
  { id: 'c18', f: 'Which loop always runs its body at least once?', b: '`do { … } while (cond);`' },
  { id: 'c19', f: 'The 3 parts inside for ( ; ; )', b: 'start ; check ; step — e.g. `for (i = 1; i <= n; i++)`' },
  { id: 'c20', f: 'Starting value for a SUM accumulator', b: '`0`' },
  { id: 'c21', f: 'Starting value for a PRODUCT accumulator', b: '`1`' },
  { id: 'c22', f: 'Loop for 15 + 18 + 21 + … + N', b: '`for (i = 15; i <= n; i += 3) sum += i;`' },
  { id: 'c23', f: 'Alternating sign trick (1 − 2 + 3 − …)', b: '`sum += sign * i; sign = -sign;` (sign starts at 1)' },
  { id: 'c24', f: 'Last digit of n / remove last digit', b: '`n % 10` / `n = n / 10`' },
  { id: 'c25', f: 'Why is r^2 wrong in C?', b: '`^` is bitwise XOR. Use `r * r` or `pow(r, 2)`.' },
  { id: 'c26', f: 'Why is 1/2 * b * h always 0 (ints 1 and 2)?', b: '`1/2` is integer division = 0. Use `0.5 * b * h`.' },
  { id: 'c27', f: 'Surface area: cylinder', b: '2πr² + 2πrh → `2*PI*r*r + 2*PI*r*h`' },
  { id: 'c28', f: 'Surface area: cone', b: 'πr² + πrl, with l = √(r² + h²)' },
  { id: 'c29', f: 'Surface area: frustum (Problem 1)', b: 'πr² + πR² + π(R + r)s, with s = √(h² + (R − r)²)' },
  { id: 'c30', f: 'Surface area: sphere / hemisphere', b: 'Sphere 4πr² · Hemisphere 3πr² (dome 2πr² + flat πr²)' },
  { id: 'c31', f: 'Surface area: any prism', b: '2 × (base area) + (base perimeter) × length' },
  { id: 'c32', f: 'Slant height of a square pyramid (base b, height h)', b: '√(h² + (b/2)²)' },
  { id: 'c33', f: 'Composite solid rule', b: 'Count only OUTSIDE faces — glued faces are hidden.' },
  { id: 'c34', f: 'What does `i++` mean?', b: '`i = i + 1`' },
  { id: 'c35', f: 'What does `sum += i` mean?', b: '`sum = sum + i`' },
  { id: 'c36', f: 'What is wrong: while (i <= 10);', b: 'The `;` IS the loop body → infinite loop. Remove it.' },
  { id: 'c37', f: 'What does `return 0;` in main mean?', b: 'The program ended successfully (the End terminal).' },
  { id: 'c38', f: 'How do you print a literal % sign?', b: '`%%`' },
  { id: 'c39', f: 'Type for 20! (factorial)', b: '`long long`, printed with `%lld`' },
  { id: 'c40', f: 'Uninitialized `int sum;` contains…', b: 'Garbage — always write `int sum = 0;`' },
  { id: 'c41', f: 'Convert int a to double for division', b: '`(double) a / b`' },
  { id: 'c42', f: 'else-if ladder runs how many branches?', b: 'Only the FIRST one whose condition is true.' },
  { id: 'c43', f: 'Euclid GCD loop', b: '`while (b != 0) { r = a % b; a = b; b = r; }` → a is the GCD' },
  { id: 'c44', f: 'Track the maximum while reading values', b: '`if (x > max) max = x;` (max starts at the first value)' },
  { id: 'c45', f: 'Average of int total over n, as a decimal', b: '`(double) total / n`' },
  { id: 'c46', f: 'Store the text "Cum Laude" in a variable', b: '`char *honor = "Cum Laude";` and print it with `%s`' },
  { id: 'c47', f: 'Why does `char h[30]; h = "Summa";` fail?', b: 'Arrays can\'t be assigned with `=`. Use `strcpy(h, "Summa");` or declare `char *h;`' },
  { id: 'c48', f: 'GWA ladder with ≤ checks: which bound goes first?', b: 'The smallest: 1.20 → 1.45 → 1.75. Otherwise everyone stops at the widest check.' },
  { id: 'c49', f: 'Why use double, not float, for a GWA of 1.20?', b: 'float stores 1.2000000477, so `gwa <= 1.20` is false. A double matches the 1.20 in your code.' },
  { id: 'c50', f: 'About how big can an int get?', b: '≈ 2.1 billion (2,147,483,647). One more wraps around to a negative number, so use `long long` beyond that.' },
  { id: 'c51', f: '`int x = 3.99;` stores…', b: '**3**: decimals are chopped, not rounded.' },
  { id: 'c52', f: "`'7'` vs `7` vs `\"7\"`", b: "`'7'` is a char (one symbol), `7` is an int, `\"7\"` is text." },
  { id: 'c53', f: 'Why does scanf need %lf for a double while printf is fine with %f?', b: 'scanf writes INTO the box, so it needs the exact size (%f = float, %lf = double). printf only reads a copy.' },
];
