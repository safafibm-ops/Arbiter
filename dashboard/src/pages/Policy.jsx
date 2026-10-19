import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Panel } from '../parts.jsx'
import { ZONES } from '../lib.js'

export function PolicyPage({ state }) {
  const [p, setP] = useState(null)
  useEffect(() => { api.policy().then(setP).catch(() => {}) }, [state.learned_rules?.length])
  const rules = state.learned_rules || []
  return (
    <div className="policy">
      <div className="policy-top">
        <Panel title="Decision thresholds">
          <div className="thresholds">
            {ZONES.map((z) => (
              <div key={z.label} className={`th tone-border-${z.tone}`}>
                <b>{z.from}–{z.to === 100 ? 100 : z.to - 1}</b>
                <span>{z.label}</span>
              </div>
            ))}
          </div>
          <p className="muted small pad">A hard rule (limit, borrowed power, tainted arguments, impostor) blocks whatever the score.</p>
        </Panel>
        <Panel title="Rules learned from approvals" aside={rules.length > 0 && <button className="link" onClick={() => api.forgetRules()}>Forget all</button>}>
          {!rules.length && <p className="muted pad">None yet. On a held action, click “Approve &amp; make it a rule” and Arbiter turns the decision into a rule that auto-approves similar safe cases.</p>}
          {rules.map((r) => (
            <div key={r.id} className="learned">
              <b>{r.plain}</b>
              <code>{r.tool} · {r.when}</code>
              <small className="muted">by {r.created_by} · {r.created_at}</small>
            </div>
          ))}
        </Panel>
      </div>
      <Panel title="Company policy" aside={<span className="muted small">policies/shopco.yaml · default deny</span>}>
        <pre className="yaml">{p?.yaml}</pre>
      </Panel>
    </div>
  )
}
