import React from 'react'
import { api } from '../api.js'
import { Panel, Verdict } from '../parts.jsx'
import { agentName, time } from '../lib.js'

const KNOWN = ['allow', 'alert', 'hold', 'block', 'flag', 'clean']

export function AuditPage({ audit, setAudit }) {
  if (!audit) return null
  const v = audit.verify
  const reload = () => api.audit().then(setAudit)
  return (
    <div className="audit">
      <div className={`integrity ${v.ok ? 'ok' : 'broken'}`}>
        <div className="integrity-icon" aria-hidden="true">{v.ok ? '✓' : '!'}</div>
        <div>
          <h2>{v.ok ? 'Every entry is intact' : `Entry #${v.broken_at} was changed`}</h2>
          <p>{v.ok
            ? `${v.entries} entries, each sealed with the hash of the one before it. Editing any past decision breaks the chain from that point on.`
            : v.message}</p>
        </div>
        <div className="integrity-actions">
          <button className="btn btn-ghost" onClick={reload}>Verify chain</button>
          <button className="btn btn-bad-ghost" onClick={() => api.tamper().then(reload).catch((e) => alert(e.message))}>Simulate an insider edit</button>
        </div>
      </div>
      <Panel title="Log">
        <div className="table-wrap">
          <table className="log">
            <thead><tr><th>#</th><th>Time</th><th>What</th><th>Agent</th><th>Decision</th><th>Risk</th><th>Reason</th><th>Hash</th></tr></thead>
            <tbody>
              {audit.entries.map((e) => (
                <tr key={e.id} className={v.broken_at && e.id >= v.broken_at ? 'broken' : ''}>
                  <td>{e.id}</td>
                  <td className="nowrap">{time(e.ts)}</td>
                  <td>{e.kind}</td>
                  <td>{agentName(e.agent)}</td>
                  <td>{KNOWN.includes(e.decision) ? <Verdict d={e.decision} size="sm" /> : e.decision}</td>
                  <td>{e.risk}</td>
                  <td className="reason">{e.reason}</td>
                  <td><code title={e.hash}>{e.hash.slice(0, 8)}</code></td>
                </tr>
              ))}
              {!audit.entries.length && <tr><td colSpan="8" className="muted">Empty. Run a scenario.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
