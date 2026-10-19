import { useState } from 'react'

// ShopCo's four agents and the hops between them. Every hop passes an Arbiter check (the shield on each line).
const NODES = {
  support: { x: 110, y: 90, name: 'Support Agent', sub: 'lookup · inbox · email' },
  billing: { x: 380, y: 90, name: 'Billing Agent', sub: 'may authorise ≤ ₹5,000' },
  refund: { x: 650, y: 90, name: 'Refund Agent', sub: 'refunds ≤ ₹50,000' },
  admin: { x: 110, y: 290, name: 'Admin Agent', sub: 'delete needs a manager' },
}
const EDGES = {
  sb: { d: 'M190 82 L300 82', mid: [245, 82] },
  br: { d: 'M460 82 L570 82', mid: [515, 82] },
  rb: { d: 'M650 126 C 640 210, 400 210, 386 130', mid: [520, 190] },
  sa: { d: 'M110 126 L110 250', mid: [110, 188] },
}
const CASES = [
  { id: 'ok', label: 'Normal hand-off', path: ['sb'], verdict: 'allow', head: 'Support → Billing: allowed',
    text: 'Support asks Billing to check order #2240. The communication matrix allows Support → Billing, and no power is being used, so the message goes through.' },
  { id: 'attack', label: '₹48,000 refund', path: ['br'], verdict: 'block', head: 'Billing → Refund: blocked (borrowed power)',
    text: 'Billing asks Refund to pay ₹48,000. Refund could pay that much, but Billing may only authorise ₹5,000, and the request traces back to a poisoned Hindi email.' },
  { id: 'borrowed', label: 'Borrowed powers', path: ['sb', 'br'], verdict: 'block', head: 'Support → Billing → Refund: blocked (hard rule)',
    text: 'Support has no refund power at all. Passing the request through Billing to Refund does not create one: every agent in the chain must hold the power itself.' },
  { id: 'matrix', label: 'Skipping the matrix', path: ['sa'], verdict: 'block', head: 'Support → Admin: blocked (communication matrix)',
    text: 'Support may only message Billing. A message to the Admin Agent, which can delete records, is stopped before it is delivered.' },
  { id: 'loop', label: 'Loop', path: ['br', 'rb'], verdict: 'block', head: 'Billing → Refund → Billing: blocked (loop)',
    text: 'Agents bouncing a task back and forth (A → B → A) are stopped, along with any chain deeper than 4 hops.' },
]

export default function AgentMap() {
  const [id, setId] = useState('attack')
  const c = CASES.find((x) => x.id === id)
  const active = new Set(c.path)
  const lit = new Set(c.path.flatMap((e) => ({ sb: ['support', 'billing'], br: ['billing', 'refund'], rb: ['refund', 'billing'], sa: ['support', 'admin'] }[e])))
  return (
    <div className="agentmap">
      <div className="am-tabs" role="tablist" aria-label="Situation">
        {CASES.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={x.id === id} className={`v-${x.verdict}`} onClick={() => setId(x.id)}><i aria-hidden="true" />{x.label}</button>
        ))}
      </div>
      <div className="am-canvas">
        <svg viewBox="0 0 760 340" role="img" aria-label={c.head}>
          <defs>
            {['good', 'bad', 'idle'].map((k) => (
              <marker key={k} id={`am-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0,0L10,5L0,10z" className={`am-ar-${k}`} />
              </marker>
            ))}
          </defs>
          {Object.entries(EDGES).map(([k, e]) => {
            const on = active.has(k)
            const st = on ? (c.verdict === 'allow' ? 'good' : (k === c.path[c.path.length - 1] ? 'bad' : 'good')) : 'idle'
            const blocked = on && st === 'bad'
            return (
              <g key={k} className={`am-edge ${st} ${on ? 'on' : ''}`}>
                <path d={e.d} markerEnd={`url(#am-${st})`} />
                <g transform={`translate(${e.mid[0] - 11} ${e.mid[1] - 13})`} className="am-shield">
                  <path d="M11 1 2 4.6v7.2c0 5.6 3.9 10.4 9 11.7 5.1-1.3 9-6.1 9-11.7V4.6L11 1Z" />
                  <text x="11" y="17" textAnchor="middle">{blocked ? '✕' : '✓'}</text>
                </g>
              </g>
            )
          })}
          {Object.entries(NODES).map(([k, n]) => (
            <g key={k} className={`am-node ${lit.has(k) ? 'lit' : ''}`} transform={`translate(${n.x - 80} ${n.y - 36})`}>
              <rect width="160" height="72" rx="14" />
              <text x="80" y="31" textAnchor="middle" className="am-name">{n.name}</text>
              <text x="80" y="52" textAnchor="middle" className="am-sub">{n.sub}</text>
            </g>
          ))}
          <g className="am-legend" transform="translate(300 268)">
            <rect width="430" height="54" rx="12" />
            <g transform="translate(16 15)" className="am-shield"><path d="M11 1 2 4.6v7.2c0 5.6 3.9 10.4 9 11.7 5.1-1.3 9-6.1 9-11.7V4.6L11 1Z" /><text x="11" y="17" textAnchor="middle">✓</text></g>
            <text x="48" y="24" className="am-name">Arbiter checks every hop</text>
            <text x="48" y="42" className="am-sub">identity · matrix · borrowed powers · loops · trust tags</text>
          </g>
        </svg>
      </div>
      <div className={`am-caption v-${c.verdict}`} aria-live="polite">
        <b>{c.head}</b>
        <p>{c.text}</p>
      </div>
    </div>
  )
}
