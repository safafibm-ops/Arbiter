// Docs navigation and search index. `sections` mirror the h2 ids inside each page.
export const DOC_GROUPS = [
  {
    title: 'Getting started',
    pages: [
      { slug: 'introduction', title: 'Introduction', desc: 'What Arbiter is and why it exists', sections: [['what', 'What Arbiter does'], ['why', 'Why it matters'], ['different', 'What makes it different'], ['map', 'How these docs are organised']] },
      { slug: 'quickstart', title: 'Quickstart', desc: 'Open the live demo or run it locally', sections: [['online', 'Try it online'], ['local', 'Run it locally'], ['llm', 'Optional open LLM'], ['verify', 'Check the claims']] },
      { slug: 'walkthrough', title: 'Demo walkthrough', desc: 'A 3-minute tour of the dashboard', sections: [['steps', 'Eight steps'], ['screens', 'What you will see']] },
    ],
  },
  {
    title: 'How it works',
    pages: [
      { slug: 'pipeline', title: 'The 7-step check', desc: 'Identify, scan, permissions, rules, chain, risk, decide', sections: [['steps', 'The seven steps'], ['live', 'Try it'], ['zones', 'Decision zones'], ['hard', 'Hard rules']] },
      { slug: 'risk-score', title: 'Risk score', desc: 'How every point of the 0–100 score is earned', sections: [['formula', 'The formula'], ['examples', 'Worked examples'], ['anomaly', 'Anomalies and trust']] },
      { slug: 'polyglot-scanner', title: 'Polyglot Scanner', desc: 'Hidden instructions in Hindi, Kannada, Hinglish and English', sections: [['stages', 'Three stages'], ['try', 'Try the samples'], ['net', 'The safety net'], ['false', 'Keeping false alarms low']] },
      { slug: 'multi-agent', title: 'Multi-agent control', desc: 'No borrowed powers, matrix, loops, trust tags', sections: [['map', 'The agent map'], ['borrowed', 'No borrowed powers'], ['matrix', 'Communication matrix'], ['tags', 'Trust tags travel'], ['loops', 'Loops, depth and impostors']] },
      { slug: 'approvals', title: 'Approvals', desc: 'Approve once, reject, or approve and make it a rule', sections: [['card', 'The approval card'], ['teach', 'Approve and teach'], ['timeout', 'Fail closed']] },
      { slug: 'controls', title: 'Safety controls', desc: 'Kill switch, circuit breaker, trust, audit log', sections: [['kill', 'Kill switch'], ['breaker', 'Circuit breaker'], ['trust', 'Agent trust'], ['limits', 'Rate limits and budgets'], ['audit', 'Tamper-evident log'], ['watch', 'Watch-only mode']] },
    ],
  },
  {
    title: 'Reference',
    pages: [
      { slug: 'policies', title: 'Policy file', desc: 'Agents, tools, limits and rules in YAML', sections: [['shape', 'The shape of a policy'], ['example', "ShopCo's policy"], ['rules', 'Writing rules'], ['perms', 'Permissions at a glance']] },
      { slug: 'sdk', title: 'Python SDK', desc: 'Wrap a tool in one line', sections: [['install', 'Wrap a tool'], ['scan', 'Scan untrusted input'], ['send', 'Agent-to-agent messages'], ['errors', 'Handling a block'], ['failclosed', 'Fail-closed']] },
      { slug: 'api', title: 'REST API', desc: '/api/check, /api/message, /api/scan', sections: [['check', 'POST /api/check'], ['message', 'POST /api/message'], ['scan', 'POST /api/scan'], ['stream', 'Live stream']] },
      { slug: 'architecture', title: 'Architecture', desc: 'Gateway, engine, scanner, dashboard, audit log', sections: [['diagram', 'Diagram'], ['stack', 'Built with'], ['layout', 'Project layout'], ['shopco', 'The ShopCo demo']] },
    ],
  },
  {
    title: 'Evidence',
    pages: [
      { slug: 'red-team', title: 'Red-team results', desc: '10/10 attacks without Arbiter, 0/10 with it', sections: [['scorecard', 'Scorecard'], ['scenarios', 'Every scenario'], ['tests', 'Automated tests'], ['plan', 'Testing beyond Round 1']] },
      { slug: 'problem', title: 'The problem', desc: 'Incidents, surveys and the language gap', sections: [['stats', 'The numbers'], ['incidents', 'Real incidents'], ['language', 'The language gap'], ['ways', 'How agents go wrong']] },
      { slug: 'comparison', title: 'Compared with others', desc: 'Where Arbiter stands among existing tools', sections: [['matrix', 'Capability matrix'], ['projects', 'Who does what'], ['signature', 'Signature features']] },
    ],
  },
  {
    title: 'Project',
    pages: [
      { slug: 'impact', title: 'Impact and business', desc: 'Who benefits, revenue model, scalability', sections: [['who', 'Who benefits'], ['inclusive', 'Inclusivity'], ['business', 'Business model'], ['scale', 'Scalability']] },
      { slug: 'roadmap', title: 'Roadmap', desc: 'What comes after Round 1', sections: [['next', 'Next']] },
      { slug: 'references', title: 'References', desc: 'Every source behind the numbers', sections: [['sources', 'Sources']] },
      { slug: 'research-notes', title: 'Research notes', desc: "The team's full design notes, kept as written", sections: [] },
    ],
  },
]

export const DOC_PAGES = DOC_GROUPS.flatMap((g) => g.pages.map((p) => ({ ...p, group: g.title })))
export const findPage = (slug) => DOC_PAGES.find((p) => p.slug === slug)
