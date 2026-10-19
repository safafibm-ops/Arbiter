import React from 'react'
import { api } from '../api.js'
import { AgentMap, Panel } from '../parts.jsx'
import { TOOL_LABEL, agentName, rupees } from '../lib.js'

export function AgentsPage({ state }) {
  return (
    <div className="agents">
      <Panel title="Who may talk to whom" aside={<span className="legend"><i className="lg lg-allowed" />allowed link<i className="lg lg-good" />last message allowed<i className="lg lg-bad" />blocked</span>}>
        <AgentMap state={state} big />
        <p className="muted small pad">Every message between agents passes through Arbiter. A link not drawn here is refused, and a delegated action must be allowed for every agent in the chain (no borrowed powers).</p>
      </Panel>
      <div className="agent-cards">
        {state.agents.map((a) => (
          <article key={a.id} className={`agent-card ${a.paused ? 'paused' : ''}`}>
            <div className="agent-top">
              <div className="avatar" aria-hidden="true">{agentName(a.id).charAt(0)}</div>
              <div>
                <h3>{a.name}</h3>
                <span className="muted small">role: {a.role}</span>
              </div>
              <button className={`btn ${a.paused ? 'btn-good' : 'btn-ghost'} sm`} onClick={() => api.kill('agent', a.id, !a.paused)}>
                {a.paused ? 'Resume' : 'Pause'}
              </button>
            </div>
            {a.paused && <div className="note bad">{a.paused}</div>}
            <div className="trust">
              <div className="trust-row"><span>Trust</span><b>{a.trust}/100</b></div>
              <div className="trust-bar"><span className={a.trust < 60 ? 'bad' : a.trust < 90 ? 'warn' : 'good'} style={{ width: `${a.trust}%` }} /></div>
            </div>
            <h4>Allowed tools</h4>
            <ul className="tool-list">
              {Object.entries(a.tools).map(([t, lim]) => (
                <li key={t}>
                  <span>{TOOL_LABEL[t] || t}</span>
                  {lim?.max_amount ? <em>up to {rupees(lim.max_amount)}</em> : <em className="muted">within rules</em>}
                  <button className={`mini ${state.disabled_tools?.includes(t) ? 'off' : ''}`} onClick={() => api.kill('tool', t, !state.disabled_tools?.includes(t))} title="Switch this tool off for every agent">
                    {state.disabled_tools?.includes(t) ? 'tool off' : 'on'}
                  </button>
                </li>
              ))}
            </ul>
            <h4>May message</h4>
            <div className="lab-tags">{a.can_message.length ? a.can_message.map((m) => <span key={m} className="tag">{agentName(m)}</span>) : <span className="muted small">nobody</span>}</div>
          </article>
        ))}
      </div>
    </div>
  )
}
