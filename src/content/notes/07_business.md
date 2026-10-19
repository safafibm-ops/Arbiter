# Slide 7 · Business Impact & Scalability

**Status:** draft. Market-size number still needed from a trusted source (don't invent one).

## Business value
- **Cost avoided:** shadow-AI breaches cost **$4.63M** on average (IBM 2025), and **35%** of firms with agent incidents reported financial losses (Cloud Security Alliance, 2026).
- **Faster adoption:** companies can switch on AI agents sooner when risky actions need approval.
- **Compliance evidence:** a tamper-evident audit log is ready for auditors.

## Revenue model (proposal)
- **Open-core:** free SDK and basic rules, to drive adoption among developers
- **SaaS per agent / per 1,000 actions checked:** hosted dashboard, approvals, alerts
- **Industry policy packs:** banking, healthcare and e-commerce rule sets
- **Enterprise:** on-premise / offline deployment with local models

## Target customers
- SMEs and startups using AI agents for support, billing or operations
- BPOs and customer-service companies running many agents
- Fintech / e-commerce, where refunds and payments make agent errors costly

## Market opportunity
- **82%** of organisations already use AI agents, but only **44%** have policies to secure them (SailPoint, 2025)
- **97%** of enterprises expect a major AI-agent incident within a year, yet only **6%** of security budgets go to it (Arkose Labs, 2026)
- _TODO: add a market-size figure for AI agent security from a trusted analyst source_

## Scalability
- **Use cases:** any tool or agent framework via the SDK, adapters, REST API and (later) an MCP proxy
- **Users:** multi-tenant dashboard, with role-based approvers
- **Locations / languages:** language-blind enforcement plus pluggable language support
- **Load:** checks are mostly rules (fast); the LLM is used only for unclear, medium-risk cases

## Slide 7 as built in the Canva deck (saved 19 Oct 2026)
- Headline: "Every company that gives AI agents real power will need a checkpoint."
- Why now: 82% use AI agents, 44% have policies (SailPoint 2025) · 97% expect a major AI-agent incident, 6% of budgets (Arkose Labs 2026) · $4.63M average shadow-AI breach (IBM 2025).
- Value for the customer: losses avoided (₹1,68,500 stopped in test run) · approvals shrink ("Approve & make it a rule") · audit-ready (tamper-evident log).
- Revenue ladder: 1 Free SDK → 2 Cloud dashboard (per agent or per 1,000 checks) → 3 Industry packs (e-commerce, fintech, health) → 4 Enterprise (on-premise, offline, open models).
- First buyers: D2C and e-commerce brands, fintechs and BPOs running support or billing agents.
- How it scales: Use cases (SDK + REST API; adapters next) · Users (multi-company dashboard, role-based approvers) · Languages (pluggable scanner) · Load (rules first, under 2 ms).
- Roadmap: Now (7-step checkpoint, Polyglot Scanner, approvals, audit log) · Next (framework adapters, live LLM agents, Indic AgentDojo) · Later (MCP proxy, shadow mode, plain-English rules, undo).
- Placeholders for Faf: four scaling icons.
