# Slide 1 · Title

**Status:** waiting on team details

| Template field | Fill in |
|---|---|
| Team Name | _TBD_ |
| Member 1 (Team Leader) | _TBD_ |
| Member 2 | _TBD_ |
| Member 3 | _TBD_ |
| Member 4 | _TBD_ |
| Team Leader Email | _TBD_ |
| Team Leader Phone | _TBD_ |
| College Name | _TBD_ |
| Problem Statement ID | **PS 2.1 · AI Agent Safety and Control** (Theme 2: AI & Digital Trust / Responsible AI) |

## Project name
**Placeholder used across all slides: `[Project Name]`** (19 Oct). Replace it everywhere once the team picks a name.

**Project name chosen (19 Oct): Arbiter.** An arbiter is the one with the final say, who rules on each case and gives a reason. That matches what the product does: it judges every agent action (allow / ask a manager / block) and explains the verdict. Tagline idea: "Every agent action, judged before it runs." Replaced in the Canva deck on slides 3 and 5. Other names considered: Bastion, Custos, Governor (and earlier Dwarpal, Niyantra, Anumati, Vigil). Trademarks and domains not checked yet.

### Name ideas (pick one)
- **Lakshman Rekha**: the line an agent cannot cross. A strong Indian hook that judges will remember.
- **Dwarpal**: Sanskrit for "gatekeeper". Short and memorable.
- **Leash**: "Let agents run, on a leash."
- **AgentGate**: plain and descriptive.
- Avoid **AgentGuard**, **AgentWall** and **Kavach**, because those names are already used by other products.

## Reminders from the rulebook
- Don't change the template's existing content. Only fill it in.
- Rename the file to your team name before submitting.
- Submit on Unstop by **20 Oct 2026**.

---

## Mapping to the Round 1 judging criteria (rulebook p9)

- **Innovation & originality:** go beyond a plain allow/deny list. Ideas: checking *intent vs action* ("user asked to check an order, agent is deleting records"), a risk score with a plain-language reason, a "dry run / preview" of what an action will change, undo/rollback for reversible actions, learning each agent's normal behaviour. Judges may know existing tools (e.g. NeMo Guardrails, Llama Guard, Guardrails AI), so be ready to say how yours differs; most of those focus on what the AI *says*, while this PS is about what the agent *does*.
- **Technical feasibility:** a tool-call gateway is very buildable (works with function calling or MCP). Keep the business systems mocked.
- **Impact & inclusivity:** small and mid-size companies adopting AI agents can't afford enterprise security teams; plain-language alerts let non-technical managers supervise agents.
- **Clarity:** one scenario, one flow diagram, one dashboard.
- **Bonus, business model:** SaaS priced per agent or per action checked, open-core, and compliance reports (audit trails help with laws like India's DPDP Act).


## Rulebook points that matter for you

- **Deadline: registration and Round 1 PPT close on 20 October 2026** on Unstop (two days from 18 Oct).
- Round 1 = PPT on the **official template** (don't change the template's content), **one PS per team**.
- A **GitHub link of an MVP plus a Drive link with a demo video carries extra weightage.** Even a small working gateway + dashboard will help.
- PPT must cover: team name and members; leader's email, phone and college; problem statement; solution summary; technical approach and flow diagrams; impact and benefits; business impact; market potential and scalability.
- Top 30 announced **4 Nov**, then RSVP.
- Finale: Sahyadri campus, Mangaluru, 36 hours, **12 Nov 11:00 AM to 14 Nov 2:30 PM**, ₹250 per person, everyone must stay on campus, and **all team members must attend** (certificates only for those present).
- Final judging 14 Nov: initial judging 9:00 to 11:30 AM, top 10 pitch 12:00 to 1:30 PM, winners from 2:30 PM.
- Final submission: GitHub repo, working demo, short pitch deck.
- Rules: max 4 per team, all from the same institute; work must be original (no old project reuse); open-source tools and libraries are allowed; no collaboration with other teams.
- Contacts: Pranam N Kotian and Sathvik V Shetty (phone and email on rulebook p11).


## Questions to ask the organisers

**Ask these first (they change what you build):**

1. Do we need to build the AI agent ourselves, or only the safety layer around it? Can the agent be simple or partly scripted for the demo?
2. Can the "business systems" be mocked (fake CRM, payments, email), or do you expect real integrations like Gmail, Slack or a real database?
3. The rulebook says problem statements are released at 11 AM on 12 Nov. Will finalists keep PS 2.1, or get a new or modified statement at the finale?
4. Can we keep building on our Round 1 MVP code during the finale, or does "no old project reuse" mean starting fresh?
5. Are paid AI APIs (OpenAI, Claude, Gemini) allowed, or should we use open or local models? Will venue Wi-Fi support cloud APIs, and are any credits provided?

**About scope of PS 2.1:**

6. Do you expect prevention *before* the action runs, or is detecting and alerting after the fact also acceptable?
7. Should organisations be able to write their own rules/policies, or is a fixed set of built-in rules enough?
8. Is human-in-the-loop approval (pausing an action for a manager) something you specifically want to see?
9. Single agent or multiple agents? Should we handle agents talking to each other?
10. PS 2.2 covers data privacy. If our system blocks data leaks by agents, where is the line between 2.1 and 2.2?
11. Is there an agent framework or standard you'd like supported (MCP, OpenAI function calling, LangChain), or is it our choice?
12. Can we use existing open-source guardrail libraries inside our solution, or must the core detection logic be our own?

**About evaluation and submission:**

13. Will judges try to break the system live with their own attack prompts?
14. Do you want measured results (e.g. % of harmful actions blocked, false alarm rate)? Is there a dataset or benchmark you recommend?
15. Round 1 MVP: how complete should it be? Is there a maximum demo video length, and must the GitHub repo be public?
16. May we add extra slides (architecture, screenshots) as long as we keep the template's content? Is there a slide limit?
17. Are the Round 1 criteria weighted, and are the finale criteria the same?
