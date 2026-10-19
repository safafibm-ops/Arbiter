import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { SCENARIOS, STEPS, VERDICT } from '../data/arbiter.js'
import RiskBar from './RiskBar.jsx'

const ICON = { pass: '✓', warn: '!', fail: '✕' }
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** The Live checkpoint, replayed: pick a real ShopCo action and watch the seven checks run. */
export default function VerdictSim({ initial = 'attack', title = 'Watch Arbiter decide' }) {
  const [id, setId] = useState(initial)
  const [shown, setShown] = useState(STEPS.length + 1) // steps revealed; STEPS.length + 1 = decision too
  const timers = useRef([])
  const s = SCENARIOS.find((x) => x.id === id)

  const play = (next) => {
    timers.current.forEach(clearTimeout); timers.current = []
    setId(next)
    if (reduced()) { setShown(STEPS.length + 1); return }
    setShown(0)
    for (let i = 1; i <= STEPS.length + 1; i++) timers.current.push(setTimeout(() => setShown(i), i * 190 + (i > STEPS.length ? 140 : 0)))
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const onKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = SCENARIOS.findIndex((x) => x.id === id)
    const n = SCENARIOS[(i + (e.key === 'ArrowRight' ? 1 : -1) + SCENARIOS.length) % SCENARIOS.length]
    play(n.id)
    requestAnimationFrame(() => document.getElementById(`sim-tab-${n.id}`)?.focus())
  }
  const decided = shown > STEPS.length
  const v = VERDICT[s.verdict]

  return (
    <section className="sim" aria-label={title}>
      <header className="sim-head">
        <div>
          <h3>{title}</h3>
          <p>Four real ShopCo actions, replayed from the prototype's decision feed.</p>
        </div>
        <div className="sim-tabs" role="tablist" aria-label="Scenario" onKeyDown={onKey}>
          {SCENARIOS.map((x) => (
            <button key={x.id} id={`sim-tab-${x.id}`} role="tab" type="button" aria-selected={x.id === id} tabIndex={x.id === id ? 0 : -1}
              className={`sim-tab v-${x.verdict}`} onClick={() => play(x.id)}>
              <i aria-hidden="true" />{x.tab}
            </button>
          ))}
        </div>
      </header>

      <div className="sim-body" role="tabpanel" aria-labelledby={`sim-tab-${id}`}>
        <div className="sim-col">
          <div className="sim-label">An agent tries something</div>
          <div className="sim-chain">
            {s.chain.map((c, i) => (
              <span key={c} className="sim-chain-item">
                {i > 0 && <span className="sim-arrow" aria-hidden="true">→</span>}
                <span className={`pill ${i === s.chain.length - 1 ? 'pill-to' : ''}`}>{c}</span>
              </span>
            ))}
          </div>
          <div className="sim-tool"><code>{s.tool}</code></div>
          <p className="sim-plain">{s.plain}</p>
          <dl className="sim-args">
            {s.args.map(([k, val]) => (<div key={k}><dt>{k}</dt><dd>{val}</dd></div>))}
          </dl>
          <div className={`sim-source ${s.verdict === 'block' ? 'bad' : ''}`}>
            <b>{s.source.label}</b>
            <span lang={/[ऀ-ॿ]/.test(s.source.text) ? 'hi' : /[ಀ-೿]/.test(s.source.text) ? 'kn' : 'en'}>{s.source.text}</span>
            {s.source.gloss && <small>{s.source.gloss}</small>}
          </div>
        </div>

        <div className="sim-col">
          <div className="sim-label">Arbiter checks it first</div>
          <ol className="sim-steps">
            {STEPS.map((st, i) => {
              const [state, detail] = s.steps[i]
              const on = shown > i
              return (
                <li key={st.name} className={`sim-step ${on ? '' : 'pending'}`} data-s={on ? state : 'idle'}>
                  <span className="n">{i + 1}</span>
                  <span className="t"><b>{st.name}</b><small>{detail}</small></span>
                  <span className="st" aria-label={on ? state : 'waiting'}>{on ? ICON[state] : ''}</span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="sim-col sim-decision" aria-live="polite">
          <div className="sim-label">The decision, with a reason</div>
          {decided ? (
            <>
              <div className="sim-verdict-row">
                <span className={`verdict v-${s.verdict}`}><i aria-hidden="true">{v.icon}</i>{v.label}</span>
                <Gauge value={s.risk} verdict={s.verdict} />
              </div>
              <p className="sim-reason">{s.reason}</p>
              {s.hard.length > 0 && (
                <div className="sim-hard">
                  <div className="sim-label">Hard rules hit (these always block)</div>
                  {s.hard.map(([r, t]) => (<div key={r}><code>{r}</code> {t}</div>))}
                </div>
              )}
            </>
          ) : (
            <div className="sim-checking"><span className="spinner" aria-hidden="true" />Checking…</div>
          )}
        </div>
      </div>

      <div className="sim-risk">
        <div className="sim-label">Why {decided ? s.risk : '…'}? Every point has a reason</div>
        <RiskBar factors={decided ? s.factors : []} risk={decided ? s.risk : 0} dark />
      </div>
      <footer className="sim-foot">
        <span>Scores and reasons copied from <code>python -m shopco.redteam</code>, 19 Oct 2026.</span>
        <button type="button" className="sim-replay" onClick={() => play(id)}><RotateCcw aria-hidden="true" />Replay the check</button>
      </footer>
    </section>
  )
}

function Gauge({ value, verdict }) {
  const r = 34, c = Math.PI * r
  return (
    <div className="gauge" role="img" aria-label={`Risk ${value} out of 100`}>
      <svg viewBox="0 0 84 48" aria-hidden="true">
        <path d="M8 44 A34 34 0 0 1 76 44" className="g-track" />
        <path d="M8 44 A34 34 0 0 1 76 44" className={`g-fill v-${verdict}`} style={{ strokeDasharray: c, strokeDashoffset: c * (1 - value / 100) }} />
      </svg>
      <b>{value}</b><span>/100</span>
    </div>
  )
}
