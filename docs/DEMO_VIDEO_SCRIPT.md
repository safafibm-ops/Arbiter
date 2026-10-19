# Demo video script (about 3 minutes)

Start: `python -m arbiter.gateway`, open http://127.0.0.1:8000, click **Reset demo**.

1. **Normal work (20 s).** Click *Order status lookup* (green, risk 8), then *₹800 refund, asked in Kannada* (goes through; the Kannada chat is scanned and not flagged). Line: "Arbiter doesn't get in the way of normal work."
2. **Ask a manager (30 s).** Click *₹8,000 refund*. The approval card appears on the right with risk 74 and its reasons. Click **Approve & make it a rule**. Show the rule under "Rules learned". Click *₹7,500 refund*: approved automatically by the learned rule.
3. **The headline attack (45 s).** Turn **Protection OFF**. Click *Hidden Hindi instruction: ₹48,000 refund*. The story shows the Billing Agent obeying the email and "Money lost ₹48,000" turns red. Turn **Protection ON**, click it again. Open the BLOCK card: the 7-step pipeline, the risk bar (40 + 20 + 25 + 10 = 95), the hard rules (tainted arguments, no borrowed powers), and the Hindi phrases with their meaning. The agent map shows a red ✕ on Billing → Refund.
4. **Any language, any trick (25 s).** Click the Kannada, Hinglish and *Invisible text* attacks. Open the Language scanner tab and click the samples.
5. **Multi-agent controls (25 s).** *Borrowed powers*, *Support messages Admin directly*, *Agents looping*.
6. **Stop a rogue agent (20 s).** *Rogue agent scraping records*: the circuit breaker pauses the Support Agent. Show **Stop all agents** and **Resume**.
7. **Trust the record (15 s).** Audit log tab: "All entries intact". Click *Simulate an insider edit*: the chain shows exactly which entry was changed.
8. **Close (10 s).** Terminal: `python -m shopco.redteam`: 10/10 attacks work without Arbiter, 0/10 with it, 0 normal tasks blocked, about 1.5 ms per check.
