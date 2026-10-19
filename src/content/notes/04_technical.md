# Slide 4 · Technical Approach

**Status:** slide plan added (19 Oct). Stack confirmed (Python + React, open models on Groq with Ollama as backup). Library picks are proposals.

**In the Canva deck (19 Oct):** slide 4 is built and saved in the team deck from the plan below (preview: `ps21/canva_previews/slide4_preview.png`).


_Earlier status: draft. Stack confirmed (Python + React, open models on Groq with Ollama as backup). Library picks are proposals._

# Slide plan: what goes ON the Technical Approach slide (19 Oct)

**Question this slide answers:** *How does it decide, and what is it built with?*

## Layout (16:9)

**1. Title row:** **Technical Approach**. Tagline (pick one):
- *"Rules first, AI second: fast, explainable, hard to fool."* ← recommended
- *"Deterministic where it matters. Smart where it helps."*

**2. Top row: the template's Tool1 / Tool2 / Tool3 boxes** (add logos as pictures)
| Box | Title | One line under it | Logo |
|---|---|---|---|
| Tool 1 | **Python · FastAPI** | Control engine: policies, risk score, multilingual scanner, agent message bus | Python + FastAPI logos |
| Tool 2 | **React** | Live dashboard: action feed, approvals, agent map, kill switch | React logo |
| Tool 3 | **Open-source LLM** (Llama / Qwen) | Translation and intent checks. Runs on Groq, or offline with Ollama | Meta Llama / Qwen + Groq / Ollama logos |

**3. Middle: the decision pipeline as 7 chevrons (left → right).** It's a real sequence, so numbering is fine.
```
① Identify ▸ ② Scan (any language) ▸ ③ Permissions ▸ ④ Rules ▸ ⑤ Chain check ▸ ⑥ Risk score ▸ ⑦ Decide & log
```
- 2–4 words under each chevron: *agent token* · *Hindi, Kannada, Hinglish* · *allowed + limits* · *built-in + custom* · *no borrowed powers* · *0–100* · *allow / ask / block*
- **Callout under chevron ②** (small rounded box): *Detect script → clean hidden tricks → translate → scan both*

**4. Bottom-left: the risk score visual** (worked example as a stacked bar)
```
Refund tool  40 │ Above ₹5,000 limit +20 │ Instruction from untrusted Hindi email +25 │ New bank account +10  = 95 → 🔴 BLOCK
```
With a threshold strip under it:
`0–39 🟢 Allow · 40–69 🟢 Allow + alert · 70–89 🟡 Ask a human · 90+ 🔴 Block`

**5. Bottom-right: 3 design principles** (small icon + 1 line each)
- **Rules first, AI second:** most checks are instant rules; the LLM only helps on unclear cases
- **Fail-closed:** if the checkpoint is down or unsure, risky actions don't run
- **One-line integration:** LangGraph, OpenAI Agents SDK, REST API (MCP next)

**What NOT to put here:** the architecture diagram (slide 5), why it matters (slides 2/3), test results (slide 6).

---


## Stack (the template has Tool1 / Tool2 / Tool3 boxes)
| Box | Tool | Role |
|---|---|---|
| Tool 1 | **Python + FastAPI** | Control layer API, policy engine, risk scorer, message bus |
| Tool 2 | **React** | Dashboard: live feed, approvals, agent map, policy editor |
| Tool 3 | **Open-source LLM (Llama/Qwen class) on Groq, with Ollama offline** | Test agents, plus intent check and multilingual translation |
| Extra | **LangGraph · OpenAI Agents SDK** | Frameworks of the open-source agents we wrap |
| Extra | **SQLite** | Audit log (hash-chained), approvals, policies |
| Extra | **YAML** | Organisation-written policies |

## Decision pipeline (our own logic)
1. **Identify** the agent (registered ID, role, signed token)
2. **Permission check**: is this agent allowed this tool with these arguments? Default deny.
3. **Rules**: built-in pack (bulk delete, data export, mass email, loops…) plus custom YAML
4. **Multilingual scan**: detect language and script mixing, normalise, check for hidden instructions
5. **Risk score 0–100** = tool risk + argument risk + untrusted-content risk + intent mismatch + anomaly + agent-trust penalty
6. **Decide**: 0–39 allow · 40–69 alert · 70–89 hold for human · 90+ or hard rule = block
7. **Log** with a plain-language reason. The dashboard updates live.

## Multi-agent controls
- Communication matrix (who may message whom)
- **No borrowed powers:** a delegated action must be allowed for *every* agent in the chain
- Loop detection (A → B → A), message rate limits, quarantine of a compromised agent

## Integration
- One-line SDK wrapper around tool functions
- Adapters for LangGraph ToolNode and OpenAI Agents SDK handoffs
- **Fail-closed:** if the layer is down, high-risk actions are denied

---

## 4. Agents to test on (your item 11)

| Agent | Why | Shape | Notes |
|---|---|---|---|
| **[DBOS refund agent](https://docs.dbos.dev/python/examples/customer-service)** | Simplest to wrap: one LangGraph agent, all tools run through a single ToolNode; already does refunds | Single agent | Python + LangGraph; uses OpenAI by default. Licence not yet checked |
| **[OpenAI customer-service agents demo](https://github.com/openai/openai-cs-agents-demo)** | Six agents (Triage, Booking, Refunds, …) that hand off to each other: perfect for showing the multi-agent controls | Multi-agent with handoffs | MIT; needs an OpenAI API key as shipped; has only basic relevance and jailbreak guardrails |
| **[AgentDojo](https://github.com/ethz-spylab/agentdojo)** or **[τ²-bench](https://github.com/sierra-research/tau2-bench)** | Not agents to demo, but test harnesses: AgentDojo gives injection attacks to measure blocking, τ²-bench gives normal retail/airline tasks to measure false alarms | Benchmark | Both MIT, Python |

Plan: build our own small **reference business** ("ShopCo") with your four tools and a Support + Billing agent for the main demo, then show the same control layer wrapping the DBOS agent and the OpenAI multi-agent demo with no changes to their logic. That proves it is a general layer, not a demo trick.

---


## 5. Sample custom policy (what an organisation would write)

```yaml
agents:
  support_agent:
    role: support
    can_message: [billing_agent]
  billing_agent:
    role: billing
    can_message: [support_agent]

tools:
  issue_refund:
    base_risk: 40
    allow_roles: [billing, admin]
    rules:
      - if: amount > 50000          then: block
      - if: amount > 5000           then: require_approval
      - if: amount > order.total    then: block
    limits: { per_agent_per_day: 50000 }

  send_email:
    rules:
      - if: recipient != customer.email_on_record   then: require_approval
      - if: body contains customer_list             then: block

  delete_record:
    allow_roles: [admin]
    rules:
      - if: count > 1   then: block
      - always:         require_approval
```

---

## Slide 4 as built in the Canva deck (saved 19 Oct 2026)

Top label: "How every agent action flows through Arbiter · what each step does, and the tech behind it". Eight feature cards in workflow order, then a "Built with" strip. Quote kept: "Rules first. AI only when unsure. Fail-closed, always."

| # | Step | What it does | Tech behind it |
|---|---|---|---|
| 1 | Intercept | Every tool call or agent-to-agent message is caught before it runs; the agent waits for a verdict | Python SDK wrapper · LangGraph & OpenAI Agents SDK adapters · REST API |
| 2 | Identify | Which agent, what role, and who asked (a human or another agent) | Agent registry · signed agent tokens · FastAPI |
| 3 | Multilingual scan | Hindi, Kannada and Hinglish inputs: strip hidden characters, translate, scan both versions for injection | Script detector + normaliser · Llama / Qwen on Groq (Ollama offline) |
| 4 | Permissions | Is this tool, with these arguments and limits, allowed for this agent? Default deny | Per-agent allow-lists in YAML |
| 5 | Rules | Built-in rule pack plus company rules, e.g. refunds over ₹5,000 need approval | Python rule engine · company policies written in YAML |
| 6 | Chain check | Every agent in the request chain must hold the power (no borrowed powers); loop detection; who may message whom | Agent message bus · communication matrix · loop detector |
| 7 | Risk score | All factors combined into a 0–100 score | Python scorer · LLM intent check only when rules are unsure |
| 8 | Decide & log | 0–39 allow, 40–69 allow + alert, 70–89 human approval, 90+ block; the reason is saved | React dashboard (approvals, kill switch) · hash-chained SQLite log |

Built with: Python · FastAPI (control engine & REST API) · React (live dashboard & approvals) · Llama / Qwen (on Groq, Ollama offline) · SQLite + YAML (audit log, company policies) · Agent frameworks (LangGraph, OpenAI Agents SDK).

Design: 8 cards (4 + 4) joined by arrows, final "Decide & log" card in red; navy stack strip at the bottom. Preview: ps21/canva_previews/slide4_workflow_preview.png.
