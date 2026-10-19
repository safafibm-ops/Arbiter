import React from 'react'
import { Verdict } from '../parts.jsx'

const OUTCOME = {
  ok: { label: 'Went through', tone: 'good' },
  block: { label: 'Stopped by Arbiter', tone: 'good' },
  harm: { label: 'Damage done', tone: 'bad' },
}

export function LabPage({ scenarios, run, running, results, state }) {
  const group = (g, title, sub) => (
    <section className="lab-group">
      <div className="lab-head">
        <h2>{title}</h2>
        <p className="muted">{sub}</p>
      </div>
      <div className="lab-grid">
        {scenarios.filter((s) => s.group === g).map((s, i) => {
          const r = results[s.id] && OUTCOME[results[s.id]]
          return (
            <article key={s.id} className={`lab-card ${g} ${running === s.id ? 'running' : ''}`}>
              <div className="lab-card-top">
                <span className="lab-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="lab-expect"><small>Expected</small><Verdict d={s.expect} size="sm" /></span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.blurb}</p>
              <div className="lab-tags">{s.tags?.map((t) => <span key={t} className="tag">{t}</span>)}</div>
              <div className="lab-foot">
                {r ? <span className={`outcome tone-text-${r.tone}`}>{r.label}</span> : <span className="muted small">Not run yet</span>}
                <button className={`btn ${g === 'attack' ? 'btn-ink' : 'btn-ghost'}`} onClick={() => run(s.id)} disabled={running === s.id}>
                  {running === s.id ? 'Running…' : 'Run'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
  return (
    <div className="lab">
      <div className={`lab-intro ${state.enforce ? '' : 'off'}`}>
        <div>
          <h2>{state.enforce ? 'Protection is on' : 'Protection is off'}</h2>
          <p>{state.enforce
            ? 'Run an attack and watch Arbiter stop it, then switch protection off in the sidebar and run it again to see the damage it prevents.'
            : 'Agents act unchecked. Attacks will succeed and show up as losses in the ShopCo ledger. Arbiter still records what it would have done.'}</p>
        </div>
      </div>
      {group('normal', 'Everyday work', 'Arbiter should stay out of the way: routine actions run, big ones go to a manager.')}
      {group('attack', 'Attacks', 'Prompt injection in four languages, borrowed powers, loops, impostors and rogue agents.')}
    </div>
  )
}
