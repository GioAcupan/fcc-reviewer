# C Hero — FCC Finals Reviewer

A mobile-first PWA that takes Fundamentals of Computing students from flowcharts to writing C on paper.

- **Learn**: 13 lessons in 5 units, building up to the two exam problem types:
  - *Problem 1 type*: surface area of a solid you have never seen (the "Face Method" plus interactive Shape Labs)
  - *Problem 11 type*: an input guard, then accumulating a series from M to N
- **Challenges**: 30 levels (10 easy / 10 medium / 10 hard), each with hidden tests, hints and stars.
- **Reference**: a searchable cheat sheet and 45 spaced-repetition flashcards.
- **Playground**: write any C, run it with interactive input, see its flowchart update as you type, and replay it step by step.

## How it works
`src/engine` is a small C compiler and interpreter written in TypeScript for the course's subset of C (types, printf/scanf, math.h, if/switch, loops, functions, arrays):
- gcc-style errors, plus "teacher warnings" for classic mistakes (missing `&`, `=` vs `==`, integer division, `^` used as a power, uninitialized `sum`, `%f` vs `%lf`).
- Every run records a trace. `flow.ts` builds an ANSI flowchart from the code (hexagon for initialization, Yes to the right and No down, post-test loops), so code lines, flowchart symbols and the trace stay linked.

## Develop
```bash
npm install
npm run dev        # local dev server
npm run build      # production build -> dist/
npx esbuild scripts/verify-content.ts --bundle --platform=node --format=esm --outfile=/tmp/v.mjs && node /tmp/v.mjs   # checks every reference solution against its tests
```
Deploy: import the repo into Vercel. The Vite preset is auto-detected (`vercel.json` is included).
