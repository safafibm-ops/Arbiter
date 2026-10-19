import React from 'react'
import { api } from './api.js'

const PATHS = {
  live: 'M3 12h4l3-8 4 16 3-8h4',
  lab: 'M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3M7 15h10',
  agents: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M12.5 20a5 5 0 0 1 9.5-2',
  scanner: 'M4 5h7M7.5 3v2M5 5c0 4 2.5 7 6 8M10 5c-.5 3-3 6-6 7M13 21l4-9 4 9M14.5 18h5',
  audit: 'M7 3h10v18l-5-3-5 3zM10 8h4M10 12h4',
  policy: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  power: 'M12 3v8M6.3 6.8a8 8 0 1 0 11.4 0',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
}

export const Icon = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>
)

export const Logo = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 2 5 8v10c0 9.4 6.4 17.2 15 20 8.6-2.8 15-10.6 15-20V8z" fill="var(--brand)" />
    <path d="M20 6.5 9 11v7.3c0 7 4.7 12.8 11 15 6.3-2.2 11-8 11-15V11z" fill="none" stroke="var(--brand-ink)" strokeOpacity=".35" />
    <path d="m13.5 19.5 4.5 4.5 8.5-9" stroke="var(--brand-ink)" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const NAV = [
  ['live', 'Live checkpoint', 'live'],
  ['lab', 'Attack lab', 'lab'],
  ['agents', 'Agents', 'agents'],
  ['scanner', 'Language scanner', 'scanner'],
  ['audit', 'Audit log', 'audit'],
  ['policy', 'Policy & rules', 'policy'],
]

export const TITLES = Object.fromEntries(NAV.map(([k, l]) => [k, l]))

export function Sidebar({ page, setPage, pending, state, refresh }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo />
        <div>
          <div className="brand-name">Arbiter</div>
          <div className="brand-sub">AI agent checkpoint</div>
        </div>
      </div>
      <nav className="nav" aria-label="Pages">
        {NAV.map(([k, label, icon]) => (
          <button key={k} className={page === k ? 'active' : ''} onClick={() => setPage(k)} aria-current={page === k ? 'page' : undefined}>
            <Icon name={icon} />
            <span>{label}</span>
            {k === 'live' && pending > 0 && <em className="nav-badge" title="Waiting for a manager">{pending}</em>}
          </button>
        ))}
      </nav>
      <div className="side-controls">
        <button className={`protect ${state.enforce ? 'on' : 'off'}`} onClick={() => api.mode(!state.enforce)} role="switch" aria-checked={state.enforce}>
          <span className="protect-track"><span className="protect-knob" /></span>
          <span className="protect-text">
            <b>Protection {state.enforce ? 'on' : 'off'}</b>
            <small>{state.enforce ? 'Every action is checked' : 'Watch-only: agents act freely'}</small>
          </span>
        </button>
        <button className={`killswitch ${state.kill_all ? 'engaged' : ''}`} onClick={() => api.kill('all', null, !state.kill_all)}>
          <Icon name="power" /> {state.kill_all ? 'Restart all agents' : 'Stop all agents'}
        </button>
        <button className="side-link" onClick={() => api.reset().then(refresh)}>
          <Icon name="reset" size={15} /> Reset demo
        </button>
      </div>
    </aside>
  )
}

export function TopBar({ page, state, audit, theme, toggleTheme, online }) {
  const v = audit?.verify
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">ShopCo · 4 agents protected</div>
        <h1>{TITLES[page]}</h1>
      </div>
      <div className="topbar-right">
        <span className={`pill ${online ? '' : 'pill-bad'}`}><i className={`dot ${online ? 'dot-live' : 'dot-bad'}`} />{online ? 'Live' : 'Reconnecting'}</span>
        <span className="pill" title={state.llm ? 'Open LLM used for translation and unclear cases' : 'Set GROQ_API_KEY or OLLAMA_URL to add an LLM'}>
          {state.llm ? state.llm : 'Rules only · no LLM'}
        </span>
        {v && (
          <span className={`pill ${v.ok ? 'pill-good' : 'pill-bad'}`} title={v.message}>
            {v.ok ? `Log intact · ${v.entries}` : `Log tampered at #${v.broken_at}`}
          </span>
        )}
        <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Light / dark">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </header>
  )
}
