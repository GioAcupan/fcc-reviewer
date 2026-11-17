import { C, Lesson, STARTER, STARTER_MATH, Unit } from './types';

export const UNITS: Unit[] = [
  { n: 0, title: 'Boot Up', tag: 'flowchart → C', color: 'var(--acc)' },
  { n: 1, title: 'Math Engine', tag: 'operators & formulas', color: 'var(--num)' },
  { n: 2, title: 'The Diamond', tag: 'decisions & guards', color: 'var(--kw)' },
  { n: 3, title: 'The Arrow Back', tag: 'loops & accumulators', color: 'var(--ty)' },
  { n: 4, title: 'Boss Fights', tag: 'exact exam problem types', color: 'var(--gold)' },
];

const HELLO = C`
#include <stdio.h>

int main() {
    printf("Hello, future passer!\n");
    return 0;
}
`;
const AGE = C`
#include <stdio.h>

int main() {
    int age;
    printf("Enter your age: ");
    scanf("%d", &age);
    age = age + 1;
    printf("Next year you will be %d\n", age);
    return 0;
}
`;
const BOXES = C`
#include <stdio.h>

int main() {
    int sum = 0, counter = 15;
    sum = sum + counter;
    counter = counter + 3;
    sum = sum + counter;
    counter = counter + 3;
    printf("sum = %d, counter = %d\n", sum, counter);
    return 0;
}
`;
const TWICE = C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter N: ");
    scanf("%d", &n);
    printf("Twice N is %d\n", n * 2);
    return 0;
}
`;
const TRAP = C`
#include <stdio.h>

int main() {
    int total = 7, count = 2;
    double bad = total / count;
    double good = (double) total / count;
    printf("bad  = %.2f\n", bad);
    printf("good = %.2f\n", good);
    return 0;
}
`;
const FRUSTUM = C`
#include <stdio.h>
#include <math.h>
#define PI 3.14159

int main() {
    double R, r, h, s, top, bottom, lateral, total;
    printf("Enter R, r and h: ");
    scanf("%lf %lf %lf", &R, &r, &h);
    s = sqrt(h * h + (R - r) * (R - r));
    top = PI * r * r;
    bottom = PI * R * R;
    lateral = PI * (R + r) * s;
    total = top + bottom + lateral;
    printf("Total Surface Area of the Frustum: %.2f\n", total);
    return 0;
}
`;
const EVENODD = C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter n: ");
    scanf("%d", &n);
    if (n % 2 == 0) {
        printf("EVEN\n");
    } else {
        printf("ODD\n");
    }
    return 0;
}
`;
const GRADES = C`
#include <stdio.h>

int main() {
    int score;
    printf("Score: ");
    scanf("%d", &score);
    if (score >= 90) {
        printf("A\n");
    } else if (score >= 80) {
        printf("B\n");
    } else if (score >= 70) {
        printf("C\n");
    } else {
        printf("F\n");
    }
    return 0;
}
`;
const GUARD = C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter N: ");
    scanf("%d", &n);
    if (n <= 15 || n % 3 != 0) {
        printf("Error: N must be a multiple of 3 greater than 15\n");
    } else {
        printf("Valid! N = %d\n", n);
    }
    return 0;
}
`;
const WHILE5 = C`
#include <stdio.h>

int main() {
    int i = 1;
    while (i <= 5) {
        printf("%d ", i);
        i = i + 1;
    }
    printf("\nDone!\n");
    return 0;
}
`;
const DOWHILE = C`
#include <stdio.h>

int main() {
    int counter = 15, sum = 0;
    do {
        sum = sum + counter;
        counter = counter + 3;
    } while (counter <= 24);
    printf("Sum = %d\n", sum);
    return 0;
}
`;
const FOR5 = C`
#include <stdio.h>

int main() {
    int i, sum = 0;
    for (i = 1; i <= 5; i++) {
        sum = sum + i;
    }
    printf("Sum = %d\n", sum);
    return 0;
}
`;
const SUMN = C`
#include <stdio.h>

int main() {
    int n, i, sum = 0;
    printf("Enter N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        sum = sum + i;
    }
    printf("Sum = %d\n", sum);
    return 0;
}
`;
export const P11 = C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter an integer N: ");
    scanf("%d", &n);
    if (n <= 15 || n % 3 != 0) {
        printf("Error: Must be a multiple of 3 > 15\n");
    } else {
        int sum = 0, counter = 15;
        do {
            sum = sum + counter;
            counter = counter + 3;
        } while (counter <= n);
        printf("Sum of multiples of 3 from 15 to %d is: %d\n", n, sum);
    }
    return 0;
}
`;

// Workbook Problem 6 — PLM Academic Honors (GWA) classifier
export const P6 = C`
#include <stdio.h>

int main() {
    double gwa, lowest;
    char *honor;
    printf("Enter GWA and lowest grade: ");
    scanf("%lf %lf", &gwa, &lowest);
    if (lowest > 2.50) {
        printf("Disqualified from Academic Honors (Grade below 2.50)\n");
    } else {
        if (gwa <= 1.20) {
            honor = "Summa Cum Laude";
        } else if (gwa <= 1.45) {
            honor = "Magna Cum Laude";
        } else if (gwa <= 1.75) {
            honor = "Cum Laude";
        } else {
            honor = "No Academic Honors";
        }
        printf("Academic Honor: %s\n", honor);
    }
    return 0;
}
`;
const P6_CHECKED = C`
#include <stdio.h>

int main() {
    double gwa, lowest;
    char *honor;
    printf("Enter GWA and lowest grade: ");
    scanf("%lf %lf", &gwa, &lowest);
    if (gwa < 1.00 || gwa > 5.00) {
        printf("Invalid GWA\n");
    } else if (lowest > 2.50) {
        printf("Disqualified from Academic Honors (Grade below 2.50)\n");
    } else {
        if (gwa <= 1.20) honor = "Summa Cum Laude";
        else if (gwa <= 1.45) honor = "Magna Cum Laude";
        else if (gwa <= 1.75) honor = "Cum Laude";
        else honor = "No Academic Honors";
        printf("Academic Honor: %s\n", honor);
    }
    return 0;
}
`;
const GWA_CALC = C`
#include <stdio.h>

int main() {
    int n, i;
    double grade, units, sumGU = 0, sumU = 0, worst = 0, gwa;
    char *honor;
    printf("Number of subjects: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        printf("Grade and units of subject %d: ", i);
        scanf("%lf %lf", &grade, &units);
        sumGU = sumGU + grade * units;
        sumU = sumU + units;
        if (grade > worst) worst = grade;
    }
    gwa = sumGU / sumU;
    printf("GWA = %.2f\n", gwa);
    if (worst > 2.50) {
        printf("Disqualified from Academic Honors (Grade below 2.50)\n");
    } else {
        if (gwa <= 1.20) honor = "Summa Cum Laude";
        else if (gwa <= 1.45) honor = "Magna Cum Laude";
        else if (gwa <= 1.75) honor = "Cum Laude";
        else honor = "No Academic Honors";
        printf("Academic Honor: %s\n", honor);
    }
    return 0;
}
`;
const SUMMA = { has: ['Summa Cum Laude'], not: ['Magna', 'No Academic', 'Disqualified', 'Invalid'] };
const MAGNA = { has: ['Magna Cum Laude'], not: ['Summa', 'No Academic', 'Disqualified', 'Invalid'] };
const CUM = { has: ['Cum Laude'], not: ['Summa', 'Magna', 'No Academic', 'Disqualified', 'Invalid'] };
const NONE = { has: ['No Academic Honors'], not: ['Cum Laude', 'Disqualified', 'Invalid'] };
const DISQ = { has: ['Disqualified'], not: ['Cum Laude', 'No Academic', 'Invalid'] };

export const LESSONS: Lesson[] = [
  // ───────────────────────── UNIT 0 ─────────────────────────
  {
    id: 'hello', unit: 0, title: 'Hello, Flowchart', sub: 'C is a flowchart written in text', icon: '▶',
    steps: [
      {
        t: 'read', title: 'You already speak flowchart', flow: true, code: HELLO,
        anno: { 1: 'toolbox for printf & scanf', 3: 'Start terminal: the program begins here', 4: 'Output parallelogram', 5: 'End terminal: "finished OK"' },
        body: `You spent the midterms drawing flowcharts. Here is the secret:

**A C program is just a flowchart written in text.** Every symbol you know has a C twin.

Look at the code and the flowchart under it — same program, two languages.`,
      },
      {
        t: 'link', title: 'Tap to connect', code: AGE,
        body: `Tap any **line of code** or any **flowchart symbol** — its twin lights up.

Notice how the prompt ~printf~ + ~scanf~ pair becomes ONE "Input" parallelogram, and ~age = age + 1~ is a process rectangle.`,
      },
      {
        t: 'quiz', title: 'Symbol check', q: 'Which flowchart symbol is a `printf(...)` statement?',
        opts: ['Rectangle (process)', 'Parallelogram (input / output)', 'Diamond (decision)', 'Hexagon (initialization)'], a: 1,
        why: '`printf` **displays** something — that is output, so it is a parallelogram. `scanf` (input) is a parallelogram too.',
      },
      {
        t: 'read', title: 'Anatomy of printf', code: C`
printf("Line one\n");
printf("Line two\n");
printf("Name:\tJuan\n");
`, anno: { 1: '\\n = press Enter (new line)', 3: '\\t = a tab space' },
        body: `- Text to display goes inside **double quotes** ~"..."~
- ~\\n~ moves to a new line. No ~\\n~, no new line!
- Every statement ends with a **semicolon** ~;~ — the #1 lost point on paper exams.`,
      },
      {
        t: 'quiz', title: 'Predict the output', code: C`
printf("Hi");
printf("There\n");
`, q: 'What appears on the screen?', opts: ['Hi, then There on the next line', 'HiThere', 'Hi There', '"Hi""There"'], a: 1,
        why: 'printf only goes to a new line when **you** write `\\n`. There is no `\\n` after Hi, so There continues on the same line: **HiThere**.',
      },
      {
        t: 'fill', title: 'Complete the skeleton', body: 'Every C program you write on the exam starts with this skeleton. Tap the tiles to fill the blanks.',
        code: C`
#include <[[stdio.h]]>

int [[main]]() {
    [[printf]]("I will pass FCC!\n")[[;]]
    return [[0]];
}
`, extra: ['math.h', 'start', 'print', ':', '1'],
        why: '`stdio.h` gives you printf/scanf, `main` is where execution starts, statements end with `;`, and `return 0;` means "ended normally".',
      },
      {
        t: 'order', title: 'Build it yourself', body: 'Tap the lines in the right order to build a working program.',
        lines: ['#include <stdio.h>', 'int main() {', 'printf("Ready for finals\\n");', 'return 0;', '}'],
      },
      {
        t: 'code', title: 'Your first program', starter: STARTER,
        body: `Write a program that prints exactly two lines:

~I am ready~
~for the FCC finals~

Press **Run** to test it yourself, then **Check** to submit.`,
        tests: [{ input: '', has: ['I am ready', 'for the FCC finals'] }],
        hints: ['Use two printf statements — or one printf with \\n in the middle.', 'printf("I am ready\\n");\nprintf("for the FCC finals\\n");'],
        solution: C`
#include <stdio.h>

int main() {
    printf("I am ready\n");
    printf("for the FCC finals\n");
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'types', unit: 0, title: 'Data Types: What Fits in the Box', sub: 'int, double, char, text — and why %d / %lf exist', icon: '⊞',
    steps: [
      {
        t: 'read', title: 'Every value has a type', code: C`
int count = 15;          // a whole number
double radius = 2.75;    // a decimal number
char grade = 'A';        // ONE character
char *name = "Juan";     // text (many characters)
`, anno: { 1: 'type → name → value' },
        body: `Every value in C has a **type**. Think of it as the *shape* of the box that holds it. The type decides three things:

1. **What fits**: whole numbers, decimals, one character, or text
2. **How math behaves**: 7 / 2 is 3 for ints but 3.5 for doubles
3. **Which ~%~ code** printf and scanf need

Almost every exam trap is a type mix-up, so let's get the boxes right first.`,
      },
      {
        t: 'sort', title: 'Type sorter', body: 'Tap the right box for each value. Watch out: some are traps.',
        cats: ['int', 'double', 'char', 'text|char *', 'long long'],
        items: [
          { t: '~15~', a: 0 },
          { t: '~2.75~', a: 1 },
          { t: "~'A'~", a: 2 },
          { t: '~"Juan"~', a: 3 },
          { t: '~3.0~', a: 1, why: 'It has a decimal point, so it is a double, even though the value is whole.' },
          { t: "~'7'~", a: 2, why: "Single quotes mean ONE character: '7' is the symbol 7, not the number seven." },
          { t: 'the number of students in a section', a: 0 },
          { t: 'the radius of a can, in cm', a: 1, why: 'Measurements can have decimals → double.' },
          { t: 'a GWA like 1.75', a: 1, why: 'Decimals → double.' },
          { t: 'a letter grade like B', a: 2 },
          { t: "a student's full name", a: 3, why: 'A name is many characters → text. A char holds only one.' },
          { t: '13! = 6,227,020,800', a: 4, why: 'An int only goes up to about 2.1 billion. Bigger whole numbers need long long.' },
        ],
      },
      {
        t: 'trace', title: 'Four boxes, four codes', code: C`
#include <stdio.h>

int main() {
    int count = 15;
    double radius = 2.75;
    char grade = 'A';
    char *name = "Juan";
    printf("%d students\n", count);
    printf("radius %.2f cm\n", radius);
    printf("grade %c\n", grade);
    printf("hello, %s!\n", name);
    return 0;
}
`,
        body: 'Watch the variable strip: each box shows its **type** in grey. Each printf uses the % code that matches that type.',
      },
      {
        t: 'read', title: 'Format codes come from types', code: C`
double price = 49.5;
printf("%d\n", price);     // ✗ garbage
printf("%f\n", price);     // ✓ 49.500000
printf("%.2f\n", price);   // ✓ 49.50
scanf("%lf", &price);      // ✓ %lf = double box
`, anno: { 2: 'reads the double as if it were an int', 5: 'scanf must know the exact box size' },
        body: `printf and scanf can't see your variable's type, so the ~%~ code **tells** them:

| Type | printf | scanf |
| ~int~ | ~%d~ | ~%d~ |
| ~long long~ | ~%lld~ | ~%lld~ |
| ~double~ | ~%f~ / ~%.2f~ | ~%lf~ |
| ~float~ | ~%f~ | ~%f~ |
| ~char~ | ~%c~ | ~" %c"~ |
| text | ~%s~ | ~%s~ |

**Why %lf only in scanf?** scanf writes INTO your box, so it needs the exact box size: ~%f~ is a 4-byte float, ~%lf~ an 8-byte double. printf only reads a copy, and C passes every float to it as a double, so ~%f~ works for both.`,
      },
      {
        t: 'quiz', title: 'Wrong code, wrong output', q: 'What does `printf("%d", 49.5);` print?',
        opts: ['49', '50', '49.5', 'A garbage number (like 1717986918)'], a: 3,
        why: 'printf does not convert anything: it reads the bits of the double **as if** they were an int, and you get nonsense. A compiler warns you; on paper, nobody does. Always match the code to the type.',
      },
      {
        t: 'trace', title: 'Boxes have limits', code: C`
#include <stdio.h>

int main() {
    int big = 2147483647;
    long long bigger = 2147483647;
    float f = 1.20;
    double d = 1.20;
    big = big + 1;
    bigger = bigger + 1;
    printf("int + 1:       %d\n", big);
    printf("long long + 1: %lld\n", bigger);
    printf("float  1.20 -> %.10f\n", f);
    printf("double 1.20 -> %.10f\n", d);
    return 0;
}
`,
        body: `Every box has a fixed size, so it has limits. Watch two of them break:

- ~int~ tops out at **2,147,483,647**. Add one and it wraps around to a huge negative number, with no error at all!
- ~float~ keeps only about 7 digits, so 1.20 is really stored as 1.2000000477. ~double~ keeps about 15.`,
      },
      {
        t: 'read', title: 'Pick the right box',
        body: `| Type | Size | Holds |
| ~char~ | 1 byte | one character |
| ~int~ | 4 bytes | whole numbers up to about ±2.1 billion |
| ~long long~ | 8 bytes | whole numbers up to about ±9.2 × 10¹⁸ |
| ~float~ | 4 bytes | decimals, about 7 digits |
| ~double~ | 8 bytes | decimals, about 15 digits |

Rules of thumb for the exam:

- counting, whole numbers, N → ~int~
- anything measured or averaged (lengths, areas, GWA, money) → ~double~
- factorials and other huge whole numbers → ~long long~
- one letter or symbol → ~char~; words → text (~char *~)`,
      },
      {
        t: 'trace', title: 'When types mix', code: C`
#include <stdio.h>

int main() {
    int chopped = 3.99;
    int half = 7 / 2;
    double real = 7.0 / 2;
    char letter = 'A';
    letter = letter + 1;
    printf("%d %d %.1f %c %d\n", chopped, half, real, letter, letter);
    return 0;
}
`,
        body: `Three silent conversions that cost exam points:

- Storing a decimal in an ~int~ **chops** it: 3.99 → 3 (no rounding!)
- ~int / int~ stays an int: 7 / 2 → 3. Make one side a double: 7.0 / 2 → 3.5
- A ~char~ is secretly a small number: 'A' is 65, so 'A' + 1 is 'B'`,
      },
      {
        t: 'quiz', title: 'Chopped area', code: C`
int area;
area = 3.14159 * 2 * 2;
`, q: 'What ends up in `area`?', opts: ['12.56636', '12', '13', 'Compile error'], a: 1,
        why: '`area` is an int box, so C chops the decimal part: 12.56636 → **12**. Declare `double area;` instead. Areas, averages and measurements are always double.',
      },
      {
        t: 'quiz', title: 'Words need text', q: 'Which line stores the word Juan correctly?',
        opts: [`char name = 'Juan';`, `char name = "Juan";`, `char *name = "Juan";`, `int name = "Juan";`], a: 2,
        why: 'A `char` holds ONE character, and single quotes are for one character only. Text (many characters) uses `char *name = "Juan";` (or a char array).',
      },
      {
        t: 'fill', title: 'Match the codes', body: 'Pick the % code that matches each box.',
        code: C`
int students = 42;
double gwa = 1.75;
char section = 'B';
char *name = "Juan";
printf("%[[d|i]] students\n", students);
printf("GWA: %[[.2f|f]]\n", gwa);
printf("Section %[[c]]\n", section);
printf("Name: %[[s]]\n", name);
scanf("%[[lf]]", &gwa);
`, extra: ['int', 'str', 'ch'],
        why: 'int → `%d`, double → `%f` / `%.2f` (but `%lf` when scanf reads it), char → `%c`, text → `%s`.',
      },
      {
        t: 'code', title: 'Fix the type bugs',
        starter: C`
#include <stdio.h>

int main() {
    int price = 49.75;
    int count = 3;
    char name = "Shirt";
    printf("%d x %s = %d\n", count, name, price * count);
    return 0;
}
`,
        body: 'This receipt program has **three type bugs**. Fix them so it prints:\n\n~3 x Shirt = 149.25~\n\nRun it first and read what the compiler and the output tell you.',
        tests: [{ input: '', nums: [3, 149.25], has: ['Shirt'] }],
        hints: ['49.75 has decimals, so price needs a double box.', 'Text needs  char *name = "Shirt";', 'price * count is now a double, so print it with %.2f'],
        solution: C`
#include <stdio.h>

int main() {
    double price = 49.75;
    int count = 3;
    char *name = "Shirt";
    printf("%d x %s = %.2f\n", count, name, price * count);
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'vars', unit: 0, title: 'Named Boxes', sub: 'declare, =, initialize vs process', icon: '▣',
    steps: [
      {
        t: 'read', title: 'Boxes, now with names', code: C`
int count;           // declare: an int box named count
count = 15;          // assign: put 15 inside
double r = 2.5;      // declare + first value in one line
`, anno: { 1: 'type, then name', 2: '= stores a value', 3: 'initialization' },
        body: `You know the box **types**. Now let's use the boxes:

- **Declare** each box once: its type, then its name.
- **Assign** with ~=~: put a value inside, replacing the old one.
- Declare **before** you use it: on paper and in C.`,
      },
      {
        t: 'read', title: 'Hexagon vs rectangle', flow: true, code: BOXES,
        anno: { 4: 'declare + give first value = Initialization (hexagon)', 5: 'change a value = Process (rectangle)' },
        body: `Giving a box its **first** value is *initialization* — the hexagon in your workbook (~Initialize: Sum = 0, Counter = 15~).

Changing it later is a *process* — a rectangle.`,
      },
      {
        t: 'trace', title: 'Watch the boxes change', code: BOXES,
        body: 'Press ▶. Watch `sum` and `counter` in the variable strip. This is literally the body of the Problem 11 loop, run twice.',
      },
      {
        t: 'quiz', title: 'The meaning of =', q: 'In C, `sum = sum + counter;` means…',
        opts: ['"sum is equal to sum + counter" (a comparison)', 'compute sum + counter, then STORE it into sum', 'an error, because sum cannot equal itself plus something', 'counter becomes sum'], a: 1,
        why: '`=` is **assignment**: evaluate the right side, then store the result in the box on the left. Comparison uses `==`.',
      },
      {
        t: 'read', title: 'Printing variables', code: C`
int age = 18;
double gpa = 1.75;
char section = 'B';
printf("Age: %d\n", age);
printf("GPA: %.2f\n", gpa);
printf("Section %c, age %d\n", section, age);
`, anno: { 4: '%d is replaced by age', 5: '%.2f = double with 2 decimals', 6: 'placeholders are filled left → right' },
        body: `Placeholders inside the quotes get replaced by values listed after the comma:

- ~%d~ → int
- ~%f~ → double (6 decimals), ~%.2f~ → 2 decimals
- ~%c~ → char`,
      },
      {
        t: 'quiz', title: 'Predict the output', code: C`
double x = 3.14159;
printf("%.2f", x);
`, q: 'What is printed?', opts: ['3.14159', '3.14', '3.1', '3'], a: 1, why: '`%.2f` rounds to **2 decimal places**: 3.14.',
      },
      {
        t: 'fill', title: 'Pick the placeholders', body: 'Choose the right placeholder for each variable.',
        code: C`
int items = 3;
double price = 49.5;
printf("Items: %[[d]]\n", items);
printf("Price: %[[.2f|f]]\n", price);
`, extra: ['c', 's', '.2d'],
        why: 'int → `%d`, double → `%f` or `%.2f`.',
      },
      {
        t: 'code', title: 'Rectangle report',
        starter: ['#include <stdio.h>', '', 'int main() {', '    int length = 7, width = 3;', '    int area;', '    ', '    return 0;', '}', ''].join('\n'),
        body: 'Compute the area of the rectangle into the variable ~area~, then print it like: ~Area = 21~',
        tests: [{ input: '', nums: [21], has: ['Area'] }],
        hints: ['area = length * width;', 'printf("Area = %d\\n", area);'],
        solution: C`
#include <stdio.h>

int main() {
    int length = 7, width = 3;
    int area;
    area = length * width;
    printf("Area = %d\n", area);
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'input', unit: 0, title: 'Input & the & Sign', sub: 'scanf, prompts, %lf', icon: '⌨',
    steps: [
      {
        t: 'read', title: 'The input parallelogram', flow: true, code: TWICE,
        anno: { 5: 'prompt: tell the user what to type', 6: 'read a number INTO n', 7: 'output' },
        body: `In a flowchart, ~Input N~ is one parallelogram. In C it is usually **two lines**: a ~printf~ prompt, then ~scanf~.

The ~&~ means *"the address of n"* — scanf needs to know **where** to store the number.`,
      },
      { t: 'trace', title: 'Watch scanf fill the box', code: TWICE, stdin: '21', body: 'The input `21` is typed by the user. Watch `n` change from `?` (garbage) to 21.' },
      {
        t: 'quiz', title: 'Spot the crash', code: C`
int n;
scanf("%d", n);
`, q: 'Why does this crash the program?', opts: ['%d is wrong for int', 'Missing & — scanf needs the ADDRESS of n', 'n must be a double', 'Missing \\n in the format'], a: 1,
        why: 'Without `&`, scanf receives the garbage *value* inside n and tries to write there → crash. Always `scanf("%d", &n);`',
      },
      {
        t: 'read', title: 'The %lf rule',
        body: `Remember from Data Types: scanf writes **into** your box, so it needs the box's exact size. That's why a double is read with ~%lf~ but printed with ~%f~.

| Type | scanf | printf |
| ~int~ | ~%d~ | ~%d~ |
| ~double~ | ~%lf~ | ~%f~ or ~%.2f~ |
| ~float~ | ~%f~ | ~%f~ |
| ~char~ | ~" %c"~ | ~%c~ |

Reading several values at once: ~scanf("%lf %lf %lf", &R, &r, &h);~ — the user separates them with spaces or Enter.

> Try it in the Playground: delete an ~&~ and see what the compiler tells you.`,
      },
      {
        t: 'fill', title: 'Read a radius', body: 'Read a double radius, then print the diameter with 2 decimals.',
        code: C`
double r;
printf("Enter radius: ");
scanf("[[%lf]]", [[&]]r);
printf("Diameter: [[%.2f|%f]]\n", 2 * r);
`, extra: ['%d', '*', '%c', '#'],
        why: 'scanf reads a double with `%lf` and needs `&r`; printf shows doubles with `%f` / `%.2f`.',
      },
      {
        t: 'code', title: 'Sum of two', starter: STARTER,
        body: 'Read **two integers** and print their sum. Example: input ~4 9~ → output contains ~13~.',
        tests: [{ input: '4 9\n', nums: [13] }, { input: '-5 12\n', nums: [7] }, { input: '100 250\n', nums: [350] }],
        hints: ['Declare two int variables: int a, b;', 'scanf("%d %d", &a, &b);', 'printf("Sum = %d\\n", a + b);'],
        solution: C`
#include <stdio.h>

int main() {
    int a, b;
    printf("Enter two integers: ");
    scanf("%d %d", &a, &b);
    printf("Sum = %d\n", a + b);
    return 0;
}
`,
      },
      {
        t: 'code', title: 'Diameter', starter: STARTER,
        body: 'Read a radius ~r~ (a **double**) and print the diameter with 2 decimals.',
        tests: [{ input: '2.5\n', nums: [5] }, { input: '10\n', nums: [20] }, { input: '0.25\n', nums: [0.5] }],
        hints: ['double r;  and  scanf("%lf", &r);', 'printf("Diameter = %.2f\\n", 2 * r);'],
        solution: C`
#include <stdio.h>

int main() {
    double r;
    printf("Enter radius: ");
    scanf("%lf", &r);
    printf("Diameter = %.2f\n", 2 * r);
    return 0;
}
`,
      },
    ],
  },
  // ───────────────────────── UNIT 1 ─────────────────────────
  {
    id: 'ops', unit: 1, title: 'Operators & the Integer Trap', sub: '+ − * / %, precedence, int division', icon: '÷',
    steps: [
      {
        t: 'read', title: 'Flowchart math → C math',
        body: `| Flowchart / math | C |
| a × b | ~a * b~ |
| a ÷ b | ~a / b~ |
| N mod 3 | ~n % 3~ |
| x² | ~x * x~ or ~pow(x, 2)~ |
| N ≤ 15 | ~n <= 15~ |
| N ≥ 15 | ~n >= 15~ |
| N ≠ 0 | ~n != 0~ |
| N = 0 (compare) | ~n == 0~ |

~*~ ~/~ ~%~ happen before ~+~ ~-~ (like PEMDAS). When unsure, add parentheses.`,
      },
      { t: 'quiz', title: 'Integer division', q: 'In C, what is `7 / 2`?', opts: ['3.5', '3', '4', 'Error'], a: 1, why: '**int ÷ int = int.** C chops off (truncates) the decimal part, so 7 / 2 is 3. Use `7.0 / 2` to get 3.5.' },
      { t: 'quiz', title: 'Remainder', q: '`17 % 5` is…', opts: ['3', '2', '3.4', '0'], a: 1, why: '`%` gives the **remainder**: 17 = 5 × 3 + **2**.' },
      { t: 'trace', title: 'The integer trap', code: TRAP, body: 'Both lines "divide 7 by 2"… Watch `bad` vs `good`. In `bad`, the division happens between two ints **before** the result is stored as a double.' },
      {
        t: 'read', title: '% superpowers', code: C`
if (n % 2 == 0)   // n is even
if (n % 3 == 0)   // n is a multiple of 3
last = n % 10;    // last digit of n
n = n / 10;       // remove the last digit
`,
        body: `The remainder operator answers "is it divisible?" questions:

> This is the exact test in Problem 11: "N mod 3 = 0" becomes ~n % 3 == 0~.`,
      },
      {
        t: 'quiz', title: 'Multiples', q: 'Which C expression means "N is a multiple of 4"?',
        opts: ['n / 4 == 0', 'n % 4 == 0', 'n % 4 = 0', 'n * 4 == 0'], a: 1,
        why: 'Remainder 0 means divisible. `n % 4 = 0` is wrong — a single `=` assigns instead of compares.',
      },
      {
        t: 'fill', title: 'Translate the boxes', body: 'Each comment is flowchart text. Write the C version.',
        code: C`
// Is N mod 5 = 0?
if (n [[%]] 5 [[==]] 0)
// area = ½ × b × h
area = [[0.5|1.0/2|.5]] * b * h;
`, extra: ['/', '=', '1/2', 'mod'],
        why: '`mod` → `%`, comparing → `==`. And **never** write `1/2` in C — it is integer division and equals **0**.',
      },
      {
        t: 'code', title: 'Minutes converter', starter: STARTER,
        body: 'Read a total number of minutes (int) and print the hours and remaining minutes.\n\nExample: ~135~ → ~2 hours and 15 minutes~',
        tests: [{ input: '135\n', nums: [2, 15] }, { input: '59\n', nums: [0, 59] }, { input: '600\n', nums: [10, 0] }],
        hints: ['hours = total / 60;  (integer division)', 'minutes = total % 60;  (remainder)', 'printf("%d hours and %d minutes\\n", hours, minutes);'],
        solution: C`
#include <stdio.h>

int main() {
    int total, hours, minutes;
    printf("Enter minutes: ");
    scanf("%d", &total);
    hours = total / 60;
    minutes = total % 60;
    printf("%d hours and %d minutes\n", hours, minutes);
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'formulas', unit: 1, title: 'Formulas → C', sub: 'math.h, pow, sqrt, PI', icon: '√',
    steps: [
      {
        t: 'read', title: 'Translating formulas',
        body: `| Math | C |
| πr² | ~PI * r * r~ |
| √(x) | ~sqrt(x)~ |
| xⁿ | ~pow(x, n)~ |
| ½bh | ~0.5 * b * h~ |
| (R + r)s | ~(R + r) * s~ — never skip the ~*~! |

Setup lines at the top:
~#include <math.h>~ for sqrt/pow, and ~#define PI 3.14159~ (or use ~M_PI~).

> Never write ~r^2~ — in C, ~^~ is XOR, not power. Never write ~1/2~ — it is 0.`,
      },
      { t: 'quiz', title: 'Powers', q: 'Which line correctly computes r²?', opts: ['r^2', 'r**2', 'pow(r, 2)', '2r'], a: 2, why: '`pow(r, 2)` (needs `<math.h>`) or simply `r * r`. `^` is bitwise XOR and `**` does not exist in C.' },
      { t: 'quiz', title: 'Spot the bug', code: 'area = 1/2 * b * h;', q: 'Even with b and h as doubles, area is always 0. Why?', opts: ['Nothing is wrong', '1/2 is integer division → 0', 'Needs parentheses around b * h', 'area must be an int'], a: 1, why: '`1/2` is computed first, between two ints: 0. Then 0 × b × h = 0. Write `0.5 * b * h`.' },
      {
        t: 'read', title: 'Workbook Problem 1, in C', flow: true, code: FRUSTUM,
        anno: { 9: 'hidden length via Pythagoras', 13: 'add every face' },
        body: 'This is **Problem 1 (Frustum)** from your workbook. Compare it with the flowchart you drew: every formula box became one assignment line. Tap around — this is the shape of every surface-area problem.',
      },
      {
        t: 'fill', title: 'Fill the formulas', body: 'Complete the key lines of the frustum program.',
        code: C`
s = [[sqrt]](h * h + (R - r) * (R - r));
top = PI * [[r * r|pow(r, 2)|pow(r,2)]];
lateral = PI * (R + r) [[*]] s;
total = top + bottom [[+]] lateral;
`, extra: ['^', 'r^2', 'root', '2r'],
      },
      {
        t: 'order', title: 'Assemble Problem 1', given: 3, body: 'The headers are placed. Put the rest of the frustum program in order: declare → input → hidden length → total → display.',
        lines: ['#include <stdio.h>', '#include <math.h>', '#define PI 3.14159', 'int main() {', 'double R, r, h, s, total;', 'scanf("%lf %lf %lf", &R, &r, &h);', 's = sqrt(h * h + (R - r) * (R - r));', 'total = PI * r * r + PI * R * R + PI * (R + r) * s;', 'printf("Total SA = %.2f\\n", total);', 'return 0;', '}'],
      },
      {
        t: 'code', title: 'Hypotenuse', starter: STARTER_MATH,
        body: 'Read the two legs ~a~ and ~b~ of a right triangle (decimals). Print the hypotenuse c = √(a² + b²) with 2 decimals.',
        tests: [{ input: '3 4\n', nums: [5] }, { input: '5 12\n', nums: [13] }, { input: '1.5 2\n', nums: [2.5] }],
        hints: ['double a, b, c;', 'scanf("%lf %lf", &a, &b);', 'c = sqrt(a * a + b * b);'],
        solution: C`
#include <stdio.h>
#include <math.h>

int main() {
    double a, b, c;
    printf("Enter legs a and b: ");
    scanf("%lf %lf", &a, &b);
    c = sqrt(a * a + b * b);
    printf("Hypotenuse = %.2f\n", c);
    return 0;
}
`,
      },
    ],
  },
  // ───────────────────────── UNIT 2 ─────────────────────────
  {
    id: 'ifelse', unit: 2, title: 'The Diamond: if / else', sub: 'decisions, Yes → right, No → down', icon: '◆',
    steps: [
      {
        t: 'read', title: 'Diamond = if', flow: true, code: EVENODD,
        anno: { 7: 'the diamond’s question', 8: 'Yes branch', 10: 'No branch (else)' },
        body: `A decision diamond asks a yes/no question. In C, the question goes inside ~if ( )~.

**Yes** runs the first ~{ }~ block. **No** runs the ~else~ block. Your workbook draws *Yes → right, No → down* — so does this app.`,
      },
      { t: 'trace', title: 'Follow the branch', code: EVENODD, stdin: '7', body: 'Run with n = 7. Watch which side of the diamond lights up.' },
      {
        t: 'quiz', title: 'The classic mistake', code: C`
if (x = 5) {
    printf("five");
}
`, q: 'What does this actually do?', opts: ['Checks if x is 5', 'Stores 5 into x, and the condition is always true', 'Syntax error', 'Checks if x is not 5'], a: 1,
        why: 'A single `=` **assigns**. `x = 5` stores 5, and the value 5 counts as "true". To compare, use `==`.',
      },
      {
        t: 'read', title: 'The else-if ladder', flow: true, code: GRADES,
        body: 'Several diamonds in a row = an ~else if~ ladder. C checks from top to bottom and runs **only the first** branch whose answer is Yes.',
      },
      { t: 'trace', title: 'Climb the ladder', code: GRADES, stdin: '84', body: 'Score 84: watch C test ≥ 90 (No), then ≥ 80 (Yes) — and skip everything else.' },
      { t: 'quiz', title: 'How many?', q: 'Using the ladder above with score = 95, how many letters are printed?', opts: ['1 (only A)', '2 (A and B)', '3', '0'], a: 0, why: 'Once a branch runs, the rest of the ladder is skipped. 95 ≥ 90 → A, done.' },
      {
        t: 'fill', title: 'Thermostat logic', body: 'Print HOT above 30, COLD below 15, otherwise NICE.',
        code: C`
if (temp [[>]] 30) {
    printf("HOT\n");
} [[else if]] (temp < 15) {
    printf("COLD\n");
} [[else]] {
    printf("NICE\n");
}
`, extra: ['>=', 'if', 'elif', 'otherwise'],
      },
      {
        t: 'code', title: 'Thermostat', starter: STARTER,
        body: 'Read an integer temperature. Print ~HOT~ if it is above 30, ~COLD~ if below 15, otherwise ~NICE~.',
        tests: [
          { input: '35\n', has: ['HOT'], not: ['COLD', 'NICE'] }, { input: '10\n', has: ['COLD'], not: ['HOT', 'NICE'] },
          { input: '22\n', has: ['NICE'], not: ['HOT', 'COLD'] }, { input: '30\n', has: ['NICE'], not: ['HOT'] }, { input: '15\n', has: ['NICE'], not: ['COLD'] },
        ],
        hints: ['int temp; scanf("%d", &temp);', 'if (temp > 30) { ... } else if (temp < 15) { ... } else { ... }'],
        solution: C`
#include <stdio.h>

int main() {
    int temp;
    printf("Temperature: ");
    scanf("%d", &temp);
    if (temp > 30) {
        printf("HOT\n");
    } else if (temp < 15) {
        printf("COLD\n");
    } else {
        printf("NICE\n");
    }
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'logic', unit: 2, title: 'and / or / not: Guards', sub: 'compound conditions, flipping', icon: '&&',
    steps: [
      {
        t: 'read', title: 'Combining questions',
        body: `- **and** → ~&&~ : true only if **both** parts are true
- **or** → ~||~ : true if **at least one** part is true
- **not** → ~!~ : flips true ↔ false

"N is a multiple of 3 **and** greater than 15" becomes:
~n % 3 == 0 && n > 15~`,
      },
      {
        t: 'quiz', title: 'Translate', q: 'Which means "n is a multiple of 5 and greater than 20"?',
        opts: ['n % 5 == 0 || n > 20', 'n % 5 == 0 && n > 20', 'n / 5 == 0 && n > 20', 'n % 5 && n > 20'], a: 1,
        why: '"and" → `&&`, "multiple of 5" → `n % 5 == 0`. Option 4 is a trap: `n % 5` alone is true when n is NOT a multiple.',
      },
      {
        t: 'read', title: 'Flip the guard', code: C`
// VALID input:
if (n > 15 && n % 3 == 0)

// INVALID input (Problem 11's diamond):
if (n <= 15 || n % 3 != 0)
`,
        body: `Problem 11's diamond asks the **error** question: "Is N ≤ 15 or N mod 3 ≠ 0?" — the exact opposite of "valid".

To flip a condition: **negate each part** and **swap && ↔ ||**.

> Lazy-safe version that always works: ~if (!(n > 15 && n % 3 == 0))~`,
      },
      {
        t: 'quiz', title: 'Flip it', q: 'Rule: "N must be EVEN and at least 10." Which condition detects INVALID input?',
        opts: ['n % 2 == 0 && n >= 10', 'n % 2 != 0 || n < 10', 'n % 2 != 0 && n < 10', 'n % 2 == 1 || n <= 10'], a: 1,
        why: 'Negate each part (even → odd, ≥ 10 → < 10) and swap `&&` → `||`. Option 4 wrongly rejects n = 10, which is valid.',
      },
      {
        t: 'fill', title: 'Write the error guard', body: 'Rule: "N must be a multiple of 7 and greater than 21." Complete the **error** check.',
        code: C`
if (n [[<=]] 21 [[||]] n % 7 [[!=]] 0) {
    printf("Error: invalid input\n");
}
`, extra: ['<', '&&', '==', '>='],
        why: 'Not greater than 21 → `n <= 21`. Not a multiple of 7 → `n % 7 != 0`. Either one is enough to fail → `||`.',
      },
      { t: 'trace', title: 'Guard in action', code: GUARD, stdin: '20', body: 'N = 20: it is > 15 but 20 mod 3 = 2. Watch the guard catch it.' },
      {
        t: 'code', title: 'Gatekeeper', starter: STARTER,
        body: 'Read N. If N is a multiple of 4 **and** greater than 12, print ~VALID~. Otherwise print ~ERROR~.',
        tests: [
          { input: '16\n', has: ['VALID'], not: ['ERROR'] }, { input: '12\n', has: ['ERROR'] }, { input: '18\n', has: ['ERROR'] },
          { input: '40\n', has: ['VALID'], not: ['ERROR'] }, { input: '8\n', has: ['ERROR'] },
        ],
        hints: ['Valid means: n % 4 == 0 && n > 12', 'if (n % 4 == 0 && n > 12) printf("VALID\\n"); else printf("ERROR\\n");'],
        solution: C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter N: ");
    scanf("%d", &n);
    if (n % 4 == 0 && n > 12) {
        printf("VALID\n");
    } else {
        printf("ERROR\n");
    }
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'gwa', unit: 2, mini: true, title: 'Mini-Boss: Latin Honors (GWA)', sub: 'Workbook Problem 6 — guard + ladder + text', icon: '♛',
    steps: [
      {
        t: 'read', title: 'Workbook Problem 6, in C', flow: true, code: P6,
        anno: { 5: 'a variable that holds TEXT', 8: 'GUARD: the disqualification diamond', 11: 'LADDER: strictest bound first', 20: 'display once, after the ladder' },
        body: `Problem 6 checks PLM Latin honors. It is made of two things you already know:

**Guard**: if any grade is worse than 2.50, the student is disqualified.
**Ladder**: three diamonds pick the honor from the GWA.

> PLM grades run **backwards**: 1.00 is the best and 5.00 is failing. So "GWA ≤ 1.20" is the TOP range, and the "lowest grade" is the numerically **biggest** one (like a 2.75).`,
      },
      { t: 'trace', title: 'Run it: GWA 1.32', code: P6, stdin: '1.32 2.25', body: 'GWA 1.32, worst subject 2.25. Not disqualified → fails ≤ 1.20 → passes ≤ 1.45 → **Magna Cum Laude**. Watch `honor` turn into text.' },
      {
        t: 'quiz', title: 'Order matters', code: C`
if (gwa <= 1.75) honor = "Cum Laude";
else if (gwa <= 1.45) honor = "Magna Cum Laude";
else if (gwa <= 1.20) honor = "Summa Cum Laude";
`, q: 'Someone wrote the ladder in this order. A student with GWA **1.10** gets…', opts: ['Summa Cum Laude', 'Cum Laude', 'Magna Cum Laude', 'No honors'], a: 1,
        why: '1.10 ≤ 1.75 is already true at the FIRST diamond, so the ladder stops there. With ≤ ladders, test the **smallest** bound first: 1.20 → 1.45 → 1.75.',
      },
      {
        t: 'quiz', title: 'Boundary check', q: 'A student\'s lowest grade is exactly **2.50**. Are they disqualified?',
        opts: ['Yes, 2.50 is too low', 'No: the rule is > 2.50, and 2.50 > 2.50 is false', 'Only if their GWA is above 1.75', 'It depends on the units'], a: 1,
        why: 'The diamond asks "Is LowestGrade > 2.50?". For exactly 2.50 the answer is **No**, so they continue to the ladder. Exams (and test cases) love boundary values: 1.20, 1.45, 1.75 and 2.50 all matter.',
      },
      {
        t: 'read', title: 'Text in a variable', code: C`
char honor;                 // ✗ holds ONE character
char honor[30];
honor = "Cum Laude";        // ✗ arrays can't be assigned with =

char *honor;                // ✓ points to text
honor = "Cum Laude";        // ✓
printf("%s\n", honor);      // %s prints text
`, anno: { 1: 'one letter only', 3: 'compile error', 5: 'the easy way' },
        body: `The flowchart says ~Honor = "Summa Cum Laude"~. That's easy on paper, but C is picky about text:

- ~char honor;~ holds a single character, not a word.
- An array like ~char honor[30];~ can't be assigned with ~=~ (you'd need ~strcpy~ from ~<string.h>~).
- Easiest: ~char *honor;~, then ~honor = "...";~, and print it with ~%s~.

> Also fine on paper: skip the variable and ~printf~ the honor inside each branch.`,
      },
      {
        t: 'quiz', title: 'The float trap', code: C`
float gwa;
scanf("%f", &gwa);        // user types 1.20
if (gwa <= 1.20) printf("Summa");
else printf("Magna");
`, q: 'The user types exactly **1.20**. What prints?', opts: ['Summa', 'Magna', 'Nothing', 'Error'], a: 1,
        why: 'A `float` cannot store 1.20 exactly. It holds 1.2000000477, while the `1.20` written in the code is a more precise `double` (1.19999999…). So 1.2000000477 ≤ 1.2 is **false** → Magna! Use `double` with `%lf` and the boundary works. (Try it in the Playground.)',
      },
      {
        t: 'fill', title: 'Build the ladder', body: 'Complete the guard, the ladder, and the final display.',
        code: C`
if (lowest [[>]] 2.50) {
    printf("Disqualified\n");
} else {
    if (gwa [[<=]] 1.20) {
        honor = "Summa Cum Laude";
    } [[else if]] (gwa <= 1.45) {
        honor = "Magna Cum Laude";
    } else if (gwa <= [[1.75]]) {
        honor = "Cum Laude";
    } [[else]] {
        honor = "No Academic Honors";
    }
    printf("Academic Honor: [[%s]]\n", honor);
}
`, extra: ['>=', '<', '1.45', 'if', '%c', '%d'],
        why: 'Disqualified only when the lowest grade is **above** 2.50 (`>`), the ladder uses `<=` with the smallest bound first, and text prints with `%s`.',
      },
      {
        t: 'code', title: 'Problem 6, from the flowchart', blueprint: true, starter: STARTER,
        body: 'Use the blueprint flowchart. Input the **GWA** and the **lowest grade** (decimals). If the lowest grade is above 2.50, display a disqualification message. Otherwise display ~Academic Honor:~ followed by **Summa Cum Laude** (≤ 1.20), **Magna Cum Laude** (≤ 1.45), **Cum Laude** (≤ 1.75) or **No Academic Honors**.\n\nThe hidden tests include the exact boundaries 1.20, 1.45, 1.75 and 2.50.',
        tests: [
          { input: '1.10 1.75\n', ...SUMMA }, { input: '1.20 2.00\n', ...SUMMA }, { input: '1.45 2.50\n', ...MAGNA },
          { input: '1.60 2.25\n', ...CUM }, { input: '1.75 1.50\n', ...CUM }, { input: '1.90 2.00\n', ...NONE }, { input: '1.15 2.75\n', ...DISQ },
        ],
        hints: ['double gwa, lowest;  then  scanf("%lf %lf", &gwa, &lowest);  (double, not float!)', 'Guard first: if (lowest > 2.50) { ... } else { the ladder }', 'char *honor;  then  honor = "Summa Cum Laude";  and print with  printf("Academic Honor: %s\\n", honor);'],
        solution: P6,
      },
      {
        t: 'code', title: 'Paper mode: add input checks', paper: true, starter: '',
        body: 'Same Problem 6, now protected: if the GWA is **not between 1.00 and 5.00** (inclusive), display ~Invalid GWA~ and stop. Otherwise do the disqualification check and the honors ladder as before.\n\nPaper mode: no Run button, no colors.',
        tests: [
          { input: '0.90 1.50\n', has: ['Invalid'], not: ['Cum Laude', 'No Academic', 'Disqualified'] },
          { input: '5.25 3.00\n', has: ['Invalid'], not: ['Cum Laude', 'No Academic', 'Disqualified'] },
          { input: '1.00 1.00\n', ...SUMMA }, { input: '1.30 2.00\n', ...MAGNA }, { input: '1.50 3.00\n', ...DISQ }, { input: '1.80 2.50\n', ...NONE },
        ],
        hints: ['Invalid when: gwa < 1.00 || gwa > 5.00', 'Chain the checks: if (invalid) { ... } else if (lowest > 2.50) { ... } else { ladder }'],
        solution: P6_CHECKED,
      },
    ],
  },
  // ───────────────────────── UNIT 3 ─────────────────────────
  {
    id: 'while', unit: 3, title: 'Loops: while', sub: 'the arrow that goes back up', icon: '↻',
    steps: [
      {
        t: 'read', title: 'A loop is an arrow back up', flow: true, code: WHILE5,
        anno: { 4: 'start', 5: 'check (diamond)', 7: 'step — moves toward the exit' },
        body: 'In a flowchart, a loop is an arrow that points **back up**. ~while (condition) { ... }~ checks the diamond **first** (a *pre-test* loop), then runs the body, then checks again.',
      },
      { t: 'trace', title: 'Round and round', code: WHILE5, body: 'Watch the token go around the loop until `i <= 5` becomes NO.' },
      { t: 'quiz', title: 'Count the rounds', code: C`
int i = 0;
while (i < 5) {
    printf("%d", i);
    i++;
}
`, q: 'How many numbers are printed?', opts: ['4', '5', '6', 'Infinite'], a: 1, why: 'i = 0, 1, 2, 3, 4 → five numbers. When i becomes 5, `5 < 5` is false and the loop ends.' },
      {
        t: 'read', title: 'The 3 parts of every loop',
        body: `1. **Start** — ~i = 1~ (hexagon)
2. **Check** — ~i <= n~ (diamond)
3. **Step** — ~i++~ (rectangle at the end of the body)

Forget the step and the loop never ends.

Shortcuts: ~i++~ means ~i = i + 1~, ~i += 3~ means ~i = i + 3~, ~sum += i~ means ~sum = sum + i~.`,
      },
      { t: 'quiz', title: 'Find the bug', code: C`
int i = 1;
while (i <= 10) {
    printf("%d\n", i);
}
`, q: 'What happens?', opts: ['Prints 1 to 10', 'Infinite loop — i never changes', 'Prints 1 to 9', 'Syntax error'], a: 1, why: 'There is no step. i stays 1 forever, so `i <= 10` is always true.' },
      {
        t: 'fill', title: 'Odd numbers up to n', body: 'Print 1 3 5 … up to n.',
        code: C`
int i = [[1]];
while (i [[<=]] n) {
    printf("%d ", i);
    i = i [[+ 2|+2]];
}
`, extra: ['0', '<', '+ 1', '>='],
      },
      {
        t: 'code', title: 'Countdown', starter: STARTER,
        body: 'Read N and print N down to 1 separated by spaces, then ~Liftoff!~\n\nExample: ~5~ → ~5 4 3 2 1 Liftoff!~',
        tests: [{ input: '5\n', nums: [5, 4, 3, 2, 1], has: ['Liftoff'] }, { input: '3\n', nums: [3, 2, 1], has: ['Liftoff'] }, { input: '1\n', nums: [1], has: ['Liftoff'] }],
        hints: ['Start at n and go DOWN: while (n >= 1)', 'Inside: printf("%d ", n); then n = n - 1;', 'After the loop: printf("Liftoff!\\n");'],
        solution: C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter N: ");
    scanf("%d", &n);
    while (n >= 1) {
        printf("%d ", n);
        n = n - 1;
    }
    printf("Liftoff!\n");
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'dofor', unit: 3, title: 'do-while & for', sub: 'post-test loops and the 3-in-1 loop', icon: '⟳',
    steps: [
      {
        t: 'read', title: 'do-while = your workbook loop', flow: true, code: DOWHILE,
        anno: { 5: 'body runs FIRST', 8: 'check AFTER — note the semicolon!' },
        body: 'Look at Problem 11\'s flowchart: the body comes first, the diamond after, and **Yes** loops back up. That is a *post-test* loop — in C, ~do { ... } while (condition);~',
      },
      { t: 'trace', title: 'Body first, question after', code: DOWHILE, body: 'Sum of 15 + 18 + 21 + 24. Watch the check happen at the bottom.' },
      {
        t: 'read', title: 'for = 3 boxes in one line', flow: true, code: FOR5,
        anno: { 5: 'start ; check ; step' },
        body: '~for (start; check; step)~ packs the hexagon, the diamond and the step rectangle into **one line**. Same flowchart as a while loop — just tidier.',
      },
      { t: 'trace', title: 'Run the for loop', code: FOR5, body: 'Watch: setup once, then check → body → step, again and again.' },
      { t: 'quiz', title: 'Predict', code: 'for (i = 2; i <= 10; i += 2) printf("%d ", i);', q: 'What prints?', opts: ['2 4 6 8 10', '2 4 6 8', '0 2 4 6 8 10', '2 3 4 5 6 7 8 9 10'], a: 0, why: 'Start at 2, step by 2, continue while ≤ 10 (10 is included).' },
      { t: 'quiz', title: 'while vs do-while', q: 'When does a do-while behave differently from a while?', opts: ['Never', 'do-while always runs the body at least once', 'while is faster', 'do-while cannot use &&'], a: 1, why: 'do-while checks **after** the body, so the body always runs at least once — even if the condition is false from the start.' },
      {
        t: 'order', title: 'Multiples of 3', body: 'Arrange a fragment that reads n and prints 3 6 9 … up to n.',
        lines: ['int i, n;', 'scanf("%d", &n);', 'for (i = 3; i <= n; i += 3) {', 'printf("%d ", i);', '}'],
      },
      {
        t: 'code', title: 'Odd ones', starter: STARTER,
        body: 'Read N. Using a **for** loop, print the first N odd numbers: ~1 3 5 …~',
        tests: [{ input: '4\n', nums: [1, 3, 5, 7] }, { input: '1\n', nums: [1] }, { input: '6\n', nums: [1, 3, 5, 7, 9, 11] }],
        hints: ['Loop N times: for (i = 1; i <= n; i++)', 'The i-th odd number is 2 * i - 1', 'printf("%d ", 2 * i - 1);'],
        solution: C`
#include <stdio.h>

int main() {
    int n, i;
    printf("Enter N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        printf("%d ", 2 * i - 1);
    }
    printf("\n");
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'accum', unit: 3, title: 'Accumulator Patterns', sub: 'sums, products, series from M to N', icon: 'Σ',
    steps: [
      {
        t: 'read', title: 'The accumulator recipe',
        body: `1. **Init** before the loop: ~sum = 0~ (adding) or ~prod = 1~ (multiplying)
2. **Loop** over the terms: start, check, step
3. **Accumulate** inside: ~sum = sum + term;~
4. **Display** AFTER the loop, not inside

> Forget ~sum = 0~ and you add to garbage. Try it in the Playground — the warning is loud.`,
      },
      { t: 'trace', title: 'Sum 1 to N', code: SUMN, stdin: '5', body: 'N = 5. Watch `sum` grow: 1, 3, 6, 10, 15.' },
      {
        t: 'read', title: 'Read the series → write the loop',
        body: `| Series | start | check | step | add |
| 1 + 2 + … + N | ~i = 1~ | ~i <= n~ | ~i++~ | ~i~ |
| 1 + 3 + 5 + … | ~i = 1~ | ~i <= n~ | ~i += 2~ | ~i~ |
| 15 + 18 + … + N | ~i = 15~ | ~i <= n~ | ~i += 3~ | ~i~ |
| 1² + 2² + … + N² | ~i = 1~ | ~i <= n~ | ~i++~ | ~i * i~ |
| M + … + N | ~i = m~ | ~i <= n~ | ~i++~ | ~i~ |

**First term → start. Gap between terms → step. Last term → check.**`,
      },
      { t: 'quiz', title: 'Pick the header', q: 'Series: 4 + 8 + 12 + … + N. Which loop header?', opts: ['for (i = 4; i <= n; i++)', 'for (i = 4; i <= n; i += 4)', 'for (i = 0; i < n; i += 4)', 'for (i = 1; i <= n; i *= 4)'], a: 1, why: 'First term 4 → start at 4. Gap 4 → `i += 4`. Last term N → `i <= n`.' },
      {
        t: 'read', title: 'Signs and products', code: C`
int sign = 1;
for (i = 1; i <= n; i++) {
    sum = sum + sign * i;   // 1 - 2 + 3 - 4 ...
    sign = -sign;           // flip every round
}

long long prod = 1;         // products start at 1!
for (i = 1; i <= n; i++) {
    prod = prod * i;        // n! (factorial)
}
`,
        body: 'Alternating series ~1 − 2 + 3 − 4 + …~: keep a ~sign~ variable that flips each round (or use ~if (i % 2 == 0)~). Products start at **1** and use ~long long~ when they get big.',
      },
      { t: 'quiz', title: 'Products', q: 'For 1 × 2 × 3 × … × N, what must `prod` start at?', opts: ['0', '1', 'N', 'It doesn\'t matter'], a: 1, why: '0 × anything = 0. The "neutral" starting value for multiplication is 1.' },
      {
        t: 'fill', title: 'Sum of squares', body: 'Compute 1² + 2² + … + N².',
        code: C`
int i, n, sum = [[0]];
scanf("%d", &n);
for (i = [[1]]; i <= n; i[[++]]) {
    sum = sum + [[i * i]];
}
printf("%d\n", sum);
`, extra: ['i ^ 2', '+= 2', 'n * n', '2'],
      },
      {
        t: 'code', title: 'Squares', starter: STARTER,
        body: 'Read N and print the sum of squares 1² + 2² + … + N².',
        tests: [{ input: '3\n', nums: [14] }, { input: '5\n', nums: [55] }, { input: '1\n', nums: [1] }, { input: '10\n', nums: [385] }],
        hints: ['int sum = 0;', 'for (i = 1; i <= n; i++) sum = sum + i * i;'],
        solution: C`
#include <stdio.h>

int main() {
    int n, i, sum = 0;
    printf("Enter N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        sum = sum + i * i;
    }
    printf("Sum of squares = %d\n", sum);
    return 0;
}
`,
      },
      {
        t: 'code', title: 'Alternating sum', starter: STARTER,
        body: 'Read N and print 1 − 2 + 3 − 4 + … ± N.\n\nExample: N = 4 → ~-2~, N = 5 → ~3~',
        tests: [{ input: '4\n', nums: [-2] }, { input: '5\n', nums: [3] }, { input: '1\n', nums: [1] }, { input: '10\n', nums: [-5] }],
        hints: ['Odd i is added, even i is subtracted.', 'if (i % 2 == 0) sum = sum - i; else sum = sum + i;'],
        solution: C`
#include <stdio.h>

int main() {
    int n, i, sum = 0;
    printf("Enter N: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        if (i % 2 == 0) {
            sum = sum - i;
        } else {
            sum = sum + i;
        }
    }
    printf("Result = %d\n", sum);
    return 0;
}
`,
      },
    ],
  },
  // ───────────────────────── UNIT 4: BOSSES ─────────────────────────
  {
    id: 'boss-sa', unit: 4, boss: true, title: 'Boss 1: Surface Area of Anything', sub: 'Problem 1 type — derive the formula yourself', icon: '⬢',
    steps: [
      {
        t: 'read', title: 'They won\'t give you the formula',
        body: `On the exam you may get a solid you have never seen. Don't memorize — **derive**. The 4-step **Face Method**:

1. **List every outside face** — top, bottom, sides, curved parts.
2. **Area of each face** with 2D formulas: rectangle ~l·w~, triangle ~½·b·h~, circle ~πr²~, trapezoid ~½(a+b)h~ — or a curved-surface formula.
3. **Find hidden lengths** — slant heights almost always come from Pythagoras: ~√(a² + b²)~.
4. **Add them up**, then translate to C line by line.`,
      },
      { t: 'shape', title: 'Lab: the frustum (Problem 1)', shape: 'frustum', body: 'Tap every **outside** face of the frustum, then find the length the formula needs but the problem doesn\'t give you.' },
      {
        t: 'read', title: 'Curved-surface cheat codes',
        body: `- **Cylinder side**: unroll it → a rectangle ~2πr~ wide and ~h~ tall → ~2 * PI * r * h~
- **Cone side**: ~PI * r * l~, slant ~l = √(r² + h²)~
- **Frustum side**: ~PI * (R + r) * s~, ~s = √(h² + (R − r)²)~
- **Sphere**: ~4 * PI * r * r~ · **Hemisphere**: dome ~2πr²~ + flat ~πr²~
- **Any prism**: ~2 × base area + base perimeter × length~
- **Pyramid**: base + each triangle ~½ × edge × slant~`,
      },
      { t: 'shape', title: 'Lab: triangular prism', shape: 'prism', body: 'A prism with an isosceles triangle as its base. Count all **five** faces, then find the slanted side.' },
      { t: 'shape', title: 'Lab: composite solid', shape: 'silo', body: 'A cone sitting on a cylinder. Careful: two solids glued together **hide** some faces. Count only what paint could touch.' },
      {
        t: 'quiz', title: 'Composite check', q: 'A cylinder (radius r, height h) has a hemisphere on top. Its total surface area is…',
        opts: ['2πr² + 2πrh + πr²  (two disks + side + dome-flat)', 'πr² + 2πrh + 2πr²  (bottom + side + dome)', '4πr² + 2πrh', 'πr² + 2πrh'], a: 1,
        why: 'Bottom disk **πr²** + cylinder side **2πrh** + hemisphere dome **2πr²**. The cylinder\'s top is glued under the dome — not counted.',
      },
      {
        t: 'code', title: 'Problem 1, from the flowchart', blueprint: true, starter: STARTER_MATH,
        body: 'Code the workbook\'s **Problem 1** using the flowchart above as your blueprint. Input R, r and h (decimals) and display the total surface area of the frustum with 2 decimals. Use PI = 3.14159.',
        tests: [{ input: '5 3 4\n', nums: [219.21] }, { input: '10 4 8\n', nums: [804.25] }, { input: '3 3 5\n', nums: [150.8] }],
        hints: ['double R, r, h, s, total;  and  scanf("%lf %lf %lf", &R, &r, &h);', 's = sqrt(h * h + (R - r) * (R - r));', 'total = PI * r * r + PI * R * R + PI * (R + r) * s;'],
        solution: FRUSTUM,
      },
      {
        t: 'code', title: 'Blind: square pyramid', starter: STARTER_MATH,
        body: 'A **square pyramid** has base edge ~b~ and vertical height ~h~. Read b and h and print its total surface area (2 decimals). No formula given — use the Face Method!',
        tests: [{ input: '6 4\n', nums: [96] }, { input: '10 12\n', nums: [360] }, { input: '2 1\n', nums: [9.66] }],
        hints: ['Faces: 1 square base + 4 identical triangles.', 'Each triangle\'s height is the slant: slant = sqrt(h * h + (b / 2) * (b / 2));', 'total = b * b + 4 * (0.5 * b * slant);'],
        solution: C`
#include <stdio.h>
#include <math.h>

int main() {
    double b, h, slant, total;
    printf("Enter base edge and height: ");
    scanf("%lf %lf", &b, &h);
    slant = sqrt(h * h + (b / 2) * (b / 2));
    total = b * b + 4 * (0.5 * b * slant);
    printf("Total surface area = %.2f\n", total);
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'boss-guard', unit: 4, boss: true, title: 'Boss 2: Guard + Accumulate', sub: 'Problem 11 type — validate, then sum a series', icon: '⛨',
    steps: [
      {
        t: 'read', title: 'The Problem 11 blueprint', flow: true, code: P11,
        anno: { 7: 'PART A: the guard diamond', 10: 'PART B: initialize (hexagon)', 14: 'loop back while Counter ≤ N' },
        body: `This is the official Problem 11 solution, in C. Compare it with the workbook flowchart — same symbols, same arrows.

**Part A — Guard:** input, one diamond, error branch.
**Part B — Accumulate:** initialize, loop body, loop diamond, display.`,
      },
      { t: 'trace', title: 'Valid run: N = 24', code: P11, stdin: '24', body: 'Watch Part A let 24 through, then Part B add 15 + 18 + 21 + 24.' },
      { t: 'trace', title: 'Invalid run: N = 20', code: P11, stdin: '20', body: '20 > 15, but 20 mod 3 ≠ 0 → straight to the error and End.' },
      {
        t: 'read', title: 'The universal template', code: C`
scanf("%d", &n);
if ( /* INVALID condition */ ) {
    printf("Error: ...\n");
} else {
    int sum = 0, term = /* FIRST TERM */;
    do {
        sum = sum + /* TERM EXPRESSION */;
        term = term + /* STEP */;
    } while (term <= n);
    printf("Sum = %d\n", sum);
}
`,
        body: `Every Problem-11 variant fits this skeleton. Only **four blanks** change.

> Variants to expect: multiples of 4 from 20 to N · odd numbers up to N · squares of each term · a product instead of a sum · counting the terms. Same skeleton every time.`,
      },
      {
        t: 'fill', title: 'Variant: multiples of 4', body: '"N must be a multiple of 4 greater than 20. Display 20 + 24 + 28 + … + N."',
        code: C`
if (n [[<=]] 20 [[||]] n % 4 [[!=]] 0) {
    printf("Error\n");
} else {
    int sum = 0, term = [[20]];
    do {
        sum = sum + term;
        term = term + [[4]];
    } while (term [[<=]] n);
    printf("Sum = %d\n", sum);
}
`, extra: ['&&', '3', '15', '<', '=='],
      },
      {
        t: 'order', title: 'Assemble Part B', body: 'Order the accumulate part of Problem 11.',
        lines: ['int sum = 0, counter = 15;', 'do {', 'sum = sum + counter;', 'counter = counter + 3;', '} while (counter <= n);', 'printf("Sum = %d\\n", sum);'],
      },
      {
        t: 'code', title: 'Variant A (from the flowchart)', blueprint: true, starter: STARTER,
        body: 'N must be a multiple of 4 **and** greater than 20. If not, display an error message and stop. Otherwise display the sum ~20 + 24 + 28 + … + N~. The blueprint flowchart is above.',
        tests: [
          { input: '28\n', nums: [72] }, { input: '24\n', nums: [44] }, { input: '20\n', has: ['error'] },
          { input: '30\n', has: ['error'] }, { input: '100\n', nums: [1260] },
        ],
        hints: ['Invalid: n <= 20 || n % 4 != 0', 'int sum = 0, term = 20;  then  do { sum = sum + term; term = term + 4; } while (term <= n);'],
        solution: C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter N: ");
    scanf("%d", &n);
    if (n <= 20 || n % 4 != 0) {
        printf("Error: N must be a multiple of 4 greater than 20\n");
    } else {
        int sum = 0, term = 20;
        do {
            sum = sum + term;
            term = term + 4;
        } while (term <= n);
        printf("Sum = %d\n", sum);
    }
    return 0;
}
`,
      },
      {
        t: 'code', title: 'Variant B (blind)', starter: STARTER,
        body: 'N must be **odd** and **at least 5**; otherwise display an error. If valid, display ~1² + 3² + 5² + … + N²~.',
        tests: [{ input: '5\n', nums: [35] }, { input: '7\n', nums: [84] }, { input: '4\n', has: ['error'] }, { input: '3\n', has: ['error'] }, { input: '9\n', nums: [165] }],
        hints: ['Invalid: n % 2 == 0 || n < 5', 'Terms start at 1 and step by 2; add term * term.'],
        solution: C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter N: ");
    scanf("%d", &n);
    if (n % 2 == 0 || n < 5) {
        printf("Error: N must be odd and at least 5\n");
    } else {
        int sum = 0, term = 1;
        do {
            sum = sum + term * term;
            term = term + 2;
        } while (term <= n);
        printf("Sum = %d\n", sum);
    }
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'exam', unit: 4, boss: true, title: 'Final: Paper-Mode Exam', sub: 'no colors, no Run button — just like paper', icon: '✎',
    steps: [
      {
        t: 'read', title: 'Paper mode rules',
        body: `The exam is on paper. So this round: **no syntax colors, no auto-brackets, no Run button.** Write it, then Submit. The grader shows your mistakes after.

Your checklist:
1. ~#include <stdio.h>~ (+ ~<math.h>~ for sqrt/pow)
2. ~int main() {~
3. Declare every variable (~double~ for measurements)
4. Prompt + ~scanf~ with ~&~
5. Guard (if the problem has conditions)
6. Compute / loop
7. ~printf~ the answer
8. ~return 0;~ and the closing ~}~`,
      },
      {
        t: 'code', title: 'Exam Q1: the trapezoidal prism', paper: true, starter: '', figure: 'trapprism', draftKey: 'exam-trapprism',
        body: 'A **trapezoidal prism** (figure below): its front and back faces are **isosceles trapezoids** with parallel sides **a** (top) and **b** (bottom) and height **h**, and the prism is **L** long. Input a, b, h and L (in that order) and display the total surface area with 2 decimals.\n\n**No formula given**: derive it with the Face Method.',
        tests: [
          { input: '4 10 4 10\n', nums: [296] }, { input: '6 12 4 5\n', nums: [212] }, { input: '3 5 2 7\n', nums: [103.3] },
          { input: '5 5 3 4\n', nums: [94] }, { input: '2.5 6.5 1.5 8\n', nums: [125.5] },
        ],
        hints: [
          'Count the faces: 2 trapezoids (front and back) + 4 rectangles (top, bottom, and the two slanted sides).',
          'The slanted side s is NOT given. It is the hypotenuse of a right triangle whose legs are h and the overhang (b − a) / 2.',
          'SA = 2 × ½(a + b)h + (a + b + 2s) × L',
        ],
        solution: C`
#include <stdio.h>
#include <math.h>

int main() {
    double a, b, h, L, s, trap, sa;
    printf("Enter a, b, h, L: ");
    scanf("%lf %lf %lf %lf", &a, &b, &h, &L);
    s = sqrt(h * h + ((b - a) / 2) * ((b - a) / 2));
    trap = 0.5 * (a + b) * h;
    sa = 2 * trap + (a + b + 2 * s) * L;
    printf("Total surface area = %.2f\n", sa);
    return 0;
}
`,
      },
      {
        t: 'code', title: 'Exam Q2: guarded squares', paper: true, starter: '',
        body: 'Input N. N must be a multiple of 6 and **greater than 30**; otherwise display an error and stop. If valid, display ~30² + 36² + 42² + … + N²~.',
        tests: [{ input: '36\n', nums: [2196] }, { input: '42\n', nums: [3960] }, { input: '30\n', has: ['error'] }, { input: '40\n', has: ['error'] }, { input: '48\n', nums: [6264] }],
        hints: ['Invalid: n <= 30 || n % 6 != 0', 'term starts at 30, steps by 6, add term * term'],
        solution: C`
#include <stdio.h>

int main() {
    int n;
    printf("Enter N: ");
    scanf("%d", &n);
    if (n <= 30 || n % 6 != 0) {
        printf("Error: N must be a multiple of 6 greater than 30\n");
    } else {
        int sum = 0, term = 30;
        do {
            sum = sum + term * term;
            term = term + 6;
        } while (term <= n);
        printf("Sum = %d\n", sum);
    }
    return 0;
}
`,
      },
      {
        t: 'code', title: 'Exam Q3: GWA from scratch', paper: true, starter: '',
        body: 'The harder GWA question. Input **N** (number of subjects), then the **grade and units** of each subject. Compute the GWA = Σ(grade × units) ÷ Σ(units) and display it with 2 decimals. Then apply the Problem 6 rules: if any grade is above 2.50 display the disqualification; otherwise display ~Academic Honor:~ with Summa (≤ 1.20), Magna (≤ 1.45), Cum Laude (≤ 1.75) or No Academic Honors.',
        tests: [
          { input: '3\n1.25 3\n1.00 3\n1.50 2\n', nums: [1.22], ...MAGNA },
          { input: '2\n1.00 3\n1.25 2\n', nums: [1.1], ...SUMMA },
          { input: '3\n1.50 3\n1.75 3\n1.75 2\n', nums: [1.66], ...CUM },
          { input: '2\n2.25 3\n2.00 2\n', nums: [2.15], ...NONE },
          { input: '4\n1.75 3\n2.00 3\n1.50 3\n2.75 1\n', nums: [1.85], ...DISQ },
        ],
        hints: ['Two accumulators in a for loop:  sumGU = sumGU + grade * units;  sumU = sumU + units;', 'Track the worst grade: start worst = 0, then  if (grade > worst) worst = grade;', 'After the loop:  gwa = sumGU / sumU;  then reuse the Problem 6 guard + ladder with worst.'],
        solution: GWA_CALC,
      },
      {
        t: 'read', title: 'You are exam-ready',
        body: `You can now:

- translate any flowchart symbol into C and back
- derive a surface-area formula with the Face Method
- write the guard + accumulate program on demand
- classify Latin honors, even from a GWA you compute yourself

Keep the streak alive: the **Challenges** tab has 30 levels for general fluency, and the **Reference** tab has flashcards for the bus ride. Good luck on the finals!`,
      },
    ],
  },
];
