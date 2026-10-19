import React, { useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { LANG, TOOL_LABEL, VERDICT, ZONES, actionTitle, agentName, rupees, splitReason, time, zoneOf } from './lib.js'

// ------------------------------------------------------------------ verdicts and risk

export function Verdict({ d, size = 'md' }) {
  const v = VERDICT[d] || VERDICT.allow
  return <span className={`verdict tone-${v.tone} v-${size}`}><i aria-hidden="true">{v.icon}</i>{v.label}</span>
}

export function RiskGauge({ risk = 0, size = 120 }) {
  const z = zoneOf(risk)
  const r = 44, c = Math.PI * r
  return (
    <div className="gauge" style={{ width: size }}>
      <svg viewBox="0 0 100 58" role="img" aria-label={`Risk ${risk} out of 100`}>
        <path d="M6 52a44 44 0 0 1 88 0" className="gauge-track" />
        <path d="M6 52a44 44 0 0 1 88 0" className={`gauge-fill stroke-${z.tone}`}
          strokeDasharray={`${(Math.min(risk, 100) / 100) * c} ${c}`} />
      </svg>
      <div className="gauge-num"><b>{risk}</b><span>/100</span></div>
    </div>
  )
}

const factorLabel = (label) => {
  const m = label.match(/^(\w+) base risk$/)
  if (m) return `${TOOL_LABEL[m[1]] || m[1]} (base risk of the tool)`
  return label === 'agent message base risk' ? 'Agent-to-agent message (base risk)' : label
}

export function RiskBreakdown({ v, compact = false }) {
  const factors = v.factors || []
  const total = Math.min(100, factors.reduce((s, f) => s + f.points, 0))
  return (
    <div className={`breakdown ${compact ? 'compact' : ''}`}>
      <div className="stack" role="img" aria-label={factors.map((f) => `${f.label} +${f.points}`).join(', ')}>
        {factors.map((f, i) => (
          <span key={i} className={`seg c${i % 8}`} style={{ flexGrow: f.points }} title={`${f.label}: +${f.points}`}>
            {!compact && f.points >= 8 && <em>+{f.points}</em>}
          </span>
        ))}
        {total < 100 && <span className="seg rest" style={{ flexGrow: 100 - total }} />}
      </div>
      <div className="zones">
        {ZONES.map((z) => (
          <span key={z.label} className={`zone tone-${z.tone}`} style={{ flexGrow: z.to - z.from }}>
            {!compact && <small>{z.from}–{z.to === 100 ? 100 : z.to - 1} {z.label}</small>}
          </span>
        ))}
        <span className="zone-marker" style={{ left: `${Math.min(v.risk, 99.5)}%` }} aria-hidden="true" />
      </div>
      {!compact && (
        <ul className="factor-list">
          {factors.map((f, i) => (
            <li key={i}><i className={`swatch c${i % 8}`} />{factorLabel(f.label)}<b>+{f.points}</b></li>
          ))}
          <li className="factor-total">Risk score<b>{v.risk}</b></li>
        </ul>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ the checkpoint hero (mirrors slide 3)

const STEP_HELP = {
  Identify: 'Who is acting, token verified',
  'Language scan': 'Hidden instructions in any language',
  Permissions: 'Allowed tools and limits',
  Rules: 'Built-in + company rules',
  'Chain check': 'No borrowed powers, no loops',
  'Risk score': 'Every point explained',
  Decide: 'Allow · ask · block',
}

export function Checkpoint({ v, pending = false }) {
  if (!v) {
    return (
      <section className="checkpoint empty">
        <div className="cp-empty">
          <h3>Waiting for the first agent action</h3>
          <p>Run a scenario from the Attack lab, or pick one below. Every tool call and agent-to-agent message lands here first.</p>
        </div>
      </section>
    )
  }
  const { what, why } = splitReason(v.reason)
  const chain = [...(v.chain || []), v.agent, ...(v.kind === 'message' ? [v.to_agent] : [])].filter(Boolean)
  const tone = (VERDICT[v.decision] || VERDICT.allow).tone
  return (
    <section className={`checkpoint tone-border-${tone}`} key={v.id}>
      <div className="cp-col cp-agent">
        <div className="cp-label">An agent tries something</div>
        <div className="cp-chain">
          {chain.map((a, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="cp-arrow" aria-hidden="true">→</span>}
              <span className={`agent-chip ${i === chain.length - (v.kind === 'message' ? 2 : 1) ? 'actor' : ''}`}>{agentName(a)}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="cp-action">{actionTitle(v)}</div>
        <p className="cp-what">{what}</p>
        {v.args && Object.keys(v.args).length > 0 && (
          <dl className="cp-args">
            {Object.entries(v.args).slice(0, 4).map(([k, val]) => (
              <React.Fragment key={k}><dt>{k.replace('_', ' ')}</dt><dd>{k === 'amount' ? rupees(val) : String(val).slice(0, 40)}</dd></React.Fragment>
            ))}
          </dl>
        )}
      </div>

      <div className="cp-col cp-steps">
        <div className="cp-label light">Arbiter checks it first</div>
        <ol>
          {(v.steps || []).map((s, i) => (
            <li key={s.name} className={`step st-${s.status}`} style={{ animationDelay: `${i * 90}ms` }}>
              <span className="step-n">{i + 1}</span>
              <span className="step-body">
                <b>{s.name}</b>
                <small>{s.detail || STEP_HELP[s.name]}</small>
              </span>
              <span className="step-state" aria-label={s.status}>{{ pass: '✓', warn: '!', fail: '✕', skip: '–' }[s.status]}</span>
            </li>
          ))}
        </ol>
        <div className="cp-foot">{v.latency_ms != null ? `Checked in ${v.latency_ms} ms` : 'Every decision → live dashboard · tamper-proof log'}</div>
      </div>

      <div className="cp-col cp-decision">
        <div className="cp-label">The decision, with a reason</div>
        <div className="cp-verdict-row">
          <Verdict d={v.decision} size="lg" />
          <RiskGauge risk={v.risk} size={112} />
        </div>
        {v.would_have && <div className="note warn">Protection is off. Arbiter would have chosen <b>{VERDICT[v.would_have].label}</b>.</div>}
        {v.learned_rule && <div className="note info">Approved by a rule a manager created: “{v.learned_rule.plain}”</div>}
        {v.decided_by && !v.learned_rule && <div className="note info">Decided by {v.decided_by}</div>}
        <p className="cp-why">{why || what}</p>
        {pending && <HeroApproval v={v} />}
      </div>
    </section>
  )
}

// ------------------------------------------------------------------ details drawer content

export function DecisionDetails({ v }) {
  const injected = (v.scans || []).filter((s) => v.kind === 'scan' || s.is_injection).slice(0, 1)
  return (
    <div className="details">
      {v.factors?.length > 0 && (
        <div className="detail-block">
          <h4>Why risk {v.risk}? Every point has a reason</h4>
          <RiskBreakdown v={v} />
        </div>
      )}
      {v.hard?.length > 0 && (
        <div className="detail-block">
          <h4>Hard rules hit (these always block)</h4>
          <ul className="hard-list">{v.hard.map((h, i) => <li key={i}><code>{h.rule}</code><span>{h.reason}</span></li>)}</ul>
        </div>
      )}
      {injected.map((s, i) => <ScanView key={i} s={s} />)}
    </div>
  )
}

export function ScanView({ s }) {
  return (
    <div className="scanview">
      <div className="scan-head">
        <Verdict d={s.is_injection ? 'flag' : 'clean'} />
        <span>{s.is_injection ? 'Hidden instruction found' : 'No hidden instruction'}</span>
        <span className="muted">· {s.languages_named?.join(', ')}</span>
        <span className="muted right">signal score {s.score} (instruction at 3+ with an action)</span>
      </div>
      <div className="scan-cols">
        <div>
          <label>Original</label>
          <div className="scan-text native">{s.original.replace(/<[^>]+>/g, ' ').trim()}</div>
        </div>
        <div>
          <label>{s.used_llm ? 'LLM translation (scanned too)' : 'What it means'}</label>
          <div className="scan-text">{(s.translation || s.normalized).replace(/^Built-in glossary: /, '')}</div>
        </div>
      </div>
      <div className="scan-facts">
        <span><b>Scripts</b> {Object.entries(s.scripts || {}).map(([k, n]) => `${k} ${n}`).join(' · ') || '–'}</span>
        {s.tricks?.length > 0 && <span className="trick"><b>Tricks</b> {s.tricks.join('; ')}</span>}
      </div>
      {s.findings?.length > 0 && (
        <table className="findings">
          <thead><tr><th>Signal</th><th>Language</th><th>Matched text</th><th>Meaning</th></tr></thead>
          <tbody>
            {s.findings.map((f, i) => (
              <tr key={i}><td>{f.signal.replace('_', ' ')}</td><td>{LANG[f.lang] || f.lang}</td><td className="native hl">{f.phrase}</td><td>{f.meaning}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ feed, story, approvals

export function FeedRow({ v, active, onClick }) {
  const { what } = splitReason(v.reason)
  const chain = [...(v.chain || []), v.agent, ...(v.kind === 'message' ? [v.to_agent] : [])].filter(Boolean)
  return (
    <button className={`feed-row ${active ? 'active' : ''}`} onClick={onClick}>
      <span className={`rail tone-bg-${(VERDICT[v.decision] || VERDICT.allow).tone}`} />
      <span className="feed-main">
        <span className="feed-top">
          <Verdict d={v.decision} size="sm" />
          <b>{actionTitle(v)}</b>
          {chain.length > 0 && <span className="feed-chain">{chain.map(agentName).join(' → ')}</span>}
        </span>
        <span className="feed-what">{v.kind === 'scan' ? v.reason : what}</span>
      </span>
      <span className="feed-side">
        <span className={`risk-num tone-text-${zoneOf(v.risk).tone}`}>{v.risk}</span>
        <small>{time(v.ts)}</small>
      </span>
    </button>
  )
}

export function Story({ story }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [story])
  if (!story.length) return <p className="muted pad">Nothing running. Start a scenario and the agents' steps appear here as they happen.</p>
  return (
    <div className="story" ref={ref}>
      {story.map((s, i) => (
        <div key={i} className={`story-line sl-${s.kind}`}>
          <span className="sl-dot" aria-hidden="true" />
          <span>{s.text.replace(/^[^\w₹"“]+\s*/u, '')}</span>
        </div>
      ))}
    </div>
  )
}

function HeroApproval({ v }) {
  return (
    <div className="hero-approval">
      <div className="hero-approval-label">The agent is waiting. Your call:</div>
      <div className="approval-btns">
        <button className="btn btn-good" onClick={() => api.decide(v.id, 'approve')}>Approve once</button>
        <button className="btn btn-bad" onClick={() => api.decide(v.id, 'reject')}>Reject</button>
      </div>
      <button className="btn btn-brand wide" onClick={() => api.decide(v.id, 'approve_and_learn')}>Approve &amp; make it a rule</button>
    </div>
  )
}

export function ApprovalCard({ v }) {
  const [note, setNote] = useState('')
  const [left, setLeft] = useState(0)
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.round(v.ts + (v.timeout || 120) - Date.now() / 1000)))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [v])
  const { what, why } = splitReason(v.reason)
  const total = v.timeout || 120
  return (
    <div className="approval">
      <div className="approval-top">
        <Verdict d="hold" size="sm" />
        <span className="muted">Risk {v.risk}</span>
        <span className="countdown" title="No answer means reject (fail closed)">
          <span className="countdown-bar" style={{ width: `${(left / total) * 100}%` }} />
          <small>{left}s</small>
        </span>
      </div>
      <p className="approval-what">{what}</p>
      <p className="approval-why">{why.replace('Needs a manager: ', 'Why: ')}</p>
      <RiskBreakdown v={v} compact />
      <input placeholder="Reason, sent back to the agent if you reject" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="approval-btns">
        <button className="btn btn-good" onClick={() => api.decide(v.id, 'approve')}>Approve once</button>
        <button className="btn btn-bad" onClick={() => api.decide(v.id, 'reject', note)}>Reject</button>
      </div>
      <button className="btn btn-brand wide" onClick={() => api.decide(v.id, 'approve_and_learn')}>Approve &amp; make it a rule</button>
    </div>
  )
}

// ------------------------------------------------------------------ agent map

const POS = { support_agent: [90, 70], billing_agent: [330, 70], refund_agent: [330, 230], admin_agent: [90, 230] }

export function AgentMap({ state, big = false }) {
  const edges = state.edges || []
  const allowed = []
  state.agents.forEach((a) => (a.can_message || []).forEach((b) => allowed.push([a.id, b])))
  const tone = (d) => (d === 'block' ? 'bad' : d === 'allow' ? 'good' : 'warn')
  return (
    <svg className={`agent-map ${big ? 'big' : ''}`} viewBox="0 0 420 300" role="img" aria-label="Agent map: which agents may message which, with the latest decision on each link">
      <defs>
        {['good', 'warn', 'bad', 'mute'].map((k) => (
          <marker key={k} id={`m-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0L10,5L0,10z" className={`fill-${k}`} />
          </marker>
        ))}
      </defs>
      {allowed.map(([a, b], i) => POS[a] && POS[b] && <Edge key={'p' + i} a={POS[a]} b={POS[b]} cls="edge-allowed" marker="mute" />)}
      {edges.map((e, i) => POS[e.from] && POS[e.to] && (
        <Edge key={i} a={POS[e.from]} b={POS[e.to]} cls={`edge-live stroke-${tone(e.decision)}`} marker={tone(e.decision)} cross={e.decision === 'block'} />
      ))}
      {state.agents.map((a) => {
        const [x, y] = POS[a.id] || [0, 0]
        return (
          <g key={a.id} className={`node ${a.paused ? 'paused' : ''}`}>
            <rect x={x - 66} y={y - 30} width="132" height="60" rx="12" />
            <text x={x} y={y - 6} textAnchor="middle" className="node-name">{a.name}</text>
            <rect x={x - 40} y={y + 8} width="80" height="5" rx="2.5" className="trust-track" />
            <rect x={x - 40} y={y + 8} width={(a.trust / 100) * 80} height="5" rx="2.5" className={a.paused ? 'trust-bad' : a.trust < 80 ? 'trust-warn' : 'trust-good'} />
            <text x={x} y={y + 25} textAnchor="middle" className="node-sub">{a.paused ? 'Paused' : `trust ${a.trust}`}</text>
          </g>
        )
      })}
    </svg>
  )
}

function Edge({ a, b, cls, marker, cross }) {
  const [x1, y1] = a, [x2, y2] = b
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
  const ux = dx / len, uy = dy / len
  const nx = -uy * 8, ny = ux * 8
  const gap = Math.abs(ux) > 0.5 ? 70 : 34   // clear the node box: wide horizontally, short vertically
  const sx = x1 + ux * gap + nx, sy = y1 + uy * gap + ny
  const ex = x2 - ux * gap + nx, ey = y2 - uy * gap + ny
  return (
    <g>
      <line x1={sx} y1={sy} x2={ex} y2={ey} className={cls} markerEnd={`url(#m-${marker})`} />
      {cross && (
        <g transform={`translate(${(sx + ex) / 2},${(sy + ey) / 2})`}>
          <circle r="10" className="cross-bg" />
          <path d="M-4-4 4 4M4-4-4 4" className="cross" />
        </g>
      )}
    </g>
  )
}

// ------------------------------------------------------------------ small things

export const Panel = ({ title, aside, children, className = '' }) => (
  <section className={`panel ${className}`}>
    {(title || aside) && <div className="panel-head"><h2>{title}</h2>{aside}</div>}
    {children}
  </section>
)

export const Kpi = ({ label, value, tone, hint }) => (
  <div className={`kpi ${tone ? 'kpi-' + tone : ''}`} title={hint}>
    <span className="kpi-label">{label}</span>
    <b className="kpi-value">{value}</b>
  </div>
)
