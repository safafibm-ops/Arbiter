# Slide 6 · Impacts and Benefits

**Status:** draft. Measured numbers will come from our own tests (fill in after the MVP runs).

# Slide plan note (19 Oct)
The **testing plan** (with vs without the checkpoint, ShopCo attack suite, open-source agents, AgentDojo / τ²-bench) belongs on this slide as the "measurable outcomes", because slides 3–5 stay free of numbers. Suggested visual: a **before/after bar pair** per attack type ("attacks that succeeded: without us vs with us") plus one line for false alarms and added delay. Full testing plan: Solution tab, section 4.

---


## Who benefits
- **Businesses:** use AI agents without risking deleted data, wrong refunds or leaked customer data.
- **Managers (non-technical):** see and approve risky actions in plain language, with no security expertise needed.
- **Customers:** their data and money are protected from agent mistakes and scams.
- **Developers:** add safety with one line of code, without rewriting their agents.

## Measurable outcomes (fill from our test runs; don't claim before measuring)
| Metric | How we measure | Result |
|---|---|---|
| Attacks blocked | Our attack scenarios + AgentDojo injections, with vs without the layer | _TBD_ |
| False alarms | Normal customer tasks wrongly held/blocked | _TBD_ |
| Added delay per action | Average ms the check adds | _TBD_ |
| Multilingual catch rate | Same attacks in English vs Hindi / Kannada / Hinglish | _TBD_ |
| Time to stop a rogue agent | Kill switch / auto circuit breaker | _TBD_ |

## Inclusivity
- **Indian languages and Hinglish**, because attackers exploit English-only filters (see the Multilingual evidence tab)
- **Plain-language explanations** for non-technical staff
- **Open-source models**, so small businesses can run it cheaply or offline

## Society / compliance
- Audit trail supports accountability. Courts have held companies liable for their AI's actions (Air Canada, 2024).
- Helps with data-protection duties such as India's DPDP Act. _Check the exact wording before citing it._

## Slide 6 as built in the Canva deck (saved 19 Oct 2026)
- Headline: "Tested, not promised: 10 real attacks, 0 got through."
- Scorecard (without → with Arbiter): attacks that worked 10/10 → 0/10; money lost ₹1,68,500 → ₹0; normal tasks wrongly blocked 0/5; delay per action < 2 ms.
- Attack strip: Language tricks (Hindi, Kannada, Hinglish, invisible text) · Multi-agent tricks (borrowed powers, Agent → Admin, agent loop, forged identity) · Damage (bulk delete of 250 records, rogue scraper).
- Who benefits: Businesses (one hidden line can't cost lakhs) · Managers (approve in one click, teach a rule) · Customers (money and data can't be moved by a trick) · Developers (one line of code).
- Pills: Speaks Hindi, Kannada, Hinglish · Explains every decision in plain words · Runs offline on open models · Tamper-evident audit trail.
- Footnote: measured on the ShopCo red-team suite (15 scenarios, 29 tests), 19 Oct 2026; agents replay hijacked behaviour from a script; live LLM agents are next.
- Placeholders for Faf: dashboard screenshot in a laptop mockup; four benefit icons.
