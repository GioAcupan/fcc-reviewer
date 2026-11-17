import { C, Challenge } from './types';

const S = (body: string) => C`
#include <stdio.h>

int main() {
${body}
    return 0;
}
`;

export const CHALLENGES: Challenge[] = [
  // ───────────── EASY ─────────────
  {
    id: 'e1', diff: 'easy', n: 1, title: 'Pocket Calculator', tags: ['scanf', 'arithmetic'],
    story: 'Your blockmate lost their calculator during the quiz. Build one.',
    io: 'Input two integers a and b. Print their sum, difference (a − b) and product, in that order.',
    sample: { in: '7 3', out: 'Sum = 10\nDifference = 4\nProduct = 21' },
    tests: [{ input: '7 3\n', nums: [10, 4, 21] }, { input: '-2 5\n', nums: [3, -7, -10] }, { input: '0 9\n', nums: [9, -9, 0] }],
    hints: ['int a, b; scanf("%d %d", &a, &b);', 'printf("Sum = %d\\n", a + b); and so on for - and *'],
    solution: S(`    int a, b;
    printf("Enter a and b: ");
    scanf("%d %d", &a, &b);
    printf("Sum = %d\\n", a + b);
    printf("Difference = %d\\n", a - b);
    printf("Product = %d\\n", a * b);`),
  },
  {
    id: 'e2', diff: 'easy', n: 2, title: 'Rectangle Report', tags: ['double', '%.2f'],
    story: 'The org needs tarpaulin for a rectangular booth.',
    io: 'Input the length and width (decimals). Print the area, then the perimeter, both with 2 decimals.',
    sample: { in: '4.5 2', out: 'Area = 9.00\nPerimeter = 13.00' },
    tests: [{ input: '4.5 2\n', nums: [9, 13] }, { input: '10 3.25\n', nums: [32.5, 26.5] }, { input: '1 1\n', nums: [1, 4] }],
    hints: ['Use double and scanf("%lf %lf", &l, &w);', 'perimeter = 2 * (l + w)'],
    solution: S(`    double l, w;
    printf("Enter length and width: ");
    scanf("%lf %lf", &l, &w);
    printf("Area = %.2f\\n", l * w);
    printf("Perimeter = %.2f\\n", 2 * (l + w));`),
  },
  {
    id: 'e3', diff: 'easy', n: 3, title: 'Celsius to Fahrenheit', tags: ['formula', 'int-division trap'],
    story: 'Manila heat index check. F = C × 9/5 + 32.',
    io: 'Input a temperature in Celsius (decimal). Print it in Fahrenheit with 2 decimals.',
    sample: { in: '37', out: '98.60 F' },
    tests: [{ input: '100\n', nums: [212] }, { input: '37\n', nums: [98.6] }, { input: '-40\n', nums: [-40] }, { input: '0\n', nums: [32] }],
    hints: ['Use double for the temperature.', 'Careful: 9/5 in C is 1! Write 9.0 / 5 or c * 9 / 5 with c a double.'],
    solution: S(`    double c, f;
    printf("Celsius: ");
    scanf("%lf", &c);
    f = c * 9.0 / 5 + 32;
    printf("%.2f F\\n", f);`),
  },
  {
    id: 'e4', diff: 'easy', n: 4, title: 'Even or Odd', tags: ['if/else', '%'],
    story: 'The simplest diamond there is.',
    io: 'Input an integer. Print EVEN or ODD.',
    sample: { in: '7', out: 'ODD' },
    tests: [{ input: '8\n', has: ['EVEN'], not: ['ODD'] }, { input: '7\n', has: ['ODD'], not: ['EVEN'] }, { input: '0\n', has: ['EVEN'], not: ['ODD'] }, { input: '-3\n', has: ['ODD'], not: ['EVEN'] }],
    hints: ['n % 2 == 0 means even.', 'Watch out: in C, -3 % 2 is -1, so test == 0 instead of == 1.'],
    solution: S(`    int n;
    printf("Enter n: ");
    scanf("%d", &n);
    if (n % 2 == 0) {
        printf("EVEN\\n");
    } else {
        printf("ODD\\n");
    }`),
  },
  {
    id: 'e5', diff: 'easy', n: 5, title: 'Seconds Splitter', tags: ['/', '%'],
    story: 'Convert a stopwatch reading into hours, minutes and seconds.',
    io: 'Input total seconds (int). Print hours, minutes and seconds in that order.',
    sample: { in: '3725', out: '1 h 2 m 5 s' },
    tests: [{ input: '3725\n', nums: [1, 2, 5] }, { input: '59\n', nums: [0, 0, 59] }, { input: '86399\n', nums: [23, 59, 59] }],
    hints: ['hours = t / 3600;', 'minutes = (t % 3600) / 60;  seconds = t % 60;'],
    solution: S(`    int t;
    printf("Seconds: ");
    scanf("%d", &t);
    printf("%d h %d m %d s\\n", t / 3600, (t % 3600) / 60, t % 60);`),
  },
  {
    id: 'e6', diff: 'easy', n: 6, title: 'Biggest of Three', tags: ['if', '&&'],
    story: 'Three bids came in. Who wins?',
    io: 'Input three integers. Print the largest.',
    sample: { in: '3 9 4', out: 'Largest = 9' },
    tests: [{ input: '3 9 4\n', nums: [9] }, { input: '-1 -7 -3\n', nums: [-1] }, { input: '5 5 2\n', nums: [5] }, { input: '1 2 3\n', nums: [3] }],
    hints: ['Keep a variable max = a; then compare with b and c.', 'if (b > max) max = b; if (c > max) max = c;'],
    solution: S(`    int a, b, c, max;
    printf("Enter three integers: ");
    scanf("%d %d %d", &a, &b, &c);
    max = a;
    if (b > max) max = b;
    if (c > max) max = c;
    printf("Largest = %d\\n", max);`),
  },
  {
    id: 'e7', diff: 'easy', n: 7, title: 'Circle Stats', tags: ['#define', 'PI'],
    story: 'Pizza math: how much pizza, how much crust?',
    io: 'Input a radius. Print the area, then the circumference (2 decimals). Use PI = 3.14159.',
    sample: { in: '2.5', out: 'Area = 19.63\nCircumference = 15.71' },
    tests: [{ input: '1\n', nums: [3.14, 6.28] }, { input: '2.5\n', nums: [19.63, 15.71] }, { input: '10\n', nums: [314.16, 62.83] }],
    hints: ['#define PI 3.14159 at the top.', 'area = PI * r * r;  circumference = 2 * PI * r;'],
    solution: C`
#include <stdio.h>
#define PI 3.14159

int main() {
    double r;
    printf("Radius: ");
    scanf("%lf", &r);
    printf("Area = %.2f\n", PI * r * r);
    printf("Circumference = %.2f\n", 2 * PI * r);
    return 0;
}
`,
  },
  {
    id: 'e8', diff: 'easy', n: 8, title: 'Letter Grade', tags: ['else-if ladder'],
    story: '90+ A, 80+ B, 70+ C, 60+ D, below that F.',
    io: 'Input a score (0–100). Print exactly "Grade: X".',
    sample: { in: '85', out: 'Grade: B' },
    tests: [{ input: '95\n', has: ['Grade: A'] }, { input: '85\n', has: ['Grade: B'] }, { input: '72\n', has: ['Grade: C'] }, { input: '60\n', has: ['Grade: D'] }, { input: '59\n', has: ['Grade: F'] }, { input: '90\n', has: ['Grade: A'] }, { input: '80\n', has: ['Grade: B'] }],
    hints: ['Check from the top: if (s >= 90) ... else if (s >= 80) ...', 'Boundaries matter: 90 is an A, so use >=.'],
    solution: S(`    int s;
    printf("Score: ");
    scanf("%d", &s);
    if (s >= 90) printf("Grade: A\\n");
    else if (s >= 80) printf("Grade: B\\n");
    else if (s >= 70) printf("Grade: C\\n");
    else if (s >= 60) printf("Grade: D\\n");
    else printf("Grade: F\\n");`),
  },
  {
    id: 'e9', diff: 'easy', n: 9, title: 'Count to N', tags: ['for loop'],
    story: 'Your first loop level.',
    io: 'Input N. Print 1 to N on one line, separated by spaces.',
    sample: { in: '5', out: '1 2 3 4 5' },
    tests: [{ input: '5\n', nums: [1, 2, 3, 4, 5] }, { input: '1\n', nums: [1] }, { input: '8\n', nums: [1, 2, 3, 4, 5, 6, 7, 8] }],
    hints: ['for (i = 1; i <= n; i++)', 'printf("%d ", i); inside the loop'],
    solution: S(`    int n, i;
    printf("N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        printf("%d ", i);
    }
    printf("\\n");`),
  },
  {
    id: 'e10', diff: 'easy', n: 10, title: 'Sum 1 to N', tags: ['accumulator'],
    story: 'Young Gauss did it in his head. You get a loop.',
    io: 'Input N. Print 1 + 2 + … + N.',
    sample: { in: '10', out: 'Sum = 55' },
    tests: [{ input: '10\n', nums: [55] }, { input: '1\n', nums: [1] }, { input: '100\n', nums: [5050] }],
    hints: ['int sum = 0; before the loop.', 'sum = sum + i; inside, print after.'],
    solution: S(`    int n, i, sum = 0;
    printf("N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        sum = sum + i;
    }
    printf("Sum = %d\\n", sum);`),
  },
  // ───────────── MEDIUM ─────────────
  {
    id: 'm1', diff: 'medium', n: 1, title: 'Times Table', tags: ['loop', 'formatting'],
    story: 'Print the multiplication table of N.',
    io: 'Input N. Print N x 1 = … through N x 10 = …, one per line.',
    sample: { in: '7', out: '7 x 1 = 7\n7 x 2 = 14\n…\n7 x 10 = 70' },
    tests: [{ input: '7\n', nums: [7, 14, 21, 28, 35, 42, 49, 56, 63, 70] }, { input: '3\n', nums: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30] }],
    hints: ['for (i = 1; i <= 10; i++)', 'printf("%d x %d = %d\\n", n, i, n * i);'],
    solution: S(`    int n, i;
    printf("N: ");
    scanf("%d", &n);
    for (i = 1; i <= 10; i++) {
        printf("%d x %d = %d\\n", n, i, n * i);
    }`),
  },
  {
    id: 'm2', diff: 'medium', n: 2, title: 'Factorial', tags: ['product', 'long long'],
    story: 'N! grows scary fast. int will not survive past 12!',
    io: 'Input N (0 to 20). Print N!.',
    sample: { in: '5', out: '5! = 120' },
    tests: [{ input: '5\n', nums: [120] }, { input: '0\n', nums: [1] }, { input: '10\n', nums: [3628800] }, { input: '15\n', nums: [1307674368000] }],
    hints: ['Products start at 1. 0! is 1.', 'Use long long f = 1; and print with %lld'],
    solution: S(`    int n, i;
    long long f = 1;
    printf("N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        f = f * i;
    }
    printf("%d! = %lld\\n", n, f);`),
  },
  {
    id: 'm3', diff: 'medium', n: 3, title: 'Workbook P7: Odd Sum', tags: ['workbook', 'step by 2'],
    story: 'Straight from your midterm workbook, Problem 7 — now in C.',
    io: 'Input a positive integer N. Print the sum of all odd numbers from 1 up to N (1 + 3 + 5 + … ≤ N).',
    sample: { in: '10', out: 'Sum = 25' },
    tests: [{ input: '10\n', nums: [25] }, { input: '7\n', nums: [16] }, { input: '1\n', nums: [1] }, { input: '15\n', nums: [64] }],
    hints: ['Start at 1 and step by 2: for (i = 1; i <= n; i += 2)'],
    solution: S(`    int n, i, sum = 0;
    printf("N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i += 2) {
        sum = sum + i;
    }
    printf("Sum = %d\\n", sum);`),
  },
  {
    id: 'm4', diff: 'medium', n: 4, title: 'Digit Sum', tags: ['while', '% 10', '/ 10'],
    story: 'Peel digits off a number one at a time.',
    io: 'Input a positive integer. Print the sum of its digits.',
    sample: { in: '1234', out: 'Digit sum = 10' },
    tests: [{ input: '1234\n', nums: [10] }, { input: '9\n', nums: [9] }, { input: '90817\n', nums: [25] }],
    hints: ['n % 10 is the last digit; n / 10 removes it.', 'while (n > 0) { sum += n % 10; n = n / 10; }'],
    solution: S(`    int n, sum = 0;
    printf("N: ");
    scanf("%d", &n);
    while (n > 0) {
        sum = sum + n % 10;
        n = n / 10;
    }
    printf("Digit sum = %d\\n", sum);`),
  },
  {
    id: 'm5', diff: 'medium', n: 5, title: 'Mirror Number', tags: ['while', 'build a number'],
    story: 'Reverse the digits: 1234 becomes 4321.',
    io: 'Input a positive integer. Print it reversed (leading zeros disappear: 1200 → 21).',
    sample: { in: '1234', out: 'Reversed = 4321' },
    tests: [{ input: '1234\n', nums: [4321] }, { input: '1200\n', nums: [21] }, { input: '7\n', nums: [7] }, { input: '908\n', nums: [809] }],
    hints: ['rev = rev * 10 + n % 10;', 'then n = n / 10; until n is 0'],
    solution: S(`    int n, rev = 0;
    printf("N: ");
    scanf("%d", &n);
    while (n > 0) {
        rev = rev * 10 + n % 10;
        n = n / 10;
    }
    printf("Reversed = %d\\n", rev);`),
  },
  {
    id: 'm6', diff: 'medium', n: 6, title: 'Validation Gate', tags: ['do-while', 'guard', 're-prompt'],
    story: 'This time, don\'t quit on bad input — ask again until it is valid.',
    io: 'Keep asking for N until it is a multiple of 4 AND greater than 20. Then print "Accepted: N".',
    sample: { in: '7\n12\n24', out: 'Accepted: 24' },
    tests: [{ input: '7\n12\n24\n', nums: [24], all: true }, { input: '28\n', nums: [28] }, { input: '-4\n0\n20\n21\n44\n', nums: [44], all: true }],
    hints: ['do { scanf(...); } while (INVALID condition);', 'Invalid: n % 4 != 0 || n <= 20'],
    solution: S(`    int n;
    do {
        printf("Enter a multiple of 4 greater than 20: ");
        scanf("%d", &n);
    } while (n % 4 != 0 || n <= 20);
    printf("Accepted: %d\\n", n);`),
  },
  {
    id: 'm7', diff: 'medium', n: 7, title: 'Workbook P2: Discriminant', tags: ['workbook', 'else-if', 'formula'],
    story: 'Your workbook\'s quadratic root classifier, as real code.',
    io: 'Input a, b, c of ax² + bx + c = 0. If a is 0 print "Not a quadratic". Otherwise compute D = b² − 4ac, print D, then "Two real roots" (D > 0), "One real root" (D = 0) or "No real roots" (D < 0).',
    sample: { in: '1 -3 2', out: 'D = 1.00\nTwo real roots' },
    tests: [
      { input: '1 -3 2\n', nums: [1], has: ['Two real roots'], not: ['One real', 'No real'] },
      { input: '1 2 1\n', nums: [0], has: ['One real root'], not: ['Two real', 'No real'] },
      { input: '1 0 4\n', nums: [-16], has: ['No real roots'], not: ['Two real', 'One real'] },
      { input: '0 2 3\n', has: ['Not a quadratic'], not: ['real root'] },
    ],
    hints: ['Check a == 0 first and stop there.', 'D = b * b - 4 * a * c;'],
    solution: S(`    double a, b, c, d;
    printf("Enter a, b, c: ");
    scanf("%lf %lf %lf", &a, &b, &c);
    if (a == 0) {
        printf("Not a quadratic\\n");
    } else {
        d = b * b - 4 * a * c;
        printf("D = %.2f\\n", d);
        if (d > 0) printf("Two real roots\\n");
        else if (d == 0) printf("One real root\\n");
        else printf("No real roots\\n");
    }`),
  },
  {
    id: 'm8', diff: 'medium', n: 8, title: 'Gift Box Wrapper', tags: ['surface area', 'face method'],
    story: 'How much wrapping paper does a box need? (No overlaps.)',
    io: 'Input length, width and height (decimals). Print the total surface area with 2 decimals.',
    sample: { in: '2 3 4', out: 'Surface area = 52.00' },
    tests: [{ input: '2 3 4\n', nums: [52] }, { input: '1 1 1\n', nums: [6] }, { input: '2.5 4 10\n', nums: [150] }],
    hints: ['A box has 6 rectangular faces, in 3 matching pairs.', 'SA = 2 * (l*w + l*h + w*h)'],
    solution: S(`    double l, w, h;
    printf("Enter l, w, h: ");
    scanf("%lf %lf %lf", &l, &w, &h);
    printf("Surface area = %.2f\\n", 2 * (l * w + l * h + w * h));`),
  },
  {
    id: 'm9', diff: 'medium', n: 9, title: 'Power Loop', tags: ['loop', 'product'],
    story: 'pow() is banned this round. Multiply it yourself.',
    io: 'Input an integer base and a non-negative integer exponent. Print base^exponent without using pow().',
    sample: { in: '2 10', out: 'Result = 1024' },
    tests: [{ input: '2 10\n', nums: [1024] }, { input: '5 0\n', nums: [1] }, { input: '3 4\n', nums: [81] }, { input: '-2 3\n', nums: [-8] }],
    hints: ['result starts at 1 (anything to the 0 is 1).', 'Multiply by base, exponent times.'],
    solution: S(`    int base, e, i;
    long long result = 1;
    printf("Base and exponent: ");
    scanf("%d %d", &base, &e);
    for (i = 1; i <= e; i++) {
        result = result * base;
    }
    printf("Result = %lld\\n", result);`),
  },
  {
    id: 'm10', diff: 'medium', n: 10, title: 'Star Stairs', tags: ['nested loops', 'pattern'],
    story: 'Your first nested loop: rows outside, stars inside.',
    io: 'Input N. Print a right triangle of stars with N rows (row i has i stars, no spaces).',
    sample: { in: '3', out: '*\n**\n***' },
    tests: [{ input: '3\n', block: '*\n**\n***', not: ['****'] }, { input: '5\n', block: '*\n**\n***\n****\n*****', not: ['******'] }],
    hints: ['Outer: for (i = 1; i <= n; i++)', 'Inner: for (j = 1; j <= i; j++) printf("*");  then printf("\\n");'],
    solution: S(`    int n, i, j;
    printf("N: ");
    scanf("%d", &n);
    printf("\\n");
    for (i = 1; i <= n; i++) {
        for (j = 1; j <= i; j++) {
            printf("*");
        }
        printf("\\n");
    }`),
  },
  // ───────────── HARD ─────────────
  {
    id: 'h1', diff: 'hard', n: 1, title: 'Prime Detector', tags: ['loop', 'flag', 'break'],
    story: 'A prime has exactly two divisors: 1 and itself.',
    io: 'Input N (N ≥ 2). Print PRIME or NOT PRIME.',
    sample: { in: '91', out: 'NOT PRIME' },
    tests: [{ input: '7\n', has: ['PRIME'], not: ['NOT'] }, { input: '9\n', has: ['NOT PRIME'] }, { input: '2\n', has: ['PRIME'], not: ['NOT'] }, { input: '97\n', has: ['PRIME'], not: ['NOT'] }, { input: '91\n', has: ['NOT PRIME'] }],
    hints: ['Try every divisor d from 2 to n - 1 (or while d * d <= n).', 'If n % d == 0, it is not prime — set a flag and break.'],
    solution: S(`    int n, d, prime = 1;
    printf("N: ");
    scanf("%d", &n);
    for (d = 2; d * d <= n; d++) {
        if (n % d == 0) {
            prime = 0;
            break;
        }
    }
    if (prime) printf("PRIME\\n");
    else printf("NOT PRIME\\n");`),
  },
  {
    id: 'h2', diff: 'hard', n: 2, title: 'Fibonacci Run', tags: ['loop', 'two trackers'],
    story: '0, 1, 1, 2, 3, 5, 8… each term is the sum of the two before it.',
    io: 'Input N. Print the first N Fibonacci terms starting from 0.',
    sample: { in: '7', out: '0 1 1 2 3 5 8' },
    tests: [{ input: '7\n', nums: [0, 1, 1, 2, 3, 5, 8] }, { input: '1\n', nums: [0] }, { input: '10\n', nums: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34] }],
    hints: ['Keep a = 0, b = 1.', 'Each round: print a; next = a + b; a = b; b = next;'],
    solution: S(`    int n, i, a = 0, b = 1, next;
    printf("N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        printf("%d ", a);
        next = a + b;
        a = b;
        b = next;
    }
    printf("\\n");`),
  },
  {
    id: 'h3', diff: 'hard', n: 3, title: 'Workbook P5: GCD & LCM', tags: ['workbook', 'Euclid', 'while'],
    story: 'Euclid\'s algorithm from your workbook: replace (a, b) with (b, a mod b) until b is 0.',
    io: 'Input two positive integers. Print their GCD, then their LCM.',
    sample: { in: '12 18', out: 'GCD = 6\nLCM = 36' },
    tests: [{ input: '12 18\n', nums: [6, 36] }, { input: '7 5\n', nums: [1, 35] }, { input: '100 75\n', nums: [25, 300] }],
    hints: ['while (b != 0) { r = a % b; a = b; b = r; }  → a is the GCD', 'LCM = (original a × original b) / GCD — save the originals first!'],
    solution: S(`    int a, b, x, y, r;
    printf("Enter two integers: ");
    scanf("%d %d", &a, &b);
    x = a;
    y = b;
    while (y != 0) {
        r = x % y;
        x = y;
        y = r;
    }
    printf("GCD = %d\\n", x);
    printf("LCM = %d\\n", a / x * b);`),
  },
  {
    id: 'h4', diff: 'hard', n: 4, title: 'Guarded Even Squares', tags: ['Problem 11 type', 'guard', 'series'],
    story: 'Exam-style: guard first, accumulate second.',
    io: 'Input N. N must be EVEN and GREATER than 4, otherwise print an error and stop. If valid, print 2² + 4² + 6² + … + N².',
    sample: { in: '6', out: 'Sum = 56' },
    tests: [{ input: '6\n', nums: [56] }, { input: '8\n', nums: [120] }, { input: '4\n', has: ['error'] }, { input: '7\n', has: ['error'] }, { input: '10\n', nums: [220] }],
    hints: ['Invalid: n % 2 != 0 || n <= 4', 'term = 2, step 2, add term * term'],
    solution: S(`    int n;
    printf("N: ");
    scanf("%d", &n);
    if (n % 2 != 0 || n <= 4) {
        printf("Error: N must be even and greater than 4\\n");
    } else {
        int sum = 0, term = 2;
        do {
            sum = sum + term * term;
            term = term + 2;
        } while (term <= n);
        printf("Sum = %d\\n", sum);
    }`),
  },
  {
    id: 'h5', diff: 'hard', n: 5, title: 'Harmonic Sum', tags: ['double accumulator', 'int-division trap'],
    story: '1 + 1/2 + 1/3 + … — where integer division silently ruins everything.',
    io: 'Input N (N ≥ 1). Print 1 + 1/2 + 1/3 + … + 1/N with 4 decimals.',
    sample: { in: '4', out: 'H = 2.0833' },
    tests: [{ input: '1\n', nums: [1] }, { input: '4\n', nums: [2.0833] }, { input: '10\n', nums: [2.929] }],
    hints: ['double h = 0;', '1 / i is integer division (0 for i > 1)! Write 1.0 / i'],
    solution: S(`    int n, i;
    double h = 0;
    printf("N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        h = h + 1.0 / i;
    }
    printf("H = %.4f\\n", h);`),
  },
  {
    id: 'h6', diff: 'hard', n: 6, title: 'Perfect Number', tags: ['divisors', 'accumulator'],
    story: '6 = 1 + 2 + 3. A perfect number equals the sum of its proper divisors.',
    io: 'Input N (N ≥ 2). Print PERFECT or NOT PERFECT.',
    sample: { in: '28', out: 'PERFECT' },
    tests: [{ input: '6\n', has: ['PERFECT'], not: ['NOT'] }, { input: '28\n', has: ['PERFECT'], not: ['NOT'] }, { input: '12\n', has: ['NOT PERFECT'] }, { input: '496\n', has: ['PERFECT'], not: ['NOT'] }, { input: '100\n', has: ['NOT PERFECT'] }],
    hints: ['Loop d from 1 to n - 1; if n % d == 0 add d.', 'Compare the sum with n at the end.'],
    solution: S(`    int n, d, sum = 0;
    printf("N: ");
    scanf("%d", &n);
    for (d = 1; d < n; d++) {
        if (n % d == 0) sum = sum + d;
    }
    if (sum == n) printf("PERFECT\\n");
    else printf("NOT PERFECT\\n");`),
  },
  {
    id: 'h7', diff: 'hard', n: 7, title: 'Floyd\'s Triangle', tags: ['nested loops', 'counter'],
    story: 'Row i has i numbers, counting up forever.',
    io: 'Input N. Print N rows: 1 / 2 3 / 4 5 6 / … with single spaces between numbers.',
    sample: { in: '3', out: '1\n2 3\n4 5 6' },
    tests: [{ input: '3\n', block: '1\n2 3\n4 5 6', not: ['7'] }, { input: '4\n', block: '1\n2 3\n4 5 6\n7 8 9 10', not: ['11'] }],
    hints: ['Keep a counter k = 1 outside both loops.', 'Inner loop prints k and does k++; newline after each row.'],
    solution: S(`    int n, i, j, k = 1;
    printf("N: ");
    scanf("%d", &n);
    printf("\\n");
    for (i = 1; i <= n; i++) {
        for (j = 1; j <= i; j++) {
            if (j > 1) printf(" ");
            printf("%d", k);
            k++;
        }
        printf("\\n");
    }`),
  },
  {
    id: 'h8', diff: 'hard', n: 8, title: 'Workbook P12: Stream Max', tags: ['workbook', 'max tracking', 'average'],
    story: 'Problem 12 from your workbook, scaled down: read values one by one, no arrays.',
    io: 'Input N, then N integers. Print the maximum, then the average of the OTHER values (excluding one copy of the max), 2 decimals.',
    sample: { in: '5\n3 9 4 1 7', out: 'Max = 9\nAverage = 3.75' },
    tests: [{ input: '5\n3 9 4 1 7\n', nums: [9, 3.75] }, { input: '3\n10 20 30\n', nums: [30, 15] }, { input: '4\n-5 -2 -9 -1\n', nums: [-1, -5.33] }],
    hints: ['Read the first value into max and total; then loop for the rest.', 'average = (double)(total - max) / (n - 1);'],
    solution: S(`    int n, i, x, max, total;
    printf("How many? ");
    scanf("%d", &n);
    scanf("%d", &x);
    max = x;
    total = x;
    for (i = 2; i <= n; i++) {
        scanf("%d", &x);
        total = total + x;
        if (x > max) max = x;
    }
    printf("Max = %d\\n", max);
    printf("Average = %.2f\\n", (double) (total - max) / (n - 1));`),
  },
  {
    id: 'h9', diff: 'hard', n: 9, title: 'Workbook P10: Fibonacci?', tags: ['workbook', 'generate & compare'],
    story: 'Workbook Problem 10: generate terms until you reach or pass N.',
    io: 'Input N ≥ 0. Print "N is a Fibonacci number" or "N is not a Fibonacci number".',
    sample: { in: '21', out: '21 is a Fibonacci number' },
    tests: [{ input: '21\n', has: ['is a Fibonacci'], not: ['not'] }, { input: '22\n', has: ['not a Fibonacci'] }, { input: '1\n', has: ['is a Fibonacci'], not: ['not'] }, { input: '0\n', has: ['is a Fibonacci'], not: ['not'] }, { input: '144\n', has: ['is a Fibonacci'], not: ['not'] }, { input: '100\n', has: ['not a Fibonacci'] }],
    hints: ['a = 0, b = 1; while (a < n) { next = a + b; a = b; b = next; }', 'After the loop, N is Fibonacci exactly when a == n.'],
    solution: S(`    int n, a = 0, b = 1, next;
    printf("N: ");
    scanf("%d", &n);
    while (a < n) {
        next = a + b;
        a = b;
        b = next;
    }
    if (a == n) printf("%d is a Fibonacci number\\n", n);
    else printf("%d is not a Fibonacci number\\n", n);`),
  },
  {
    id: 'h10', diff: 'hard', n: 10, title: 'Silo Surface Area', tags: ['Problem 1 type', 'composite solid'],
    story: 'A grain silo: a cone roof on a cylinder. Paint only what\'s outside.',
    io: 'Input r, H (cylinder height) and c (cone height). Print the total outside surface area (cone side + cylinder side + bottom) with 2 decimals. PI = 3.14159.',
    sample: { in: '3 10 4', out: 'SA = 263.89' },
    tests: [{ input: '3 10 4\n', nums: [263.89] }, { input: '1 1 1\n', nums: [13.87] }, { input: '5 0 12\n', nums: [282.74] }],
    hints: ['Cone slant l = sqrt(r*r + c*c); cone side = PI * r * l', 'Do NOT count the circle where the cone sits on the cylinder.'],
    solution: C`
#include <stdio.h>
#include <math.h>
#define PI 3.14159

int main() {
    double r, H, c, l, sa;
    printf("Enter r, H, c: ");
    scanf("%lf %lf %lf", &r, &H, &c);
    l = sqrt(r * r + c * c);
    sa = PI * r * l + 2 * PI * r * H + PI * r * r;
    printf("SA = %.2f\n", sa);
    return 0;
}
`,
  },
];

export const DIFFS = [
  { id: 'easy', label: 'Easy', face: '◕‿◕', color: 'var(--ok)', blurb: 'I/O, formulas, first decisions & loops' },
  { id: 'medium', label: 'Medium', face: '•̀ᴗ•́', color: 'var(--num)', blurb: 'loops with purpose, digits, validation' },
  { id: 'hard', label: 'Hard', face: 'ಠ_ಠ', color: 'var(--kw)', blurb: 'algorithms & full exam-type programs' },
] as const;
