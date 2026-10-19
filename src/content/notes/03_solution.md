# Slide 3 · Solution Overview

**Status:** slide plan added (19 Oct): layout, text, shapes, visuals below. Full explanation and feature details follow it. Project name still to choose (see Slide 1).

**In the Canva deck (19 Oct):** slide 3 is built and saved in the team deck from the plan below (preview: `ps21/canva_previews/slide3_preview.png`).

**Slide 3 redesign (19 Oct, saved in Canva, preview: `ps21/canva_previews/slide3_v3_preview.png`):** Faf asked for a full overhaul of the checkpoint diagram because it felt generic. The new version reads left to right in three columns:
- **An agent tries something:** Support agent looks up the order status for customer #2231 · Refund agent refunds ₹8,000 for a damaged phone · Billing agent → Refund agent: send ₹48,000 to a new bank account, as a Hindi email instructed.
- **Arbiter checks it first** (navy panel): 1 Identity (which agent is acting, verified) · 2 Permissions (allowed tools and limits, ₹5,000 cap) · 3 Language scan (Hindi, Kannada, Hinglish, English) · 4 Chain check (no agent borrows another's powers) · 5 Risk score (0–100, every point explained). Footer: every decision → live dashboard · tamper-proof log · kill switch.
- **The decision, with a reason:** ALLOW · risk 8/100 (within its permissions, no red flags; runs instantly and is logged) · ASK A MANAGER · risk 74/100 (over the ₹5,000 refund limit; approved in one click, can be saved as a new rule) · BLOCK · risk 96/100 (hidden Hindi instruction plus a borrowed power; stopped, and the team sees why).
- Top paragraph now reads: "Arbiter checks every AI agent action before it runs. It verifies the agent's permissions and limits, catches hidden instructions in Hindi, Kannada, Hinglish or English, stops agents from borrowing each other's powers, and scores risk from 0 to 100. Safe actions run, risky ones wait for one-click manager approval, harmful ones are blocked with a plain reason, and every decision is logged."


_Earlier status: full explanation written (19 Oct). Slide layout to be drafted next. Project name still to choose (see Slide 1)._

# Slide plan: what goes ON the Solution slide (19 Oct)

**Rule for slides 3, 4 and 5:** each slide answers one question.
- **Slide 3, Solution:** *What is it, and why is it different?* No tech names, no pipeline steps.
- **Slide 4, Technical:** *How does it decide?* Tools, decision pipeline, risk score.
- **Slide 5, Diagram:** *How do the parts connect, and what does one real attack look like?*
- **Slide 6, Impact:** *How do we prove it works?* This is where the testing plan and results go.

## The big idea (for judges in 5 seconds)
**Airport security for AI agents.** Every action an agent tries has to pass a checkpoint first. Safe actions fly through, risky ones wait for a manager, harmful ones never take off.

| Airport | Our solution |
|---|---|
| Passport check | **Who is this agent?** (identity) |
| Baggage X-ray | **What is it carrying?** Hidden instructions in *any* language |
| Boarding pass rules | **Is it allowed?** Permission list and limits |
| Connecting flight | **No borrowed powers.** Your ticket doesn't upgrade because the next flight is business class |
| Security officer | **Human approval**, only for high-risk actions |
| Control tower / CCTV | **Live dashboard** and tamper-proof log |
| "Ground all flights" | **Kill switch** |

You don't need airport pictures on the slide. The metaphor is for **speaking** to judges and for the docs site. The slide uses a simple gate/shield shape.

## Layout (16:9), top to bottom

**1. Title row**
- Template title: **Solution Overview**
- Tagline on the right, in quotes like slide 2. Pick one:
  - *"We don't stop AI agents. We stop accidents."* ← recommended
  - *"Agents get autonomy. You keep control."*
  - *"Let agents act. Make them ask when it matters."*
  - *"Speed of AI. Judgement of a manager."*
  - *"Your agent can still be fast. It just can't be reckless."*

**2. One-liner box** (thin border, 2 lines max)
> **Arbiter** is a checkpoint between AI agents and your business. Every action an agent tries is checked **before it runs, in any language**. Safe actions go through, risky ones wait for a manager, harmful ones are blocked, and every decision is explained.

**3. Centre visual: the flow (the main thing judges look at)**
```
 [ AI Agents ]  ──every action & message──►  [ CHECKPOINT ]  ──►  🟢 Allow        → runs instantly
  Support · Billing                          Who? · Which language?   🟡 Ask a human → manager approves in 1 click
  · any agent                                Allowed? · How risky?    🔴 Block       → alert + reason
                         ───────────── Live dashboard · Audit log · Kill switch ─────────────
```
Shapes:
- **Left:** 3 small robot/agent icons stacked, labelled "AI Agents".
- **Middle:** a **shield or gate shape** (biggest element on the slide, in your accent colour) titled "Checkpoint", with 4 tiny chips inside: *Who? · Which language? · Allowed? · How risky?*
- **Right:** **traffic light** of 3 circles (green / amber / red). Each has a short label and a 3–5 word result.
- **Under everything:** one thin grey bar: *Live dashboard · Audit log · Kill switch*.

**4. Bottom row: 4 cards titled "Only in Arbiter"** (icon + 3-word title + one line)
| Icon (Lucide / Flaticon name) | Card title | One line |
|---|---|---|
| `languages` / globe | **Reads every language** | Catches hidden instructions in Hindi, Kannada, Hinglish and mixed scripts |
| `link-2` / chain | **No borrowed powers** | An agent can't get another agent to do what it isn't allowed to do |
| `user-check` | **Approve & teach** | One click turns a manager's "yes" into a new rule |
| `message-square-text` | **Explains like a manager** | Every block comes with a reason anyone can read |

**5. Footer line (small, bold)**
*"Other tools filter what AI **says**. We control what AI **does**."*

**What NOT to put on this slide:** tech stack, pipeline steps, risk formula (slide 4); architecture (slide 5); test numbers (slide 6).

## Optional visuals
- **Hero illustration prompt** (for an AI image tool; keep text out of the image and add words in PPT, because image tools garble Hindi/Kannada script):
  > Flat vector illustration on a white background: three friendly robot assistants walking toward a glowing security gate with a shield emblem. Beyond the gate are simple icons of a database, a payment card and an email envelope. The first robot passes under a green light, the second waits at an amber light next to a human manager holding a tablet, the third is stopped by a red barrier. Navy and blue palette with green, amber and red accents. Minimal, clean, presentation style, no text.
- **Icons:** use one icon set for the whole deck (Lucide or Flaticon "line" style) so it looks designed.
- **Colours:** keep green / amber / red **only** for allow / ask / block across all slides. Judges will learn the code by slide 5.

## If you have space (or for the docs site): comparison matrix
Based on each project's public README / article (Oct 2026). "–" means not described there.

| Capability | mcp-firewall | agent-guardrail | A2A Firewall | AgentGuard | **Us** |
|---|---|---|---|---|---|
| Checks actions before they run | ✓ | ✓ | ✓ | ✓ | **✓** |
| Per-agent permission list with limits | ✓ | ✓ | partial | ✓ | **✓** |
| Controls agent-to-agent messages | – | – | ✓ | ✓ | **✓** |
| Indian-language / Hinglish injection detection | – | – | – | – | **✓** |
| Human approval | ✓ | ✓ | partial | – | **✓ (high risk only)** |
| "Approve & make it a rule" | – | – | – | – | **✓** |
| Reasons a non-technical manager can read | – | partial | – | – | **✓** |
| Dashboard | ✓ | – | ✓ | – | **✓** |
| Undo an action / check agent's claims | – | – | – | – | **roadmap** |

---

# Signature features: combining the best and filling the gaps
For the docs site. Pick the top 4 for the slide (done above).

| # | Our feature | Who has a version today | What's missing there | What we add |
|---|---|---|---|---|
| 1 | **Polyglot Shield** (multilingual injection detection) | Pipelock normalises encodings (English patterns) | No Indian languages, Hinglish or mixed-script handling in any project we read | Script/language detection per sentence, invisible-character and look-alike-letter cleanup, translation, then scanning **both** the original and the translation. Backed by language-blind action checks |
| 2 | **No Borrowed Powers** (delegation chain) | A2A Firewall (attenuated scope), AgentGuard ("powers only shrink downstream") | Built for security engineers, no visual explanation, not tied to the user's original request | Effective permission = intersection along the whole chain **and** fit with the customer's original request. Shown as a red edge on the live agent map |
| 3 | **Intent Lock** (action must fit the request) | LlamaFirewall AlignmentCheck, A2A "intent drift" (LLM, opaque) | Black-box LLM judgement, slow, no explanation | Deterministic request→allowed-actions map first; LLM judge only for unclear medium-risk cases; the reason is shown ("asked about delivery, tried delete_record") |
| 4 | **Trust Tags** (untrusted-data tracking) | A2A Firewall lineage; Google DeepMind CaMeL (research) | Heavy or research-only | Simple tags on anything from outside (emails, web, other agents). Tags travel across agents. High-risk actions built from tagged data get escalated |
| 5 | **Approve & Teach** | mcp-firewall, agent-guardrail (approve/reject prompts) | No learning, no escalation, no preview | Plain-language card + preview of the effect + Approve once / Reject with reason / **Approve & make it a rule**. Timeout means reject |
| 6 | **Explain Like a Manager** | agent-guardrail rule messages ("amount=9999 exceeds cap") | Engineer-speak | One-sentence human reason + risk factor bars on every decision |
| 7 | **Receipts & Reality Check** | mcp-firewall, A2A (signed logs) | Nobody checks if the agent *tells the truth* about what it did | Hash-chained log + compare the agent's final message ("Refund done!") with what actually happened → flag false claims (remember Replit "lied") |
| 8 | **Tripwire records** (honeytokens) | A2A Firewall (honeytoken traps) | Rarely used | Fake "canary" customer records; any agent that reads/exports them triggers an instant alert |
| 9 | **Circuit breaker & quarantine** | mcp-firewall kill switch; A2A cascade quarantine | Manual only, or engineer-oriented | Kill switch (all / one agent / one tool) + auto-pause after N blocks + isolate one compromised agent while others keep working |
| 10 | **Shadow mode for new rules** | — | Not found | New rules run "watch-only" first: "this rule would have blocked 7 actions last week" before switching on |
| 11 | **Plain-English policies** | — | Rules need YAML/code | Admin types "never refund more than the order value"; we draft the rule, admin confirms, engine enforces deterministically |
| 12 | **Rewind (undo)** | A2A (memory snapshots only) | No project undoes an executed action | Snapshot before reversible actions; one-click rollback in the dashboard |

**MVP for Round 1 (by 20 Oct):** 1 (basic), 2, 5, 6, 9 (kill switch), plus permissions, rules, risk score, dashboard and log.
**Roadmap:** 3 (LLM part), 4, 7, 8, 10, 11, 12. Show them on the slide/docs labelled **"Next"**, so judges see the vision without doubting what's built.

---


# How our solution works, start to end

## 1. Setup (done once by the company)
1. **Register agents:** e.g. *Support Agent* and *Billing Agent*, each with a role and an owner.
2. **List the tools** each agent can use: `lookup_customer`, `issue_refund`, `send_email`, `delete_record`.
3. **Set the permission list and rules:** pick from the built-in rule pack, add custom rules (YAML or the dashboard), and set limits (e.g. refunds up to ₹5,000 are fine, up to ₹50,000 need approval, above that are blocked).
4. **Set who may talk to whom** (Support → Billing yes, Support → Admin no).
5. **Choose approvers** (e.g. the support manager).
6. **Connect:** the developer wraps the agent's tools with our one-line SDK wrapper. The agent's own code doesn't change.

## 2. What happens on every single action (runtime)
The agent decides to do something, like calling a tool or messaging another agent. **Before it runs**, the wrapper sends it to the control layer, which goes through these steps:

| Step | What it does | Example |
|---|---|---|
| 1. Identify | Which agent is this? Is its token valid? | Billing Agent, verified |
| 2. Scan incoming content | Anything that came from outside (customer message, email, web page, tool result, another agent) is tagged **untrusted** and run through the **multilingual scan** (section 3) | Email contains a hidden Hindi instruction, flagged |
| 3. Permission check | Is this agent allowed this tool with these arguments? Unknown tools are denied | Billing may refund, but ₹42,000 is above the auto-limit |
| 4. Rules | Built-in pack plus the company's custom rules | "Refund can't exceed order value" passes; "new bank account" fails |
| 5. Chain check (multi-agent) | If another agent asked for this, is it allowed for **every** agent in the chain? (*no borrowed powers*) | Support asked for it, and Support can't authorise refunds, so it fails |
| 6. Risk score 0–100 | Tool risk + amount + untrusted instructions + intent mismatch + unusual behaviour + agent trust | 92 |
| 7. Decide | 0–39 **allow** · 40–69 **allow + alert** · 70–89 **hold for human** · 90+ or hard rule **block** | **Block** |
| 8. Explain & log | Plain-language reason, saved in a tamper-evident log, shown live on the dashboard | "Blocked: instruction came from an untrusted Hindi email…" |

**If held:** the manager sees an approval card and picks **Approve once**, **Reject** (the reason goes back to the agent), or **Approve & make it a rule**, so the same safe case is auto-approved next time. No answer in time means reject (fail closed).

**Always available:** a kill switch (stop everything, one agent, or one tool), rate limits, and an auto-pause if an agent keeps getting blocked.

## 3. Multilingual injection detection (how it actually works)
Problem: attackers write hidden instructions in Hindi, Kannada, Hinglish or mixed scripts because most filters only read English (see the evidence in the Problem tab).

| Stage | What we do |
|---|---|
| **1. Detect** | Identify the language of each sentence and the script of each word (Devanagari, Kannada, Latin…). Flag **script mixing**, **romanised Hindi (Hinglish)**, and hidden-text tricks: invisible zero-width characters, look-alike letters (Cyrillic "а" vs Latin "a"), and base64 or encoded text |
| **2. Normalise** | Remove invisible characters, map look-alike letters back, and translate non-English parts to English with the open LLM, keeping the original too |
| **3. Scan** | Check **both** the original and the English version against our injection library (phrases like "ignore previous instructions", "send all customer data", "transfer to", written in English, Hindi, Kannada and Hinglish), plus an LLM check: *"Is this text trying to give instructions to the AI?"* |
| **4. Score** | Instructions hidden in untrusted content raise the risk score a lot. A sudden language switch inside one message adds a little risk on its own |

**Safety net (our key message):** even if the scanner misses an attack, the **action** is still checked. A ₹42,000 refund to a new account is blocked by the permission list and limits *whatever language the instruction came in*. Language-blind enforcement plus multilingual detection gives two layers of protection.

_Proposed helper libraries (open-source, allowed by the rules): a language-ID library such as lingua or fastText, and a transliteration library for Indic scripts. The detection logic and scoring are our own._

## 4. How we test it
Every test runs twice with **the same model and the same prompts**: once with the control layer **OFF** and once **ON**.

| Level | What | Why |
|---|---|---|
| **1. Rule tests** | Automated tests for each permission, rule and limit | Proves the engine is correct |
| **2. Our demo business ("ShopCo")** | Support + Billing agents with the 4 tools. Normal tasks plus an attack suite (below) | The main demo for the video and judges |
| **3. Existing open-source agents** | Wrap the **DBOS refund agent** (single agent, LangGraph) and **OpenAI's customer-service agents demo** (6 agents with handoffs) without changing their logic | Proves it works on agents we didn't write |
| **4. Benchmarks** | **AgentDojo** prompt-injection tasks (also translated into Hindi, Kannada and Hinglish), and **τ²-bench** normal retail/airline tasks | Credible numbers: attacks blocked and false alarms |

**Attack suite (ShopCo):**
1. Refund above the limit
2. Bulk delete ("clean up old records")
3. Email the customer list to an outside address
4. Hidden instruction in an English email
5. The same attack in **Hindi**, **Kannada**, **Hinglish**, mixed script, and with invisible characters
6. Support tries to make Billing refund (**borrowed powers**)
7. Agents looping (A → B → A)
8. A fake agent pretending to be Billing

**What we measure:** attacks that succeed (OFF vs ON), false alarms on normal tasks, added delay per action (ms), multilingual catch rate per language, and time to stop a rogue agent. These numbers go on the Impact slide.

**Round 1 reality check:** submission closes 20 Oct. The video only needs Level 2 (ShopCo) with a few attacks, including one multilingual one. Levels 3 and 4 can be presented as "in progress" if they're not finished.

---


## One-liner
**A control layer that sits between AI agents and business systems, and between agents themselves.** It checks every action *before* it runs, allows the safe ones, holds risky ones for a human, blocks harmful ones, and records why.

## How it works (3 steps)
1. **Intercept:** every tool call (`issue_refund`, `send_email`, `delete_record`…) and every agent-to-agent message passes through us first.
2. **Decide:** permission list, then built-in and custom rules, then a 0–100 risk score, giving **Allow / Alert / Hold for approval / Block**.
3. **Show:** a live dashboard with an action feed, alerts, approval queue, agent map, kill switch and audit log.

## Key features (Round 1 build)
- **Per-agent permission list** with limits (e.g. refunds up to ₹5,000; above that needs approval)
- **Built-in rule pack + custom rules** written by the organisation
- **Risk score with plain-language reasons**
- **Human approval only for high risk**, with **"Approve & make it a rule"**
- **Multi-agent control:** who may talk to whom, plus *no borrowed powers*
- **Multilingual injection detection:** Hindi, Kannada, Hinglish, mixed scripts
- **Kill switch, rate limits, audit log**

## What makes us different
| Existing tools | Us |
|---|---|
| Filter what the AI **says** | Control what the AI **does** |
| Check one agent at a time | Check **agent-to-agent** messages and delegation chains |
| English-only filters | **Language-blind** enforcement plus multilingual detection |
| Built for security engineers | **Readable by managers**, with one-click approve & learn |

**Tagline options:** "We're the 'Are you sure?' your AI agent never asks." · "Trust your agents. Verify their actions."

---

## 1. What already exists (so we know where to stand out)

I read the main open-source projects in this space. Short version:

| Project | What it does well | What it lacks |
|---|---|---|
| [mcp-firewall](https://github.com/ressl/mcp-firewall) | MCP proxy, YAML rules per agent, rate limits, kill switch, signed hash-chain audit log, dashboard | No risk scoring, no agent-to-agent control, no data-flow tracking |
| [agent-guardrail](https://github.com/rudimentall1/agent-guardrail) | Deterministic YAML rules (blocked tools, number caps, email domain rules, rate limits), approve/reject web UI | Deliberately no risk score, no injection detection, no multi-agent, no dashboard |
| [AgentWall](https://github.com/anismabaziz/agent-wall) | Permit/prohibit/obligation policies, LangGraph ToolNode replacement, append-only audit | No human approval, no multi-agent, no dashboard |
| [A2A Firewall](https://github.com/mananjp/a2a-firewall) | Closest to our idea: signed agent identity, delegation scopes, loop detection, cascade quarantine, LLM "intent drift" | Very new (1 star, mostly beta), aimed at security engineers, no manager-friendly view |
| [AgentGuard](https://dev.to/nizba06/agentguard-11-an-open-source-firewall-for-inter-agent-ai-messages-29el) | Inspects agent-to-agent messages, signed hops, "permissions can only shrink downstream" | ML check is slow (~3.4 s), no approvals, no audit UI |
| Pomerium / agentgateway / Kong ([comparison](https://www.pomerium.com/blog/top-5-agentic-gateways-for-securing-mcp-tool-calls-in-2026)) | Identity, tool-level allow/deny, OAuth | Infrastructure gateways, little intelligence about *what* the action means |
| NeMo Guardrails, Guardrails AI, LlamaFirewall | Filter what the model *says*; LlamaFirewall checks goal alignment | Not built for controlling business *actions* end to end |

**Common everywhere:** allow/block before the action runs, logging, regex scanning.
**Rare or missing across all of them** (this is our opening):
- Control of messages *between* agents (only two tiny projects do it)
- Checking the action against what the user actually asked for (only two, both opaque ML)
- Explanations a non-technical manager can understand (none)
- Undoing an action after it ran (none)
- Checking whether the agent really did what it claims ("refund issued") (none)
- Smart human approvals: escalation, preview, "approve and make a rule" (none)

So **multi-agent control is a strong headline, but not unique on its own**. Two small projects already exist. Our pitch should be the *combination*: multi-agent control + risk-based approvals + plain-language explanations + undo, built for business managers rather than security engineers.

---


## 3. Feature list

Priority: **R1** = build before the 20 Oct Round 1 submission (MVP + demo video), **F** = build at the 36-hour finale, **S** = stretch.

### A. Interception (how agents connect)
| # | Feature | Priority |
|---|---|---|
| A1 | Python SDK: one-line wrapper around any tool function (`guard.tool(issue_refund)`), so the call is checked before it runs | R1 |
| A2 | Adapters for the agents we test on: LangGraph ToolNode, OpenAI Agents SDK tools and handoffs | R1 / F |
| A3 | REST API (`POST /check`) so any language or framework can use it | F |
| A4 | MCP proxy mode (sits in front of MCP servers, no code change) | S |
| A5 | **Fail-closed**: if the control layer is down or slow, high-risk actions are denied, not allowed | R1 |

### B. Agent identity and registry
| # | Feature | Priority |
|---|---|---|
| B1 | Every agent is registered with an ID, role (Support, Billing, Admin), owner and allowed tools | R1 |
| B2 | Each agent gets a signed token; unregistered or impersonating agents are blocked | F |
| B3 | **Trust score per agent** (starts at 100, drops on blocked or flagged actions, recovers slowly). Lower trust means stricter thresholds | F |

### C. Permission list (your item 7)
Per agent role × per tool, with conditions on the arguments. Example for the four tools:

| Tool | Support agent | Billing agent | Admin agent | Built-in conditions for everyone |
|---|---|---|---|---|
| `lookup_customer` | Allow (phone and address masked) | Allow | Allow | Max 30 lookups/min; one customer per request; bulk export blocked |
| `issue_refund` | **Deny** (must ask Billing) | Allow up to ₹5,000; ₹5,000 to ₹50,000 needs approval; above ₹50,000 blocked | Same as Billing | Daily refund cap per agent; refund cannot exceed the order value; one refund per order |
| `send_email` | Allow only to the customer on record | Allow only to the customer on record | Allow | External domains blocked unless listed; no customer lists or bulk PII in body; max 20/hour |
| `delete_record` | **Deny** | **Deny** | Always needs approval | Soft delete only; more than one record per call blocked |

Unknown tools are **denied by default**.

### D. Rules: built-in pack + custom (your item 7)
| # | Feature | Priority |
|---|---|---|
| D1 | **Built-in rule pack** mapped to the OWASP Top 10 for Agentic Applications: bulk delete, data export to outside, mass email, refund above limit, repeated identical calls (loops), destructive SQL/commands, secrets in arguments, actions at unusual hours | R1 |
| D2 | **Custom rules in simple YAML** written by the organisation (see sample in section 5) | R1 |
| D3 | **No-code rule builder** in the dashboard (pick tool → condition → action) | F |
| D4 | **Plain English → rule**: admin types "Never refund more than the order value", an LLM drafts the YAML, the admin confirms it. Enforcement stays deterministic, our own engine | F |
| D5 | **Test a rule on past logs** before turning it on ("this rule would have blocked 7 of last week's actions") | S |
| D6 | Rule priority: hard deny always wins over allow | R1 |

### E. Risk scoring (our own logic)
Each action gets a 0 to 100 score with the reasons listed.

```
risk = tool base risk            lookup 10, email 30, refund 40, delete 60
     + argument risk             big amount, external recipient, PII in body, many records
     + context risk              instructions came from untrusted content (see F)
     + intent mismatch           action doesn't fit the user's request (see G)
     + behaviour anomaly         sudden spike, first-time tool, odd hour
     + agent trust penalty       (100 − trust score) / 5
```

| Score | Level | Decision |
|---|---|---|
| 0 to 39 | Low | **Allow** and log |
| 40 to 69 | Medium | **Allow with alert**, or auto-fix (e.g. mask PII) |
| 70 to 89 | High | **Hold for human approval** (your item 8) |
| 90+ or a hard rule hit | Critical | **Block** and alert |

### F. Untrusted-content tracking ("trust tags")
Inspired by Google DeepMind's [CaMeL](https://arxiv.org/abs/2503.18813) and the [Trail of Bits multi-agent hijacking research](https://blog.trailofbits.com/2025/07/31/hijacking-multi-agent-systems-in-your-pajamas/), simplified so we can build it.

| # | Feature | Priority |
|---|---|---|
| F1 | Anything that comes from outside (customer emails, web pages, tool results, other agents) gets tagged **untrusted** | F |
| F2 | If a high-risk action's arguments came from untrusted content (e.g. the email address in `send_email` was taken from an incoming email), risk goes up sharply | F |
| F3 | Scan tool results for hidden instructions ("ignore your rules…") before they reach the agent | R1 (simple patterns) / F |
| F4 | Tags **travel with messages between agents**, so a "poisoned" agent can't launder bad data through a clean one | F |
| F5 | **Multilingual injection detection**: detect language and script mixing (Hindi, Kannada, Hinglish, romanised text, mixed scripts), normalise or translate, then scan. Evidence in the Problem tab | R1 |

### G. Intent-vs-action check
| # | Feature | Priority |
|---|---|---|
| G1 | Keep the original user request for each session | R1 |
| G2 | Before a medium+ risk action, check: does this action fit the request? ("Where is my order?" → `delete_record` = mismatch). Start with a tool-to-intent map, add a small LLM judge for unclear cases | F |
| G3 | The check follows the **whole chain**: if Support asks Billing to refund, Billing's action is checked against the *customer's* original request | F |

### H. Multi-agent communication control (headline feature, your item 9)
| # | Feature | Priority |
|---|---|---|
| H1 | **Message bus**: every agent-to-agent message and handoff goes through the control layer | R1 (2 agents) |
| H2 | **Communication matrix**: who may talk to whom (Support → Billing yes; Support → Admin no) | R1 |
| H3 | **No borrowed powers**: when A asks B to act, the action must be allowed for *both* A and B and fit the original user's request. Stops the "confused deputy" attack (OWASP ASI03/ASI07) | R1 |
| H4 | **Message inspection**: injected instructions, PII going to an agent with lower clearance | F |
| H5 | **Loop and storm detection**: A → B → A cycles, too many messages, delegation deeper than N hops | F |
| H6 | **Signed messages** so one agent can't pretend to be another | F |
| H7 | **Cascade quarantine**: isolate one compromised agent (cut its links) while the rest keep working | F |
| H8 | **Live agent map** in the dashboard: agents as nodes, messages as edges, turning red when blocked | R1 (basic) / F |

### I. Human approval for high risk (your item 8)
| # | Feature | Priority |
|---|---|---|
| I1 | Approval queue in the dashboard; the agent waits | R1 |
| I2 | **Plain-language action card**: "Billing Agent wants to refund ₹42,000 to Ravi K. Risky because: above ₹5,000 limit, request came from an unverified email." | R1 |
| I3 | Choices: Approve once / Reject with reason (reason goes back to the agent) / **Approve and create rule** | R1 |
| I4 | **Timeout = reject** (fail closed) | R1 |
| I5 | **Preview before approve** (dry run): "This will delete 1 record: customer #1042" | F |
| I6 | Notifications on Telegram or email; escalation to a senior approver if nobody answers | S |

### J. Limits, kill switch, undo
| # | Feature | Priority |
|---|---|---|
| J1 | Rate limits and budgets per agent and tool (e.g. ₹50,000 refunds/day) | R1 |
| J2 | **Kill switch**: stop everything, pause one agent, or disable one tool | R1 |
| J3 | **Circuit breaker**: auto-pause an agent after N blocked actions in M minutes | F |
| J4 | **Undo** for reversible actions (restore soft-deleted record, reverse refund in the mock system). No existing project does this | S |
| J5 | **"Did it really do it?"**: compare what the agent tells the user ("refund done") with what the log shows actually happened | S |

### K. Dashboard and audit (PS deliverable 3)
| # | Feature | Priority |
|---|---|---|
| K1 | Live action feed with colour-coded decisions | R1 |
| K2 | Alerts panel | R1 |
| K3 | Approval queue | R1 |
| K4 | Agent map (see H8) | R1 basic |
| K5 | Per-session **timeline replay**: every step, decision and reason | F |
| K6 | **Tamper-evident audit log**: each entry includes a hash of the previous one, so edits are detectable | F |
| K7 | Policy editor (YAML + no-code) | F |
| K8 | Stats: actions checked, blocked, approved, average added latency | F |
| K9 | Export audit report as PDF/CSV for compliance | S |

### L. Proof it works (red-team scorecard)
| # | Feature | Priority |
|---|---|---|
| L1 | A library of attack scenarios: prompt injection in email, over-limit refund, bulk delete, data export, agent impersonation, delegation abuse, A→B→A loop | R1 (5 scenarios) |
| L2 | Run each scenario **with and without** our layer; show attack success rate, false alarms on normal tasks, and added latency | F |
| L3 | Use [AgentDojo](https://github.com/ethz-spylab/agentdojo)'s ready-made injection attacks for a credible number | S |

---


## Why multilingual detection is a layer, not the whole product
## Recommendation
Add it, but **as a layer of the control system, not as the whole product.** Two reasons:
1. It fits the judging criteria well. "Impact & Inclusivity" rewards it, and an India angle (Hindi, Kannada, Hinglish customers) is something no project I reviewed covers.
2. On its own it's a detector. PS 2.1 asks for control of **actions**, so the strongest story is both of these:
   - **Language-blind enforcement:** a ₹50,000 refund or a bulk delete is blocked no matter what language the instruction came in, because permissions and limits check the action, not the words.
   - **Multilingual detection:** scan messages, emails and tool results in any language or mixed script, and raise the risk score when they contain hidden instructions.

Pitch line: *"Attackers switch to Hindi or Zulu because filters only read English. Our control layer checks the action itself, so the language doesn't matter."*


## 6. Answer to your question 10 (PS 2.1 vs 2.2)

Keep data-leak protection as **one rule type among many** (e.g. "no customer PII in emails to outside domains"). Don't build a deep, context-aware privacy classifier; that is PS 2.2. Our story is about **controlling actions**, and data leaks are just one kind of harmful action.

---


## 8. Pitch lines for the PPT

- "Existing guardrails watch what an AI **says**. We control what it **does**, and what agents **tell each other**."
- "No borrowed powers: an agent can never get another agent to do what it isn't allowed to do itself."
- "Built for managers, not just security engineers: every decision comes with a reason anyone can read."


## Sources
- [5 open source tools for AI agent governance in 2026](https://dev.to/jagmarques/5-open-source-tools-for-ai-agent-governance-in-2026-54le)
- [Open source AI firewall: LLM vs agent vs gateway](https://pipelab.org/learn/open-source-ai-firewall/)
- [OWASP Top 10 for Agentic Applications (Cycode summary)](https://cycode.com/blog/owasp-top-10-agentic-applications/)
- [SEAgent: mandatory access control for agent privilege escalation](https://arxiv.org/abs/2601.11893)
- [Enforce least privilege in multi-agent AI chains using Cedar (AWS)](https://aws.amazon.com/blogs/security/enforce-least-privilege-authorization-in-multi-agent-ai-chains-using-cedar/)
