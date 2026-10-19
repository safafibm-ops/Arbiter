import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { api } from './api.js'

// First-run guide for evaluators: a spotlight + numbered pointer that walks through a real test.
// Each step completes when the evaluator does the action (or they press Next to just watch).

export const tourSignal = (name) => window.dispatchEvent(new CustomEvent('arbiter-tour', { detail: name }))

const KEY = 'arbiter-guide'
export const guideSeen = () => { try { return localStorage.getItem(KEY) === 'done' } catch { return false } }
const markSeen = () => { try { localStorage.setItem(KEY, 'done') } catch { /* private mode */ } }

const T = (name) => `[data-tour="${name}"]`
const GROUPS = ['Welcome', 'Everyday task', 'Attack in Hindi', 'Manager approval', 'Protection off', 'Language scanner', 'Audit log']

const STEPS = [
  { n: 1, modal: 'welcome' },
  {
    n: 2, page: 'live', target: T('run-lookup'),
    title: 'Run an everyday task',
    text: 'Click the highlighted scenario. The Support agent looks up a customer, which is a normal part of its job.',
    done: (c) => !!c.results.lookup,
    after: { target: T('decision'), title: 'Allowed', text: 'Risk 8 out of 100, so it goes straight through. Every action passes the 7 checks in the middle column before it runs.' },
  },
  {
    n: 3, page: 'live', target: T('run-hindi_attack'),
    title: 'Send an attack in Hindi',
    text: 'A customer email written in Hindi hides an instruction telling the agent to refund ₹48,000 to a new bank account. Run it.',
    done: (c) => !!c.results.hindi_attack,
    after: { target: T('decision'), title: 'Blocked at 95', text: 'Arbiter read the Hindi, found the hidden instruction, and stopped the refund before any money moved. The breakdown shows where each point of risk came from.' },
  },
  {
    n: 4, page: 'live', target: T('run-big_refund'),
    title: 'Ask for a large refund',
    text: 'A real customer asks for ₹8,000. That is above the agent’s own limit, so Arbiter holds it for a manager.',
    done: (c) => c.pending.length > 0,
  },
  {
    n: 4, page: 'live', target: T('approve'),
    title: 'Approve it and teach Arbiter',
    text: 'You are the manager. Click “Approve & make it a rule” and Arbiter turns your decision into a rule, so similar safe refunds won’t need you next time.',
    done: (c) => c.rules > c.base.rules || c.pending.length === 0,
    after: { target: T('nav-policy'), title: 'Rule saved', text: 'The refund went through, and your new rule is listed under Policy & rules. No answer in time would have meant reject.' },
  },
  {
    n: 5, target: T('protect'),
    title: 'Turn protection off',
    text: 'Now see what happens without Arbiter. Click the switch.',
    done: (c) => !c.state.enforce,
  },
  {
    n: 5, page: 'live', target: T('run-hindi_attack'),
    title: 'Send the same attack again',
    text: 'With protection off, the agent obeys the hidden instruction in the email.',
    done: (c) => c.results.hindi_attack === 'harm',
    after: { target: T('kpi-lost'), title: '₹48,000 lost', text: 'The money went to the attacker. Arbiter only watched, and the log still records what it would have blocked.' },
  },
  {
    n: 5, target: T('protect'),
    title: 'Turn protection back on',
    text: 'Click the switch again so every action is checked.',
    done: (c) => c.state.enforce,
  },
  {
    n: 6, target: T('nav-scanner'),
    title: 'Open the Language scanner',
    text: 'Attacks don’t only come in English. Open the scanner from the sidebar.',
    done: (c) => c.page === 'scanner',
  },
  {
    n: 6, page: 'scanner', target: T('chip-Kannada'),
    title: 'Scan a Kannada message',
    text: 'Click Kannada. The scanner reads English, Hindi, Kannada and Hinglish, and also catches invisible characters and look-alike letters.',
    done: (c) => c.signals.includes('scan:Kannada'),
    after: { target: T('scan-result'), title: 'Caught in Kannada', text: 'The result shows the language of each sentence, the cleaned English text, and the phrases that gave the attack away. Try the “Normal” samples too: they pass.' },
  },
  {
    n: 7, target: T('nav-audit'),
    title: 'Open the Audit log',
    text: 'Every decision Arbiter makes is written to a log that can’t be quietly edited.',
    done: (c) => c.page === 'audit',
  },
  {
    n: 7, page: 'audit', target: T('tamper'),
    title: 'Try to change the record',
    text: 'Each entry is sealed with the hash of the one before it. Click to simulate an insider editing an old decision.',
    done: (c) => c.audit && !c.audit.verify.ok,
    after: { target: T('integrity'), title: 'Tampering caught', text: 'The chain breaks at the edited entry, so you can see exactly which record was changed.' },
  },
  { n: 7, modal: 'finish' },
]

const PAD = 6
const CARD_W = 340

function useTargetRect(selector, tick) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    if (!selector) { setRect(null); return }
    let last = ''
    const read = () => {
      const el = document.querySelector(selector)
      if (!el) { if (last !== 'none') { last = 'none'; setRect(null) } return }
      const r = el.getBoundingClientRect()
      const key = [r.left, r.top, r.width, r.height].map(Math.round).join()
      if (key !== last) { last = key; setRect({ left: r.left, top: r.top, width: r.width, height: r.height }) }
    }
    read()
    const el = document.querySelector(selector)
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.top < 70 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    const id = setInterval(read, 120)
    window.addEventListener('resize', read)
    window.addEventListener('scroll', read, true)
    return () => { clearInterval(id); window.removeEventListener('resize', read); window.removeEventListener('scroll', read, true) }
  }, [selector, tick])
  return rect
}

function place(rect, cardH, vw, vh) {
  if (vw < 760 || !rect) return null
  const gap = 64
  const s = { left: rect.left - PAD, top: rect.top - PAD, right: rect.left + rect.width + PAD, bottom: rect.top + rect.height + PAD }
  const clampY = (y) => Math.max(16, Math.min(y, vh - cardH - 96))
  const clampX = (x) => Math.max(16, Math.min(x, vw - CARD_W - 16))
  const right = s.right + gap + CARD_W < vw - 16 && { left: s.right + gap, top: clampY(s.top - 10) }
  const left = s.left - gap - CARD_W > 16 && { left: s.left - gap - CARD_W, top: clampY(s.top - 10) }
  const below = s.bottom + gap + cardH < vh - 96 && { left: clampX(s.right - CARD_W), top: s.bottom + gap }
  const above = s.top - gap - cardH > 16 && { left: clampX(s.right - CARD_W), top: s.top - gap - cardH }
  // Wide targets (a banner, a result panel) read better with the card above or below them.
  const order = rect.width > vw * 0.45 ? [below, above, right, left] : [right, left, below, above]
  return order.find(Boolean) || { left: clampX(s.left), top: 16 }
}

export function Guide({ open, onClose, ctx, setPage }) {
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState('do')
  const [signals, setSignals] = useState([])
  const [base, setBase] = useState({ rules: 0 })
  const [cardH, setCardH] = useState(200)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const cardRef = useRef(null)

  const step = STEPS[i]
  const c = { ...ctx, signals, base, rules: (ctx.state.learned_rules || []).length, pending: ctx.state.pending || [] }
  const target = step.modal ? null : phase === 'after' && step.after ? step.after.target : step.target
  const rect = useTargetRect(open ? target : null, i)

  useEffect(() => { if (open) { setI(0); setPhase('do') } }, [open])
  useEffect(() => {
    const on = (e) => setSignals((s) => [...s, e.detail])
    const rs = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('arbiter-tour', on)
    window.addEventListener('resize', rs)
    return () => { window.removeEventListener('arbiter-tour', on); window.removeEventListener('resize', rs) }
  }, [])

  // Entering a step: jump to its page and remember the starting point.
  useEffect(() => {
    if (!open || step.modal) return
    if (step.page) setPage(step.page)
    setBase({ rules: (ctx.state.learned_rules || []).length })
    setSignals([])
  }, [open, i]) // eslint-disable-line react-hooks/exhaustive-deps

  const isDone = !step.modal && phase === 'do' && step.done(c)
  useEffect(() => {
    if (!isDone) return
    if (step.after) setPhase('after')
    else { const t = setTimeout(next, 700); return () => clearTimeout(t) }
  }, [isDone]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => { if (cardRef.current) setCardH(cardRef.current.offsetHeight) })

  if (!open) return null

  function next() { setPhase('do'); setI((x) => Math.min(x + 1, STEPS.length - 1)) }
  const jump = (n) => { setPhase('do'); setI(STEPS.findIndex((s) => s.n === n)) }
  const finish = (reset) => { markSeen(); onClose(); if (reset) api.reset() }
  const start = () => { api.reset().then(() => { setPage('live'); next() }).catch(next) }

  const dock = (
    <div className="guide-dock">
      <div className="guide-dots" role="tablist" aria-label="Guide steps">
        {GROUPS.map((g, k) => {
          const n = k + 1
          const state = n < step.n ? 'past' : n === step.n ? 'now' : ''
          return (
            <button key={n} className={`guide-dot ${state}`} title={g} aria-label={`Step ${n}: ${g}`} aria-selected={n === step.n} onClick={() => jump(n)}>
              {state === 'past' ? '✓' : n}
            </button>
          )
        })}
        <button className="guide-skip" onClick={() => finish(false)}>Skip tour</button>
      </div>
    </div>
  )

  if (step.modal) {
    return (
      <div className="guide-modal-wrap" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <div className="guide-modal">
          {step.modal === 'welcome' ? (
            <>
              <div className="guide-eyebrow">Evaluator guide · 7 steps · about 3 minutes</div>
              <h2 id="guide-title">Test Arbiter yourself</h2>
              <p>Arbiter sits between AI agents and the tools they use. Before any action runs, it checks who is asking, what language the request came in, and how risky it is, then allows, holds or blocks it.</p>
              <p>This guide points at one control at a time. You do the action, and the guide explains what Arbiter did. You can also press Next to just watch.</p>
              <ol className="guide-list">
                {GROUPS.slice(1).map((g) => <li key={g}>{g}</li>)}
              </ol>
              <p className="guide-note">Starting resets the demo so you see a clean run.</p>
              <div className="guide-actions">
                <button className="btn btn-ghost" onClick={() => finish(false)}>Skip, I’ll explore</button>
                <button className="btn btn-brand" onClick={start}>Start the test →</button>
              </div>
            </>
          ) : (
            <>
              <div className="guide-eyebrow">Test complete</div>
              <h2 id="guide-title">You’ve seen Arbiter at work</h2>
              <ul className="guide-recap">
                <li><b>Allowed</b> an everyday lookup in under 2 ms.</li>
                <li><b>Blocked</b> a ₹48,000 attack hidden in Hindi.</li>
                <li><b>Held</b> a large refund for you, then learned a rule from your approval.</li>
                <li><b>Showed</b> the same attack succeeding with protection off.</li>
                <li><b>Caught</b> a Kannada injection and an edit to the audit log.</li>
              </ul>
              <p>The Attack lab has all 15 scenarios. Replay this guide any time from the sidebar.</p>
              <div className="guide-actions">
                <button className="btn btn-ghost" onClick={() => finish(false)}>Keep this state</button>
                <button className="btn btn-brand" onClick={() => finish(true)}>Finish and reset demo</button>
              </div>
            </>
          )}
        </div>
        {step.modal === 'welcome' && dock}
      </div>
    )
  }

  const view = phase === 'after' && step.after ? step.after : step
  const pos = place(rect, cardH, size.w, size.h)
  const badge = rect ? { x: rect.left + rect.width + PAD, y: rect.top - PAD } : null
  let line = null
  if (pos && badge) {
    const cx = Math.max(pos.left, Math.min(badge.x, pos.left + CARD_W))
    const cy = Math.max(pos.top, Math.min(badge.y, pos.top + cardH))
    line = { x1: badge.x, y1: badge.y, x2: cx, y2: cy }
  }
  const groupSteps = STEPS.filter((s) => s.n === step.n && !s.modal)
  const sub = groupSteps.indexOf(step)
  const done = phase === 'after'

  return (
    <div className="guide" aria-live="polite">
      {rect
        ? <div className={`guide-spot ${done ? 'is-done' : ''}`} style={{ left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }} />
        : <div className="guide-dim" />}
      {line && (
        <svg className="guide-line" width={size.w} height={size.h} aria-hidden="true">
          <line {...line} />
          <circle cx={line.x2} cy={line.y2} r="4" />
        </svg>
      )}
      {badge && <div className={`guide-badge ${done ? 'is-done' : ''}`} style={{ left: badge.x - 17, top: badge.y - 17 }}>{done ? '✓' : step.n}</div>}
      <div ref={cardRef} className={`guide-card ${pos ? '' : 'docked'}`} style={pos ? { left: pos.left, top: pos.top } : undefined} role="dialog" aria-labelledby="guide-card-title">
        <div className="guide-card-head">
          <span className="guide-step">Step {step.n} / 7{groupSteps.length > 1 ? ` · part ${sub + 1} of ${groupSteps.length}` : ''}</span>
          <button className="guide-x" onClick={() => finish(false)} aria-label="Close guide">×</button>
        </div>
        <div className="guide-progress" aria-hidden="true">
          {GROUPS.map((g, k) => <i key={g} className={k + 1 < step.n || (k + 1 === step.n && done) ? 'full' : k + 1 === step.n ? 'half' : ''} />)}
        </div>
        <h3 id="guide-card-title">{done && <span className="guide-ok">✓</span>}{view.title}</h3>
        <p>{view.text}</p>
        {!rect && !done && <p className="guide-hint">The highlighted control isn’t on screen. {step.page ? 'Open the page from the sidebar.' : ''}</p>}
        <div className="guide-card-foot">
          {done ? <span className="guide-status good">Done</span> : <span className="guide-status"><i className="dot dot-live" />Waiting for you</span>}
          <button className={`btn ${done ? 'btn-brand' : 'btn-ghost'}`} onClick={next}>{done ? 'Next →' : 'Skip step →'}</button>
        </div>
      </div>
      {dock}
    </div>
  )
}
