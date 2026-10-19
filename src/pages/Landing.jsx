import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, ExternalLink, Github, Languages, Link2, MessageSquareText, ShieldCheck, UserCheck } from 'lucide-react'
import { LINKS, REDTEAM, RESULTS, SCENARIOS, STEPS, inr } from '../data/arbiter.js'
import VerdictSim from '../components/VerdictSim.jsx'
import ScannerPlay from '../components/ScannerPlay.jsx'
import AgentMap from '../components/AgentMap.jsx'
import RiskBar from '../components/RiskBar.jsx'
import { Reveal, Shot } from '../lib.jsx'

const ON_LABEL = { allow: 'Allow', alert: 'Allow + alert', ask: 'Ask a manager', learned: 'Auto-approved by learned rule', block: 'Block', paused: 'Auto-paused' }
const ON_CLASS = { allow: 'c-allow', alert: 'c-alert', ask: 'c-ask', learned: 'c-allow', block: 'c-block', paused: 'c-block' }

export default function Landing() {
  useEffect(() => { document.title = 'Arbiter · Every AI agent action, judged before it runs' }, [])
  return (
    <main id="main">
      <Hero />
      <Problem />
      <How />
      <section className="band on-char" id="demo">
        <div className="container section">
          <Reveal className="section-head">
            <p className="eyebrow">Try the checkpoint</p>
            <h2 className="h2">Pick an action. Watch it get judged.</h2>
            <p className="lede">The same seven checks, the same scores and the same sentences the manager reads in the real dashboard.</p>
          </Reveal>
          <VerdictSim />
        </div>
      </section>
      <Scanner />
      <Agents />
      <Approvals />
      <Results />
      <Built />
      <Cta />
    </main>
  )
}

/* ---------------- hero ---------------- */
const FEED = [
  { t: 'Support Agent looked up order #2231', v: 'allow', r: 8, who: 'Support' },
  { t: 'Customer asked in Hindi where order #2260 is', v: 'allow', r: 8, who: 'Support' },
  { t: '₹800 refund for a late delivery, asked in Kannada', v: 'alert', r: 40, who: 'Billing → Refund' },
  { t: '₹8,000 refund for a cracked phone screen', v: 'ask', r: 74, who: 'Refund' },
  { t: '₹48,000 to account 77810042, from a hidden Hindi instruction', v: 'block', r: 95, who: 'Billing → Refund' },
  { t: 'Email the customer list to data@growth-leads.io', v: 'block', r: 85, who: 'Support' },
  { t: 'Delete 250 customer records', v: 'block', r: 75, who: 'Admin' },
  { t: 'Unknown agent with a forged token', v: 'block', r: 84, who: '“Billing”' },
]
const VLABEL = { allow: 'Allow', alert: 'Alert', ask: 'Ask', block: 'Block' }

function HeroFeed() {
  const [n, setN] = useState(5)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setN((x) => x + 1), 2300)
    return () => clearInterval(t)
  }, [])
  const rows = Array.from({ length: 5 }, (_, i) => ({ ...FEED[(n - i + FEED.length * 10) % FEED.length], key: n - i }))
  return (
    <div className="hero-feed" aria-label="Example decisions from the ShopCo demo">
      <div className="hf-head">
        <span className="hf-live"><i />Live checkpoint</span>
        <span className="hf-meta">ShopCo · 4 agents protected</span>
      </div>
      <ol className="hf-list">
        {rows.map((r, i) => (
          <li key={r.key} className={`hf-row v-${r.v} ${i === 0 ? 'fresh' : ''}`}>
            <span className={`hf-badge v-${r.v}`}>{VLABEL[r.v]}</span>
            <span className="hf-text"><b>{r.t}</b><small>{r.who}</small></span>
            <span className="hf-risk"><b>{r.r}</b><small>risk</small></span>
          </li>
        ))}
      </ol>
      <div className="hf-foot"><ShieldCheck aria-hidden="true" />Log intact · every decision hash-chained</div>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero band on-char">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">DevHost 2026 · PS 2.1 · AI Agent Safety and Control</p>
          <h1 className="h1">Every AI agent action, <span className="hl">judged before it runs.</span></h1>
          <p className="lede">Arbiter sits between AI agents and your business systems, and between the agents themselves. Safe actions run. Risky ones wait for a manager. Harmful ones are blocked with a reason anyone can read, in English, Hindi, Kannada or Hinglish.</p>
          <div className="hero-cta">
            <a className="btn btn-brand" href={LINKS.demo} target="_blank" rel="noopener noreferrer">Open the live demo <ExternalLink aria-hidden="true" /></a>
            <Link className="btn btn-line" to="/docs/introduction"><BookOpen aria-hidden="true" />Read the docs</Link>
            <a className="btn btn-line" href={LINKS.repo} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true" />GitHub</a>
          </div>
          <p className="hero-note">The demo runs on a free server that sleeps when idle, so the first load can take about 40 seconds.</p>
        </div>
        <HeroFeed />
      </div>
      <div className="container">
        <dl className="scoreline">
          <div><dt>Attacks that got through</dt><dd><b className="good">0 / {RESULTS.attacks}</b><small>{RESULTS.workedOff} / {RESULTS.attacks} with Arbiter off</small></dd></div>
          <div><dt>Money lost to attacks</dt><dd><b className="good">{inr(RESULTS.lostOn)}</b><small>{inr(RESULTS.lostOff)} with Arbiter off</small></dd></div>
          <div><dt>Normal tasks wrongly blocked</dt><dd><b>0 / {RESULTS.normal}</b><small>big refunds go to a manager</small></dd></div>
          <div><dt>Time added per action</dt><dd><b>{RESULTS.latency} ms</b><small>median, in-process</small></dd></div>
        </dl>
      </div>
    </section>
  )
}

/* ---------------- problem ---------------- */
function Problem() {
  return (
    <section className="section container" id="problem">
      <div className="problem-grid">
        <Reveal>
          <p className="eyebrow">The problem</p>
          <h2 className="h2">AI agents got the keys. Nobody installed the brakes.</h2>
          <p className="lede">Agents now issue refunds, send emails, edit databases and hand work to each other. They act in seconds with no approval step, and they can be confused, over-permissioned or talked into things by hidden instructions.</p>
          <blockquote className="pull">
            <p>“I guessed instead of verifying. I ran a destructive action without being asked.”</p>
            <cite>The AI agent that deleted PocketOS's production database and backups in 9 seconds, April 2026</cite>
          </blockquote>
        </Reveal>
        <Reveal className="card stats-card">
          <h3 className="h3">Agents are acting. Almost nobody can stop them.</h3>
          <Bar label="Had an AI-agent incident in the last 12 months" value={65} tone="bad" />
          <Bar label="Saw agents exceed their intended permissions" value={53} tone="alert" />
          <Bar label="Can automatically block a risky agent action" value={11} tone="brand" />
          <p className="src">Cloud Security Alliance industry surveys, April 2026 (418 and 445 IT and security professionals). Bars drawn to scale.</p>
        </Reveal>
      </div>
      <Reveal className="gap-strip">
        <div className="gap-lead">
          <Languages aria-hidden="true" />
          <div><b>And the guards only speak English.</b><p>Attackers already write their instructions in other languages to slip past filters.</p></div>
        </div>
        <div className="gap-stat"><b>&lt;1% → 79%</b><span>GPT-4 safety bypass, English vs low-resource languages</span><small>Brown University, 2023</small></div>
        <div className="gap-stat"><b>70%</b><span>of English attacks still work when moved into Hindi or Urdu</span><small>IndicJR, 2026</small></div>
        <div className="gap-stat"><b>92 → 43</b><span>guardrail accuracy (F1), English vs multilingual</span><small>UPenn and Microsoft, 2024</small></div>
      </Reveal>
    </section>
  )
}

function Bar({ label, value, tone }) {
  return (
    <div className="pbar">
      <div className="pbar-top"><span>{label}</span><b>{value}%</b></div>
      <div className="pbar-track"><i className={`t-${tone}`} style={{ width: `${value}%` }} /></div>
    </div>
  )
}

/* ---------------- how it works (scrollytelling) ---------------- */
const ATTACK = SCENARIOS.find((s) => s.id === 'attack')
function How() {
  const [active, setActive] = useState(0)
  const refs = useRef([])
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.i)) })
    }, { rootMargin: '-45% 0px -45% 0px' })
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])
  const [state] = ATTACK.steps[active]
  return (
    <section className="section how" id="how">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">How it works</p>
          <h2 className="h2">Seven checks between an agent and your systems.</h2>
          <p className="lede">Every tool call and every agent-to-agent message runs the same pipeline before anything happens. Rules first; an LLM only helps on unclear text. Follow the ₹48,000 attack through it.</p>
        </Reveal>
        <div className="how-grid">
          <div className="how-sticky">
            <div className="how-panel on-char">
              <div className="hp-req">
                <span className="pill">Billing</span><span className="sim-arrow">→</span><span className="pill pill-to">Refund</span>
                <code>issue_refund</code>
              </div>
              <p className="hp-plain">{ATTACK.plain}</p>
              <ol className="hp-steps">
                {STEPS.map((s, i) => {
                  const [st, d] = ATTACK.steps[i]
                  const done = i <= active
                  return (
                    <li key={s.name} className={`${done ? 'done' : ''} ${i === active ? 'now' : ''}`} data-s={done ? st : 'idle'}>
                      <span className="n">{i + 1}</span>
                      <span className="t"><b>{s.name}</b>{done && <small>{d}</small>}</span>
                      {done && <span className="st">{st === 'pass' ? '✓' : st === 'warn' ? '!' : '✕'}</span>}
                    </li>
                  )
                })}
              </ol>
              <div className={`hp-out ${active === STEPS.length - 1 ? 'show' : ''}`}>
                <span className="verdict v-block"><i>✕</i>Block · 95</span>
                <span>The refund never touches the payment system.</span>
              </div>
              <span className="sr-only" aria-live="polite">{STEPS[active].name}: {state}</span>
            </div>
          </div>
          <ol className="how-steps">
            {STEPS.map((s, i) => (
              <li key={s.name} ref={(el) => (refs.current[i] = el)} data-i={i} className={i === active ? 'active' : ''}>
                <span className="how-n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h3">{s.name}</h3>
                <p className="how-q">{s.short}</p>
                <p>{s.body}</p>
                {i === 5 && <RiskBar factors={ATTACK.factors} risk={95} showList={false} />}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ---------------- scanner ---------------- */
function Scanner() {
  return (
    <section className="section container" id="scanner">
      <div className="split">
        <Reveal>
          <p className="eyebrow">Polyglot Scanner · our own detection logic</p>
          <h2 className="h2">Reads every language the attacker writes in.</h2>
          <p className="lede">The scanner finds the script of every word and the language of every sentence, cleans out invisible characters and look-alike letters, then asks one question: is this text trying to instruct the AI?</p>
          <ul className="ticks">
            <li><Check aria-hidden="true" /><span><b>Script Detector.</b> Latin, Devanagari, Kannada, Cyrillic, Greek, and Hinglish through a romanised-Hindi lexicon.</span></li>
            <li><Check aria-hidden="true" /><span><b>Translate &amp; Clean.</b> Strips zero-width characters, maps look-alikes back, converts <span lang="hi">₹४८,०००</span> to 48000, decodes base64, drops hidden HTML.</span></li>
            <li><Check aria-hidden="true" /><span><b>Intent Judge.</b> Weighted phrases in four languages: override, money movement, data export, secrecy, urgency, new destination.</span></li>
          </ul>
          <p className="muted small">If the scanner ever misses, the action is still checked: a ₹48,000 refund to a new account is stopped by limits whatever language asked for it.</p>
        </Reveal>
        <Reveal><ScannerPlay /></Reveal>
      </div>
    </section>
  )
}

/* ---------------- agents ---------------- */
function Agents() {
  return (
    <section className="section band-soft" id="agents">
      <div className="container">
        <div className="split split-wide">
          <Reveal>
            <p className="eyebrow">Headline feature</p>
            <h2 className="h2">Agents can't borrow each other's powers.</h2>
            <p className="lede">Agents hand work to each other. Arbiter treats every agent-to-agent message like a tool call, so a poisoned agent can't get a more powerful one to act for it.</p>
            <div className="mini-feats">
              <div><Link2 aria-hidden="true" /><b>No borrowed powers</b><span>Every agent in the chain must hold the power itself.</span></div>
              <div><MessageSquareText aria-hidden="true" /><b>Communication matrix</b><span>Who may message whom, from the policy file.</span></div>
              <div><ShieldCheck aria-hidden="true" /><b>Trust tags travel</b><span>A flagged email taints every hop after it.</span></div>
            </div>
          </Reveal>
          <Reveal><AgentMap /></Reveal>
        </div>
      </div>
    </section>
  )
}

/* ---------------- approvals ---------------- */
function Approvals() {
  const [state, setState] = useState('waiting') // waiting | once | rejected | rule
  const [left, setLeft] = useState(119)
  useEffect(() => {
    if (state !== 'waiting') return
    const t = setInterval(() => setLeft((s) => (s > 1 ? s - 1 : 119)), 1000)
    return () => clearInterval(t)
  }, [state])
  const big = SCENARIOS.find((s) => s.id === 'big')
  return (
    <section className="section container" id="approvals">
      <div className="split">
        <Reveal>
          <p className="eyebrow">Humans stay in charge</p>
          <h2 className="h2">One click to approve. One more to teach it.</h2>
          <p className="lede">Only high-risk actions wait for a person. The manager reads one sentence, sees where every risk point came from, and decides. "Approve &amp; make it a rule" turns that yes into a rule, so the next similar case runs on its own.</p>
          <ul className="ticks">
            <li><UserCheck aria-hidden="true" /><span>Learned rules never cover tainted requests or hard-rule hits.</span></li>
            <li><UserCheck aria-hidden="true" /><span>No answer before the timeout means reject. Arbiter fails closed.</span></li>
          </ul>
        </Reveal>
        <Reveal className="approval" aria-live="polite">
          <div className="ap-card">
            <div className="ap-top">
              <span className="chip c-ask">Ask a manager</span>
              <span className="ap-risk">Risk <b>74</b></span>
              {state === 'waiting' && <span className="ap-timer num">{left}s</span>}
            </div>
            <p className="ap-title">Refund Agent wants to refund ₹8,000 on order #2240 to account 50100231994410.</p>
            <p className="ap-why">Why: above the ₹5,000 auto-approve limit; about 9× this agent's usual refund (₹900).</p>
            <RiskBar factors={big.factors} risk={74} showList={false} />
            {state === 'waiting' ? (
              <div className="ap-btns">
                <button type="button" className="btn ap-ok" onClick={() => setState('once')}>Approve once</button>
                <button type="button" className="btn ap-no" onClick={() => setState('rejected')}>Reject</button>
                <button type="button" className="btn btn-brand ap-rule" onClick={() => setState('rule')}>Approve &amp; make it a rule</button>
              </div>
            ) : (
              <div className={`ap-result r-${state}`}>
                {state === 'once' && <><b>Approved once.</b> The ₹8,000 refund runs. The next big refund will ask again.</>}
                {state === 'rejected' && <><b>Rejected.</b> The reason goes back to the Refund Agent so it can tell the customer.</>}
                {state === 'rule' && <><b>Approved, and a rule was learned:</b> “Refund Agent may refund up to ₹8,000 to the customer's own bank account without asking.”</>}
                <button type="button" className="ap-reset" onClick={() => { setState('waiting'); setLeft(119) }}>Reset</button>
              </div>
            )}
          </div>
          {state === 'rule' && (
            <div className="ap-next">
              <span className="chip c-allow">Auto-approved</span>
              <span>Next case: <b>₹7,500 refund</b> for a broken smartwatch strap, approved by the learned rule. No manager needed.</span>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- results ---------------- */
function Results() {
  const [on, setOn] = useState(true)
  const lost = REDTEAM.reduce((a, r) => a + (on ? 0 : r.lost || 0), 0)
  const worked = REDTEAM.filter((r) => r.group === 'attack').length
  return (
    <section className={`section band results ${on ? 'is-on' : 'is-off'} on-char`} id="results">
      <div className="container">
        <Reveal className="section-head results-head">
          <div>
            <p className="eyebrow">Red-team results</p>
            <h2 className="h2">Flip the switch. See what it stops.</h2>
            <p className="lede">Fifteen ShopCo scenarios, run twice with the same agents and the same inputs. Turn protection off to see what happened without Arbiter.</p>
          </div>
          <div className="switch-box">
            <button type="button" role="switch" aria-checked={on} className="switch" onClick={() => setOn((x) => !x)}>
              <span className="knob" aria-hidden="true" />
              <span className="switch-text"><b>Protection {on ? 'on' : 'off'}</b><small>{on ? 'Every action is checked' : 'Agents act unchecked'}</small></span>
            </button>
            <div className="res-tiles">
              <div><small>Attacks that worked</small><b className={on ? 'good' : 'bad'}>{on ? 0 : worked} / {worked}</b></div>
              <div><small>Money lost</small><b className={on ? 'good' : 'bad'}>{inr(lost)}</b></div>
            </div>
          </div>
        </Reveal>
        <div className="res-table" role="table" aria-label="Scenario results">
          {['normal', 'attack'].map((g) => (
            <div key={g} role="rowgroup" className="res-group">
              <div className="res-group-h" role="row"><span role="columnheader">{g === 'normal' ? 'Everyday work' : 'Attacks'}</span><span role="columnheader">{on ? 'Arbiter on' : 'Arbiter off'}</span><span role="columnheader" className="r">{on ? 'Risk' : ''}</span></div>
              {REDTEAM.filter((r) => r.group === g).map((r) => (
                <div key={r.title} className="res-row" role="row">
                  <span role="cell" className="res-title">{r.title}{r.tags && <em>{r.tags.join(' · ')}</em>}</span>
                  <span role="cell">
                    {on
                      ? <span className={`chip ${ON_CLASS[r.on]}`}>{ON_LABEL[r.on]}{r.note ? ` · ${r.note}` : ''}</span>
                      : <span className={`res-off ${g === 'attack' ? 'bad' : ''}`}>{g === 'attack' ? 'Attack worked: ' : ''}{r.off}</span>}
                  </span>
                  <span role="cell" className="r num">{on ? r.risk : ''}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="res-note">The two big refunds are held for a manager by design. Low-scoring blocks are hard rules (matrix, loop, borrowed power) that stop the action whatever the score. Run it yourself: <code>python -m shopco.redteam</code>.</p>
      </div>
    </section>
  )
}

/* ---------------- built with ---------------- */
function Built() {
  return (
    <section className="section container" id="built">
      <Reveal className="section-head">
        <p className="eyebrow">Under the hood</p>
        <h2 className="h2">Rules first. AI only when unsure. Fail-closed, always.</h2>
      </Reveal>
      <div className="grid g4 built">
        <Reveal className="card"><span className="tag">Engine</span><h3 className="h3">Python · FastAPI</h3><p>Gateway, 7-step policy engine, risk score, Polyglot Scanner, agent message bus.</p></Reveal>
        <Reveal className="card"><span className="tag">Dashboard</span><h3 className="h3">React · Vite</h3><p>Live feed over server-sent events, approvals, agent map, kill switch, audit log.</p></Reveal>
        <Reveal className="card"><span className="tag">Optional LLM</span><h3 className="h3">Llama 3.3 · Qwen 2.5</h3><p>On Groq, or offline on Ollama. Only translates and gives a second opinion on unclear text.</p></Reveal>
        <Reveal className="card"><span className="tag">Record</span><h3 className="h3">SQLite · YAML</h3><p>Hash-chained audit log that shows exactly where an insider edit broke it. Company rules in YAML.</p></Reveal>
      </div>
      <Shot src="screens/block.webp" alt="Arbiter dashboard blocking the ₹48,000 Hindi-email refund at risk 95, with the seven checks and the risk bar" caption="The real dashboard after the ₹48,000 Hindi attack: four failed checks, a 95-point risk bar and the two hard rules that fired." />
      <div className="built-links">
        <Link className="btn btn-line" to="/docs/architecture">Architecture <ArrowRight aria-hidden="true" /></Link>
        <Link className="btn btn-line" to="/docs/sdk">One-line Python SDK <ArrowRight aria-hidden="true" /></Link>
        <Link className="btn btn-line" to="/docs/policies">Policy file <ArrowRight aria-hidden="true" /></Link>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="cta-band on-char">
      <div className="container cta-inner">
        <div>
          <h2 className="h2">See it stop an attack in under a minute.</h2>
          <p className="lede">Open the dashboard, follow the 7-step guide, and flip protection off to watch the same attacks succeed.</p>
        </div>
        <div className="hero-cta">
          <a className="btn btn-brand" href={LINKS.demo} target="_blank" rel="noopener noreferrer">Open the live demo <ExternalLink aria-hidden="true" /></a>
          <Link className="btn btn-line" to="/docs/quickstart">Run it locally</Link>
        </div>
      </div>
    </section>
  )
}
