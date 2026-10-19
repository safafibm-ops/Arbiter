import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { Sidebar, TopBar } from './Shell.jsx'
import { LivePage } from './pages/Live.jsx'
import { LabPage } from './pages/Lab.jsx'
import { AgentsPage } from './pages/Agents.jsx'
import { ScannerPage } from './pages/Scanner.jsx'
import { AuditPage } from './pages/Audit.jsx'
import { PolicyPage } from './pages/Policy.jsx'

const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
}

function useTheme() {
  const [theme, setTheme] = useState(() => store.get('arbiter-theme') ||
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    store.set('arbiter-theme', theme)
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [page, setPage] = useState('live')
  const [state, setState] = useState(null)
  const [feed, setFeed] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [shop, setShop] = useState(null)
  const [audit, setAudit] = useState(null)
  const [story, setStory] = useState([])
  const [results, setResults] = useState({})
  const [toasts, setToasts] = useState([])
  const [running, setRunning] = useState(null)
  const [pinned, setPinned] = useState(null)
  const [online, setOnline] = useState(true)

  const refresh = useCallback(() => {
    api.state().then(setState).catch(() => {})
    api.shopco().then(setShop).catch(() => {})
    api.audit().then(setAudit).catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    api.feed().then(setFeed).catch(() => {})
    api.scenarios().then(setScenarios).catch(() => {})
    const es = new EventSource('/api/stream')
    es.onopen = () => setOnline(true)
    es.onerror = () => setOnline(false)
    es.onmessage = (ev) => {
      const { type, data } = JSON.parse(ev.data)
      if (type === 'decision' || type === 'approval') {
        setFeed((f) => [data, ...f.filter((x) => x.id !== data.id)].slice(0, 200))
        if (type === 'approval' || data.kind === 'action') api.state().then(setState)
      } else if (type === 'state') setState((s) => ({ ...s, ...data }))
      else if (type === 'story') {
        setStory((s) => (data.kind === 'start' ? [data] : [...s, data]))
        if (['ok', 'block', 'harm'].includes(data.kind)) {
          setRunning(null)
          setResults((r) => ({ ...r, [data.scenario]: data.kind }))
        }
      } else if (type === 'alert' && data.level === 'critical' && !data.verdict_id) {
        const id = Math.random()
        setToasts((t) => [...t, { ...data, id }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000)
      } else if (type === 'shopco') setShop(data)
      else if (type === 'rule') api.state().then(setState)
      else if (type === 'reset') { setFeed([]); setStory([]); setResults({}); setPinned(null) }
    }
    const t = setInterval(() => {
      api.shopco().then(setShop).catch(() => {})
      api.audit().then(setAudit).catch(() => {})
    }, 2500)
    return () => { es.close(); clearInterval(t) }
  }, [refresh])

  const run = (id) => { setRunning(id); setPinned(null); setPage('live'); api.run(id) }

  const stats = useMemo(() => {
    const acts = feed.filter((v) => v.kind === 'action' || v.kind === 'message')
    const n = (d) => acts.filter((v) => v.decision === d).length
    const saved = acts.filter((v) => v.decision === 'block' && v.tool === 'issue_refund')
      .reduce((s, v) => s + (v.args?.amount || 0), 0)
    const lat = acts.filter((v) => v.latency_ms != null)
    return {
      total: acts.length, allowed: n('allow') + n('alert'), blocked: n('block'), saved,
      latency: lat.length ? (lat.reduce((s, v) => s + v.latency_ms, 0) / lat.length).toFixed(1) : null,
    }
  }, [feed])

  if (!state) {
    return <div className="boot"><div className="boot-mark" /><p>Connecting to Arbiter…</p></div>
  }

  const pending = state.pending || []
  const props = { state, feed, scenarios, shop, audit, story, results, running, run, pinned, setPinned, stats, pending, refresh, setAudit, setPage }

  return (
    <div className={`shell ${state.enforce ? '' : 'is-off'}`}>
      <Sidebar page={page} setPage={setPage} pending={pending.length} state={state} refresh={refresh} />
      <div className="main">
        <TopBar page={page} state={state} audit={audit} theme={theme} toggleTheme={toggleTheme} online={online} />
        {!state.enforce && (
          <div className="banner warn" role="status"><b>Protection is off.</b> Agents act unchecked. Arbiter is only watching and shows what it would have done.</div>
        )}
        {state.kill_all && (
          <div className="banner bad" role="status"><b>Kill switch on.</b> Every agent is stopped until you restart them.</div>
        )}
        <div className="page">
          {page === 'live' && <LivePage {...props} />}
          {page === 'lab' && <LabPage {...props} />}
          {page === 'agents' && <AgentsPage {...props} />}
          {page === 'scanner' && <ScannerPage />}
          {page === 'audit' && <AuditPage {...props} />}
          {page === 'policy' && <PolicyPage state={state} />}
        </div>
      </div>
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast"><span className="toast-icon">!</span>{t.message}</div>)}
      </div>
    </div>
  )
}
