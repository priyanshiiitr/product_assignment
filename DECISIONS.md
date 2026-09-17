# DECISIONS.md — interview prep log

Every significant decision made while building this, the options considered, and why we picked one. Written as we go, not reconstructed afterward.

---

## Decision 0: How to handle the missing brief PDF

**Context:** The working agreement (see PROMPTS.md, message 1) assumed Nubra_Product_Intern_Assignment.pdf was already in E:\Numbla_Assignment. The folder was empty.

**Options considered:**
1. Ask the user to add the PDF to the folder — cleanest, keeps a real record of the source doc.
2. Ask for a different path to the PDF.
3. Proceed on the pasted brief text alone, skip reading the original PDF.

**Decision:** Option 1. User added the PDF by pasting its content directly into chat rather than saving a file to the folder. Content was verified to match the brief as described (Problem 03: Post-trade review, four artifacts, 4-6 hours, 2-day deadline). Proceeding without the literal file on disk since its content is fully captured.

---

## Decision 1: Who is the target user

**Context:** Phase 2 framing. "Turn a month of order history into habits" needs a concrete user in mind — the right habits, thresholds, and even data volume assumptions depend on who this is for.

**Options considered:**
1. **Active F&O/intraday trader (Nubra's core segment)** — scalpers, options-heavy, many trades/month. Richer data per month makes habit-vs-luck statistically more defensible, but intraday/options mechanics (expiry, theta decay) are more complex to model correctly in the time available.
2. **Broad retail trader** — mostly equity, occasional F&O, ~10-30 trades/month. Matches the brief's literal "most retail traders" phrasing, but low trade counts make it much harder to distinguish a real habit from noise.
3. **Volume-adaptive: handle both, adjust confidence/messaging by trade count** — most honest and impressive if done well, but too much scope for a 4-6 hour build.

**Decision:** Option 1 — active F&O/intraday trader — with the graceful-fallback spirit of Option 3 kept for edge cases (if trade count is too low, the tool says "not enough data to call this a habit" instead of forcing a verdict).

**Why:** Nubra's own positioning (per the brief context: "SEBI-registered broker for active traders: F&O, intraday, scalpers") makes this the actual user Nubra needs to retain. It's also the segment where "a habit costing money" is most concrete and measurable within a single month of data — high trade frequency means patterns show up fast, whereas a 15-trade/month equity investor doesn't generate enough signal to responsibly call anything a "habit."

---

## Decision 2: How to define a "habit" measurably, and separate it from bad luck

**Context:** Phase 2 framing. The brief explicitly warns against calling a run of bad luck a habit. Needed a precise, computable rule the tool applies before it's allowed to flag anything.

**Options considered:**
1. **Frequency threshold only** — behavior counts as a habit if it recurs ≥N times in the month. Simple, but doesn't prove it cost money, just that it happened.
2. **Frequency + relative underperformance vs. the trader's own baseline** — require (a) ≥N occurrences AND (b) trades showing the behavior perform meaningfully worse than the trader's *other* trades that same month (self-referential control, not an external benchmark).
3. **Formal statistical significance test** (t-test/permutation test between the two trade groups) — most rigorous on paper, but a month of trading data is a small sample (often 20-60 trades total, fewer per bucket), so the test is underpowered and a p-value means nothing to someone reading a plain-English monthly review.

**Decision:** Option 2, with N≥3 occurrences as the minimum floor before anything is called a habit.

**Why:** It gives a direct, honest answer to "how do you know this isn't just luck?" — we don't compare the trader to the market or to other people, we compare their habit-trades to their *own* other trades in the same month. If the two groups perform about the same, it's not flagged. The frequency floor stops a single bad trade from being labeled a pattern. It also stays fully plain-English — no p-values or statistical jargon a trader would have to trust blindly.

**Note:** User explicitly delegated this choice ("take what you see fit") rather than picking between options — this is worth remembering for the interview: I made this call, and I should be ready to defend it on the merits above, not defer to "the user chose it."

---

## Decision 3: The habit list and thresholds (chosen autonomously, per user's "choose by yourself" instruction)

**Context:** The brief lists example habits (re-entering after a loss, letting losers run, averaging down, overtrading, opening-minutes trading) and says to propose the list and thresholds before building. The user delegated this choice rather than reviewing options, so this is a call I made and need to be ready to defend on its own merits.

**Constraint that shaped every threshold:** the CSV only has timestamp, symbol, side, qty, price — no intraday price path/marks. So every habit had to be computable from entry/exit fills alone, with no counterfactual that requires knowing the price at some hypothetical earlier exit time.

**The five detectors implemented (all computed, only top 2-3 by rupee cost shown):**
1. **Revenge trading** — a new position opened within 15 minutes of closing a losing trade. Needs ≥3 occurrences. Cost = sum of P&L on the re-entry trades that also lost money.
2. **Cutting winners short / letting losers run** — measured as magnitude asymmetry: average loss size on losing trades vs. average win size on winning trades, not hold-time (hold-time alone doesn't prove cost without a price path). Flagged when avg loss ≥1.5x avg win, needs ≥3 losers. Cost = what would have been saved if avg loss matched avg win size, holding the number of losing trades fixed.
3. **Averaging down** — an added buy (or added short) to a position that is already at an unrealized loss at the time of the add. Needs ≥3 instances. Cost = extra loss attributable to the added quantity.
4. **Overtrading** — days where trade count ≥1.5x the trader's own median daily count (self-referential, not an external "normal"), needs ≥3 such days, and average per-trade P&L on those days must be worse than on normal days. Cost = P&L differential.
5. **Opening-minutes trading** — trades entered in the first 15 minutes of the session (9:15-9:30 IST), needs ≥5 such trades, flagged only if their average P&L is worse than the trader's other trades. Cost = P&L differential.

**Why these five and not others:** each maps to a well-documented behavioral bias (loss aversion / revenge trading, disposition effect, anchoring on sunk cost, overconfidence after a string of trades, noise-driven early-session volatility) and — critically — each is computable exactly from the available columns without needing to invent data we don't have (like intraday price ticks).

**Why only show top 2-3:** the brief explicitly asks for this — ranking by rupee cost and showing only the top 2-3 keeps the output readable as a short review, not a dashboard of everything the tool can detect.

---

## Decision 4: Design direction (chosen autonomously)

**Context:** The brief requires the app not feel like a dashboard — "it should read like a short monthly review" — and asks for a clean, distinctive, non-generic-template look, with one direction picked before styling.

**Direction chosen: an editorial "monthly statement / letter" layout.** Single column, generous whitespace, a serif headline face paired with a clean sans body, numbers written inline in prose rather than in stat tiles or chart grids, expandable sections (native disclosure widgets) for the trades behind each habit, and a muted paper-like background rather than a typical SaaS-dashboard palette of cards and bright accent colors.

**Why:** this directly satisfies the "not a dashboard" constraint by construction — there's no grid to build, so it can't accidentally become one. It also reads naturally as something written *to* the trader (a review), not a data product they have to interpret themselves.

---

## Decision 5: Build-time choices made while implementing Phase 3

**5 sample traders instead of 3-4.** The brief suggested 3-4; we used 5 — four "problem" personas (Rahul: revenge trading, Ananya: averaging down, Vikram: overtrading, Priya: cutting winners short) each built to have one dominant, clearly-planted habit, plus Meera as a clean/control trader with no planted habit. The clean trader isn't optional scope creep — Phase 4 explicitly requires measuring a false-alarm rate, which needs a trader with nothing to find. Five felt like the minimum honest set, not an inflation of three.

**The 5th habit type (opening-minutes trading) has no dedicated persona.** Each of the four "problem" personas is built around one dominant habit so the Phase 4 hit-rate test isn't confounded by multiple planted patterns in one dataset. Opening-minutes trading is validated instead through hand-crafted unit tests with small, explicit order lists in Phase 4, not through many-seed hit-rate testing like the other four. This is a real scope trade-off from the time budget, not an oversight — worth being upfront about if asked.

**Trade pairing (FIFO) handles shorts, partial exits, averaging, and open positions by construction**, verified first via a throwaway smoke test across all 5 sample generators (all produced sane, non-degenerate results — correct total P&L direction, correct habit detection, Meera correctly flagged nothing). Edge cases not exercised by the sample generators (a trade still open at month end, a partial exit, a single very short trade) are covered separately with hand-built unit tests in Phase 4, since the generators happen to close every position same-day.

## Decision 6: The Phase 4 pass bar

**Context:** Before running evals, the brief requires agreeing a pass bar in advance so we're not moving the goalposts after seeing results. User delegated this ("do what you seem fit").

## Decision 6a: Deployment couldn't be fully automated

Git repo initialized and committed locally. No `gh`/`vercel`/`netlify` CLI was authenticated in this environment, and pushing to GitHub or deploying to Vercel requires the user's own login — not something that should be done without their explicit credentials. Everything short of that (repo structure, root-directory note for Vercel since docs live above `app/`, build verified working via `npm run build`) was prepared; the actual push/deploy steps are in DEPLOY.md for the user to run themselves.

---

**Decision:** Detection hit rate ≥90% per planted habit (across many seeds of its dedicated persona), false-alarm rate ≤10% on the clean-trader persona (across many seeds). Chosen as a bar that's strict enough to mean something but tolerant of the genuine randomness in a seeded generator with realistic win/loss noise — a naive 100%/0% bar would likely just mean the thresholds were tuned to the sample data rather than to real behavior.

---

## Decision 7: What we changed after the first eval run failed

Full detail is in EVALS.md. Summary: the first run had 10 failing tests. Two were copy bugs (a rule missing a concrete number — easy fix). One was a bug in the *test itself*, not the product (wrong field compared for averaging-down cost). Two were the Rahul/Vikram personas not reliably expressing their planted habit across seeds — fixed by strengthening those personas, not by loosening detection thresholds. The most important one was Meera (the clean trader) false-alarming 32.5% of the time — fixed by two real methodology changes to the detectors themselves: raised the minimum sample size for the cutting-winners-short ratio (3→5 losers) and added an absolute-count floor to overtrading (not just a multiplier, so a 1-trade day-to-day difference at a low baseline can't trigger it). These two are genuine improvements that would matter on real user data, not just fixes tuned to pass our own sample generator — that distinction is the main thing to be ready to defend here.

---

**Playwright was used once, temporarily, to visually verify the running app** (screenshots of the landing page, a full review, an expanded trade table, the guardrail toggle, and the clean-trader case) — confirmed it renders correctly with zero console errors. It was removed from package.json afterward since it's a personal QA step, not part of the shipped product (Vitest is the testing tool named in the brief for Phase 4).

---
