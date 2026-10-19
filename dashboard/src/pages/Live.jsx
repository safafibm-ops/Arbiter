import React, { useMemo, useState } from 'react'
import { ApprovalCard, Checkpoint, DecisionDetails, FeedRow, Kpi, Panel, Story } from '../parts.jsx'
import { rupees, time } from '../lib.js'

const QUICK = ['lookup', 'big_refund', 'hindi_attack', 'borrowed_power']

export function LivePage({ feed, stats, shop, pending, story, pinned, setPinned, scenarios, run, running, setPage }) {
  const [filter, setFilter] = useState('all')
  const hero = useMemo(() => {
    if (pinned) return feed.find((v) => v.id === pinned)
    return feed.find((v) => v.kind === 'action') || feed.find((v) => v.kind === 'message')
  }, [feed, pinned])
  const shown = feed.filter((v) => filter === 'all' || (filter === 'stopped' ? ['block', 'hold', 'flag'].includes(v.decision) || v.would_have : v.kind === filter))

  return (
    <div className="live">
      <div className="kpis">
        <Kpi label="Actions checked" value={stats.total} />
        <Kpi label="Allowed" value={stats.allowed} tone="good" />
        <Kpi label="Waiting for a manager" value={pending.length} tone={pending.length ? 'warn' : undefined} />
        <Kpi label="Blocked" value={stats.blocked} tone={stats.blocked ? 'bad' : undefined} />
        <Kpi label="Money protected" value={rupees(stats.saved)} tone="good" hint="Refunds Arbiter blocked" />
        <Kpi label="Money lost" value={rupees(shop?.money_lost)} tone={shop?.money_lost ? 'bad' : undefined} hint="Paid to attackers while protection was off" />
        <Kpi label="Time per check" value={stats.latency ? `${stats.latency} ms` : '–'} />
      </div>

      <div className="hero-head">
        <h2>{pinned ? 'Selected decision' : 'Latest decision'}</h2>
        {pinned && <button className="link" onClick={() => setPinned(null)}>Follow live</button>}
      </div>
      <Checkpoint v={hero} pending={!!hero && pending.some((p) => p.id === hero.id)} />

      <div className="live-grid">
        <div className="col">
          {hero && (hero.factors?.length || hero.hard?.length) ? (
            <Panel title="Inside this decision">
              <DecisionDetails v={hero} />
            </Panel>
          ) : null}
          <Panel
            title="Activity"
            aside={
              <div className="seg-ctl" role="tablist">
                {[['all', 'All'], ['stopped', 'Stopped'], ['action', 'Tools'], ['message', 'Messages'], ['scan', 'Scans']].map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
                ))}
              </div>
            }
          >
            {!shown.length && <p className="muted pad">No decisions yet.</p>}
            <div className="feed">
              {shown.slice(0, 60).map((v) => (
                <FeedRow key={v.id} v={v} active={hero?.id === v.id} onClick={() => setPinned(v.id)} />
              ))}
            </div>
          </Panel>
        </div>

        <div className="col side">
          <Panel title="Waiting for a manager" aside={pending.length > 0 && <span className="count">{pending.length}</span>} className={pending.length ? 'panel-attn' : ''}>
            {!pending.length && <p className="muted pad">Nothing to approve. Only high-risk actions come here, and no answer in time means reject.</p>}
            {pending.map((v) => <ApprovalCard key={v.id} v={v} />)}
          </Panel>

          <Panel title={story[0] ? `What's happening · ${story[0].title}` : "What's happening"}>
            <Story story={story.filter((s) => s.kind !== 'start')} />
          </Panel>

          <Panel title="Run a scenario" aside={<button className="link" onClick={() => setPage('lab')}>All 15 →</button>}>
            <div className="quick">
              {QUICK.map((id) => scenarios.find((s) => s.id === id)).filter(Boolean).map((s) => (
                <button key={s.id} className={`quick-btn ${running === s.id ? 'running' : ''} ${s.group}`} onClick={() => run(s.id)}>
                  <span>{s.title}</span>
                  <small>{s.group === 'attack' ? 'Attack' : 'Everyday'}</small>
                </button>
              ))}
            </div>
          </Panel>

          {shop && (
            <Panel title="ShopCo ledger" aside={<span className="muted small">what really happened</span>}>
              <div className="ledger-sum">
                <div><span>Legit refunds paid</span><b className="tone-text-good">{rupees(shop.refunded_ok)}</b></div>
                <div><span>Lost to attacks</span><b className={shop.money_lost ? 'tone-text-bad' : ''}>{rupees(shop.money_lost)}</b></div>
              </div>
              {shop.harms.length > 0 && <ul className="harms">{shop.harms.map((h, i) => <li key={i}>{h}</li>)}</ul>}
              <ul className="ledger">
                {shop.ledger.slice(0, 6).map((e, i) => (
                  <li key={i} className={e.harm ? 'bad' : ''}><small>{time(e.ts)}</small>{e.text}</li>
                ))}
                {!shop.ledger.length && <li className="muted">No business actions yet.</li>}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
