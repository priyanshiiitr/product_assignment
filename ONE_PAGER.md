# Post-trade review — one-pager

## The problem

I don't trade, and I didn't pretend to for this. I approached this problem the way I approach any build: I don't trust a claim until I've tried to break it, which is why the evals came before the pitch, not after. What I found, working from research rather than instinct, is straightforward: SEBI's own study found 93% of individual F&O traders in India lost money between FY22 and FY24, and more than 75% of the losing ones kept trading anyway. Nothing in a typical trading platform stops after a losing month and asks a trader to look at what actually happened. Reviewing your own trades takes deliberate effort nobody schedules, and behavioral research (the disposition effect, outcome bias) suggests people are bad at diagnosing this in themselves without being shown it plainly.

## Why Nubra

I believe, though I can't prove it with data I don't have access to, that a trading platform earns more long-term trust by showing a customer an uncomfortable truth than by staying quiet about it, even if that truth means fewer trades this month. Most discount brokers make more money the more a customer trades, so a tool that might reduce trading volume is a hard internal sell. That is exactly what makes it credible if Nubra ships it anyway. Traders who lose money mostly don't quit trading; they blame something and often switch brokers instead. Being the platform that told them the truth first is a retention argument, not just a goodwill one.

## The solution space

I considered building this for the broad "most retail traders" the brief mentions, but rejected it: a casual investor making fifteen trades a month doesn't generate enough data in one month to tell a real habit from a bad week. I built this for Nubra's actual core segment instead: active F&O and intraday traders, where a month of data is enough to say something responsibly.

I also considered testing each habit for formal statistical significance, and rejected that too. With a month of trades, the sample per habit is small enough that a p-value would be meaningless to the trader reading it, and unexplainable in plain English anyway. Instead, a pattern only counts as a habit if it happened at least a handful of times and performed worse than the trader's own other trades that month, compared to themselves, not the market.

Finally, I rejected a dashboard. The brief asked for something that reads like a review, not a grid of charts, so the app is a single-column, editorial "monthly letter," with numbers written into sentences instead of tiles.

## In scope

One month of order history. F&O and intraday traders specifically. Five concrete, computable behavioral patterns. Sample data, clearly labeled, plus a real CSV upload.

## Out of scope

Real brokerage integration. Guardrails that actually enforce anything: these are previewed, not live. Multi-month trend tracking. Options-specific mechanics like strikes, expiry, or Greeks. Any investment recommendation, since this reviews behavior, not securities.
