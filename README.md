# Post-trade review — Nubra Product Intern take-home (Problem 03)

Four artifacts, as requested in the brief:

1. **[ONE_PAGER.md](ONE_PAGER.md)** — the problem, why Nubra, the solution space (including rejected options), in scope, out of scope.
2. **[PROMPTS.md](PROMPTS.md)** — every prompt used to build this, verbatim, with what worked and what didn't.
3. **[EVALS.md](EVALS.md)** — the automated eval suite, the pass bar agreed before running it, actual results, and the failures we hit and fixed.
4. **The app** — see `/app`. Live link: https://product-assignment-yql9-pi.vercel.app/

`DECISIONS.md` is a running log of every significant decision, the options considered, and why one was picked — kept as interview prep, not one of the four required artifacts.

## Running the app locally

```
cd app
npm install
npm run dev
```

## Running the evals

```
cd app
npx vitest run
```
