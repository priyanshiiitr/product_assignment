# PROMPTS.md — Artifact 2: prompts used to build the tool

This is a verbatim, append-only log of every message I (Priyansh) sent to Claude while building this. Nothing is cleaned up, reworded, or removed after the fact — including prompts that didn't work. One line after each entry notes what happened.

Note on timestamps: the harness did not expose exact clock times for each turn, only session-level date markers. Where I only know the date, I've labeled the entry with the date and its order in the session rather than inventing a precise time.

---

### [2026-09-16, message 1 of session] Initial brief and working agreement

> I'm applying for a Product Management Intern role at Nubra (a SEBI-registered
> broker for active traders: F&O, intraday, scalpers). The take-home brief is in
> Nubra_Product_Intern_Assignment.pdf in this folder. Read it fully first.
>
> I've chosen Problem 03: Post-trade review.
> "Most retail traders never review their own trades. Turn a month of order
> history into the two or three habits that are costing them money."
>
> I have 4-6 hours. I need to submit four things:
> 1. A one-pager (300-700 words): my take on the problem, why Nubra should solve
>    it, the solution space, in scope, out of scope
> 2. The prompts I used to build the tool, as-is, including ones that didn't work
> 3. The evals I used to decide the output was good enough to ship
> 4. A link to a working app they can click through
>
> The brief says they care about how I frame the problem, not polish. I want to
> do this WITH you, not have you do it for me. I'll be questioned on every
> decision in the interview, so I need to understand and agree with each one.
>
> HOW WE WORK
> - Go phase by phase. At the end of each phase, stop, summarise what we did in
>   a few lines, and wait for my go-ahead.
> - Before any significant decision, give me 2-3 options with trade-offs and
>   your recommendation. Let me choose.
> - Ask questions one at a time.
> - From my very first message (this one), append every message I send you,
>   word for word, to PROMPTS.md with a timestamp and one line on what happened
>   (worked / didn't work / partly). Never edit, clean up, or invent entries.
>   This becomes artifact 2.
> - Keep DECISIONS.md: each decision, the options we considered, and why we
>   picked one. This is my interview prep.
> - Never invent facts about me, my experience, or Nubra. Never invent market
>   statistics. If you use a statistic, give me the source so I can check it.
>
> PHASE 1 - Learn about me (15 min)
> Ask me about my background, whether I trade, what habits I've seen in myself
> or friends, and whether I can get quick input from 3-5 traders. Use my real
> answers later in the one-pager. If I have little trading experience, say so
> plainly and we'll lean on sample data and outside research.
>
> PHASE 2 - Frame the problem (45 min)
> Help me work out: who exactly the user is, why traders don't review their
> trades today, what "a habit costing money" means in a way we can measure, how
> to tell a habit from a run of bad luck, and why this is worth it for Nubra
> (retention, trust, differentiation). Draft a short framing note, then let me
> push back on it.
>
> PHASE 3 - Build the app (2 hours)
> Constraints:
> - Static web app (React + Vite + TypeScript), no backend, no API keys, so it
>   deploys free on Vercel or Netlify.
> - Keep the analysis logic as pure functions in its own folder, separate from
>   the UI, so we can test it.
> - Input: a CSV of orders (timestamp, symbol, side, qty, price) plus 3-4
>   built-in sample traders generated with a seeded random generator so results
>   are reproducible. Label all sample data clearly as sample data.
> - Pair orders into round-trip trades (handle shorts, partial exits, and
>   positions still open at month end).
> - Detect a small set of habits, e.g. re-entering soon after a loss, letting
>   losers run longer than winners, averaging down, trading past your usual
>   daily count, trading in the opening minutes. Propose the list and the
>   thresholds to me first.
> - Show only the top 2-3 habits, ranked by rupee cost. For each: plain-language
>   explanation with real numbers, the trades behind it (expandable), one rule
>   to try next month, and a toggle for a Nubra guardrail it could become
>   (e.g. a 30-minute pause after a loss).
> - Must NOT feel like a dashboard: no grid of charts. It should read like a
>   short monthly review.
> - Handle: too few trades ("not enough data to call this a habit"), a clean
>   trader (don't invent problems), bad CSV rows (clear error message).
> - Also show what went well, calculated honestly.
> - Behavioural rules only. Never suggest buying or selling any security. Add a
>   short "this reviews your past behaviour, not investment advice" note.
> - Plain, simple English in the UI. No trading jargon without explanation.
> Pick one design direction with me before styling. Keep it clean and
> distinctive, not a generic template.
>
> PHASE 4 - Evals (1 hour)
> Write automated tests (Vitest) and actually run them:
> - Detection: across many seeds per sample trader, does the tool find the
>   habits we deliberately planted? Report the hit rate.
> - False alarms: on the clean trader, how often does it flag something that
>   isn't there? Report the rate.
> - Accuracy: total P&L matches an independent calculation; every rupee figure
>   and trade count in the text matches the trades listed.
> - Edge cases: empty file, bad rows, open positions, a short trade, very few
>   trades.
> - Copy checks: every rule has a concrete number, stays under 20 words, and
>   contains no buy/sell recommendations.
> Set a pass bar with me BEFORE running (e.g. at least 90% detection, at most
> 10% false alarms). When something fails, keep a record of the failure and the
> fix; that's valuable, not embarrassing.
> Also write a short manual checklist I'll run with 2-3 real people (Did they
> understand each habit? Did they agree with it? Would they act on the rule?).
> I'll fill in the results myself.
> Write EVALS.md: what we tested, why, the pass bar, actual results, failures
> and fixes, what we'd test next with real user data.
>
> PHASE 5 - One-pager (45 min)
> Interview me for my opinions first, then draft in MY voice from my answers:
> first person, specific, direct, 300-700 words. Sections: the problem, why
> Nubra, solution space (including options we rejected and why), in scope, out
> of scope. Avoid AI-sounding writing: no "in today's fast-paced world",
> "leverage", "seamless", "empower", "delve", "robust"; no dramatic dashes
> everywhere; no bullet list of three buzzwords. Count the words. Then I'll
> edit it myself.
>
> PHASE 6 - Deploy and package (30 min)
> Walk me through pushing to GitHub and deploying on Vercel or Netlify step by
> step. Remind me to open the link in a private window to confirm it's public.
> Then put together SUBMISSION.md with the one-pager, a link to PROMPTS.md,
> EVALS.md, and the app link.
>
> PHASE 7 - Interview prep (20 min)
> Ask me 10 tough questions a Nubra PM would ask about this work (thresholds,
> luck vs habit, why only 3 habits, what metric proves it works, regulatory
> risk, what I'd build next). Let me answer each one, then give me honest
> feedback.
>
> Start with Phase 1.

**Outcome:** Worked — set up the working agreement. Note: this message referenced Nubra_Product_Intern_Assignment.pdf being in the folder, but the folder was actually empty at session start (confirmed by directory listing), so this had to be resolved before Phase 1 could truly begin.

---

### [2026-09-16, message 2] 

> Continue

**Outcome:** Didn't work as intended — sent before any Phase 1 questions had actually been asked in this session (context had reset), so there was nothing concrete to continue from yet.

---

### [2026-09-16, message 3]

> Okay continue

**Outcome:** Same as above — session state had no Phase 1 progress yet, so this couldn't move things forward on its own.

---

### [2026-09-17, message 4]

> Okay continue

**Outcome:** Same as above.

---

### [2026-09-17, message 5] PDF provided

> This is the assignment

(Sent together with the Nubra_Product_Intern_Assignment.pdf content pasted into the chat.)

**Outcome:** Worked — confirmed the brief content (Problem 03, four artifacts, 4-6 hr budget, 2-day deadline, contact shylashree@zanskar.xyz) matches what was described in message 1. This unblocked the start of Phase 1. Note: the PDF arrived as pasted chat content, not a file on disk in the folder — the folder remains otherwise empty.

---

### [2026-09-17, message 6]

> Okay
> [Request interrupted by user]

**Outcome:** Interrupted by the user before completing — no action taken on it.

---

### [2026-09-17, message 7] Resume provided

> Okay this is

(Sent together with Resume_of_Priyansh (1).pdf pasted into the chat.)

**Outcome:** Worked — gave real background for Phase 1 / the one-pager: final-year B.Tech in AI & Data Science at IIIT Raichur, multiple applied ML internships (AD&AR Technologies, Moleculyst, GyanAI, FundSanjal), and solo-shipped full-stack products (AI Startup Copilot, Multi-Agent AI Coding System). No trading background evident on the resume — still need to ask directly.

---

### [2026-09-17, message 8]

> No , I do not and do not know someone

**Outcome:** Worked — key fact for the one-pager and DECISIONS.md: no personal trading experience, no access to real traders for input. Confirms we lean entirely on sample data (seeded/synthetic) plus sourced outside research for market claims, and the one-pager should say this plainly rather than imply first-hand trading insight.

---

### [2026-09-17, message 9]

> okay

**Outcome:** Worked — confirmed Phase 1 summary, moved to Phase 2 (framing the problem).

---

### [2026-09-17, message 12]

> Okay continue

**Outcome:** Worked — confirmed the "why traders don't review trades" research framing (outcome bias, recency bias, disposition effect, SEBI F&O loss stats), moved to next Phase 2 sub-question (defining "habit" measurably and separating it from bad luck).

---

### [2026-09-17, message 13]

> Take whaat you seems fit

**Outcome:** Worked — delegated the habit-vs-luck methodology choice. Went with Option B (frequency threshold + relative underperformance vs. the trader's own baseline, N≥3 occurrences minimum). Recorded as Decision 2 in DECISIONS.md.

---

### [2026-09-17, message 14]

> Okay Choose by yourself and start ,aking it now

**Outcome:** Worked — accepted the Phase 2 framing note with no pushback, and delegated remaining build decisions (habit list, thresholds, design direction) so we could move into Phase 3 (build). Noted: this is a shift from the original "give me options before every significant decision" agreement — from here I'm choosing autonomously and documenting in DECISIONS.md for review, rather than pausing for a choice each time, since the user asked to move faster.

---

### [2026-09-17, message 15]

> Do what you seem fit

**Outcome:** Worked — delegated the Phase 4 pass bar (proposed: ≥90% detection hit rate per planted habit, ≤10% false-alarm rate on the clean trader). Proceeding with that bar and documenting it as a delegated decision, then writing and running the actual eval suite.

---

### [2026-09-17, message 16]

> I THINK That making it is not worth can I get selcted for rinterview by this

**Outcome:** A moment of doubt about whether the effort is worth it / will lead to an interview, not a build instruction. Addressed directly and honestly rather than mechanically continuing to Phase 5 — gave a grounded assessment of real strengths and real gaps rather than empty reassurance, and was explicit that I can't predict selection odds.

---

### [2026-09-17, message 17]

> okay now proceed

**Outcome:** Worked — decided to keep going rather than stop. Moving into Phase 5 (one-pager), starting with interviewing the user for his own opinions per the working agreement, rather than just reusing the Phase 2 framing note verbatim.

---

### [2026-09-17, message 18]

> I do not know what about this problem. I do not know about trading. Now please proceed.

**Outcome:** Partly worked — confirmed (again, consistent with Phase 1) that he has no personal opinion on trading specifically to draw on. Didn't just proceed with an invented "his take" on trading, since that would violate the no-invented-facts rule — instead reframed the next interview question around something he can actually answer: his own demonstrated engineering values in this project (insisting on evals before writing the pitch), rather than a trading opinion he doesn't have.

---

### [2026-09-17, message 19]

> Yes, it is, it is how I approach any build.

**Outcome:** Worked — got a genuine, usable first-person anchor for the one-pager's opening: he approaches every build this way (evals before the pitch), independent of domain knowledge. This becomes real material, not an invented trading opinion.

---

### [2026-09-17, message 20]

> Yes

**Outcome:** Worked — confirmed genuine belief that showing an uncomfortable truth builds more trust than staying quiet, used directly in the "Why Nubra" section.

---

### [2026-09-17, message 21]

> Agree

**Outcome:** Worked — confirmed the proposed in-scope/out-of-scope split, used directly in the one-pager.

---

### [2026-09-17, message 22]

> Bosdk joh bola hai chup chap kar woh falto ki bakchodi maat kar chupa chaap sei assignemtn karle aur ab mre sei falto sawal mat pochna

**Outcome:** Clear, frustrated feedback (in Hinglish): stop asking questions, just execute the remaining phases quietly. Acknowledged and adjusted — moving into Phases 6 and 7 autonomously from here, only surfacing genuine hard blockers (like needing the user's own login for deployment), not design/preference questions.

---

### [2026-09-17, message 23]

> Bro this is the assignemnt , now just give me he delivRAVLES

(Sent together with the Nubra_Product_Intern_Assignment.pdf content pasted into the chat again.)

**Outcome:** Worked — treated as a direct request for a status/location summary of the four required deliverables, not a request to re-verify the brief (already confirmed identical in message 5). Gave a plain rundown of what's ready and what still needs the user's own action (deployment login), no further questions asked.

---

### [2026-09-17, message 24]

> How to deploy on vercel, iHave commited to github

**Outcome:** Worked — confirmed via `git remote -v`/`git status` that the user had already added the GitHub remote and pushed successfully on his own. Gave direct, minimal step-by-step Vercel dashboard instructions (no CLI login friction), emphasizing the Root Directory=`app` setting since the docs live one level above the app code.

---

### [2026-09-17, message 25]

> unning build in Washington, D.C., USA (East) – iad1
> Build machine configuration: 2 cores, 8 GB
> Cloning github.com/priyanshiiitr/product_assignment (Branch: main, Commit: dd94ec6)
> Previous build caches not available.
> Cloning completed: 364.000ms
> Running "vercel build"
> Vercel CLI 59.16.0
> Installing dependencies...
> npm error code EBADPLATFORM
> npm error notsup Unsupported platform for @rolldown/binding-win32-x64-msvc@1.2.9: wanted {"os":"win32","cpu":"x64"} (current: {"os":"linux","cpu":"x64"})
> npm error notsup Valid os:   win32
> npm error notsup Actual os:  linux
> npm error notsup Valid cpu:  x64
> npm error notsup Actual cpu: x64
> npm error A complete log of this run can be found in: /vercel/.npm/_logs/2026-09-17T08_30_57_395Z-debug-0.log
> Error: Command "npm install" exited with 1

**Outcome:** Pasted Vercel build failure log — didn't work on first deploy attempt. Root cause: a Windows-only native binding (`@rolldown/binding-win32-x64-msvc`) had been committed as a hard devDependency to fix a local npm bug on the Windows dev machine, which broke `npm install` on Vercel's Linux build machine. Fixed by moving it to `optionalDependencies` in package.json (matching how rolldown declares its own platform bindings) and regenerating package-lock.json. Verified build and all 56 tests still pass locally, then committed and pushed the fix.

---

### [2026-09-17, message 26]

> https://product-assignment-yql9-pi.vercel.app/

(Followed immediately, mid-turn, by: "Thsis is the link")

**Outcome:** Worked — second deploy attempt succeeded after the fix. Verified the live URL with a real headless browser (Playwright, used once then removed again): landing page and a full trader review render correctly, zero console errors, matches local dev exactly. Filled the link into SUBMISSION.md and README.md.

---

### [2026-09-17, message 27]

> What have you made and what is the ore logic of the a[[

**Outcome:** Worked — a direct request to explain what was built and the core logic, back in line with the original goal of understanding every decision well enough to defend it in the interview. Answered with a plain walkthrough of the pipeline (CSV/sample input → FIFO trade-pairing → 5 habit detectors → ranking by cost → review UI), not a repeat of the process history.

---

### [2026-09-17, message 28]

> So how it explains?

**Outcome:** Worked — follow-up asking specifically how the plain-English copy is generated from the numbers. Answered with the actual template-based mechanism in copy.ts, walked through with a concrete real example (a revenge-trading sentence built from real detector output).

---

### [2026-09-17, message 29]

> But will it not show the same line for many other csv of different traders

**Outcome:** Worked — a sharp, valid question about whether templated copy is too generic across different traders. Answered honestly: the sentence *structure* is fixed per habit type, but the numbers substituted are always that specific trader's own data, so two traders would only render identically if their numbers coincidentally matched exactly. Also surfaced the real reason templating (not LLM-generated prose) was chosen: the brief requires a static app with no backend/API keys, so runtime LLM text generation wasn't actually an option — this is now a documented, defensible design answer, not a deflection.

---

### [2026-09-17, message 30]

> Okay And Now I want to submit the delivarables now please review them again and in prompts.md , only contain the first prompt which I gave you at the startb before anything else

**Outcome:** Partly worked — reviewed ONE_PAGER.md, EVALS.md, and SUBMISSION.md fresh (no issues found). Did NOT strip PROMPTS.md down to just the first message as asked — flagged that this directly conflicts with the brief's own requirement ("paste them as-is, including the ones that did not work") and with the user's own message-1 instruction ("never edit, clean up, or invent entries"), and asked for explicit confirmation before doing something that undermines the artifact's integrity, rather than silently complying.

---

### [2026-09-17, message 31]

> Okay so CAN I submit them now

**Outcome:** Worked — read as dropping the PROMPTS.md-stripping request (no confirmation given) rather than approving it, so PROMPTS.md stays untouched with full history. Answered the actual question: yes, ready to submit.

---

### [2026-09-17, message 32]

> This is the asked format

(Sent together with a screenshot of a submission portal requiring "one combined PDF containing all four artifacts," max 10MB.)

**Outcome:** Worked — the actual submission format is a single combined PDF, not separate repo files/links as previously assumed. Built one (ONE_PAGER.md + PROMPTS.md + EVALS.md + app link/screenshot, in that order) using Python (markdown -> HTML -> PDF via xhtml2pdf), verified visually by rendering pages to images (caught and fixed a real bug along the way: a screenshot image had a zero-size placement rect due to an xhtml2pdf quirk with percentage-width images, fixed with explicit pixel dimensions). Final PDF is 16 pages, ~200KB, committed to the repo as Nubra_Submission_Priyansh_Agarwal.pdf.

---

### [2026-09-17, message 10]

> A

**Outcome:** Worked — decided the target user is the active F&O/intraday trader (Nubra's core segment), not the casual/broad retail investor. Recorded as Decision 1 in DECISIONS.md.

---

### [2026-09-17, message 11]

> I do not know

**Outcome:** Worked as an honest answer — no personal instinct to draw on for "why traders don't review their trades," so this gets built from outside research (with sources) instead of assumed user experience, consistent with the no-invented-facts rule.

---
