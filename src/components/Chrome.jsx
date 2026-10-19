import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ExternalLink, FileText, Github, Hash, Home, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { LINKS } from '../data/arbiter.js'
import { DOC_PAGES } from '../docs/registry.js'
import { useTheme } from '../lib.jsx'

export function Logo({ sub }) {
  return (
    <Link to="/" className="logo" aria-label="Arbiter home">
      <svg width="26" height="30" viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1 2 5v8c0 6.3 4.3 11.6 10 13 5.7-1.4 10-6.7 10-13V5L12 1Z" fill="#2563eb" /><path d="m7.5 13.8 3.2 3.2 6-6.4" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <b>Arbiter</b>
      {sub && <small>{sub}</small>}
    </Link>
  )
}

const LANDING = [
  ['how', 'How it works'],
  ['demo', 'Try the checkpoint'],
  ['agents', 'Multi-agent'],
  ['results', 'Results'],
]

export function Header({ onSearch }) {
  const [theme, toggle] = useTheme()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const inDocs = loc.pathname.startsWith('/docs')
  useEffect(() => setOpen(false), [loc.pathname, loc.hash])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { const m = document.getElementById('main'); if (m) { e.preventDefault(); m.setAttribute('tabindex', '-1'); m.focus(); m.scrollIntoView() } }}>Skip to content</a>
      <header className="site-header">
        <div className="container">
          <Logo sub={inDocs ? 'Docs' : null} />
          <nav className="nav" aria-label="Main">
            {LANDING.map(([id, t]) => <Link key={id} to={`/#${id}`}>{t}</Link>)}
            <NavLink to="/docs/introduction" className={() => (inDocs ? 'active' : '')}>Docs</NavLink>
          </nav>
          <div className="header-right">
            <button type="button" className="search-btn" onClick={onSearch} aria-label="Search the docs">
              <Search aria-hidden="true" /><span>Search docs</span><kbd>Ctrl K</kbd>
            </button>
            <button type="button" className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <a className="icon-btn hide-sm" href={LINKS.repo} target="_blank" rel="noopener noreferrer" aria-label="Source on GitHub"><Github /></a>
            <a className="btn btn-brand btn-sm hide-sm" href={LINKS.demo} target="_blank" rel="noopener noreferrer">Live demo <ExternalLink aria-hidden="true" /></a>
            <button type="button" className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <nav className="mobile-nav" id="mobile-nav" aria-label="Main">
          {LANDING.map(([id, t]) => <Link key={id} to={`/#${id}`}>{t}</Link>)}
          <Link to="/docs/introduction">Docs</Link>
          <a href={LINKS.demo} target="_blank" rel="noopener noreferrer">Live demo ↗</a>
          <a href={LINKS.repo} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </nav>
      )}
    </>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div>
          <Logo />
          <p>A control layer that checks every AI agent action before it runs, in any language. Built for DevHost 2026, problem statement 2.1: AI Agent Safety and Control.</p>
        </div>
        <div>
          <h4>Product</h4>
          <Link to="/#how">How it works</Link>
          <Link to="/#demo">Try the checkpoint</Link>
          <Link to="/#results">Results</Link>
          <a href={LINKS.demo} target="_blank" rel="noopener noreferrer">Live demo ↗</a>
        </div>
        <div>
          <h4>Docs</h4>
          <Link to="/docs/quickstart">Quickstart</Link>
          <Link to="/docs/pipeline">The 7-step check</Link>
          <Link to="/docs/sdk">Python SDK</Link>
          <Link to="/docs/red-team">Red-team results</Link>
        </div>
        <div>
          <h4>Project</h4>
          <a href={LINKS.repo} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <Link to="/docs/roadmap">Roadmap</Link>
          <Link to="/docs/references">References</Link>
          <Link to="/docs/research-notes">Research notes</Link>
        </div>
        <div className="foot-bottom">
          <span>Arbiter · DevHost 2026 · Sahyadri, Mangaluru</span>
          <span>Every score on this site comes from the prototype's own test run.</span>
        </div>
      </div>
    </footer>
  )
}

/* ---------- Ctrl/⌘ K search ---------- */
const EXTRA = [
  { kind: 'page', title: 'Home', desc: 'Arbiter overview', to: '/', icon: Home },
  { kind: 'page', title: 'Live demo', desc: 'arbiter-vvky.onrender.com', href: LINKS.demo, icon: ExternalLink },
  { kind: 'page', title: 'GitHub repository', desc: 'safafibm-ops/Arbiter', href: LINKS.repo, icon: Github },
]

export function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const nav = useNavigate()
  const input = useRef(null)
  const items = useMemo(() => {
    const all = [
      ...DOC_PAGES.map((p) => ({ kind: 'doc', title: p.title, desc: `${p.group} · ${p.desc}`, to: `/docs/${p.slug}`, icon: FileText, hay: `${p.title} ${p.desc} ${p.group}` })),
      ...DOC_PAGES.flatMap((p) => p.sections.map(([id, t]) => ({ kind: 'section', title: t, desc: p.title, to: `/docs/${p.slug}#${id}`, icon: Hash, hay: `${t} ${p.title}` }))),
      ...EXTRA.map((e) => ({ ...e, hay: `${e.title} ${e.desc}` })),
    ]
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (!terms.length) return all.filter((x) => x.kind !== 'section').slice(0, 12)
    return all
      .map((x) => {
        const h = x.hay.toLowerCase()
        if (!terms.every((t) => h.includes(t))) return null
        const score = (x.title.toLowerCase().startsWith(terms[0]) ? 0 : 1) + (x.kind === 'section' ? 0.5 : 0)
        return { ...x, score }
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 14)
  }, [q])

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 0) } }, [open])
  useEffect(() => setSel(0), [q])
  if (!open) return null

  const go = (it) => {
    onClose()
    if (it.href) window.open(it.href, '_blank', 'noopener')
    else nav(it.to)
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && items[sel]) { e.preventDefault(); go(items[sel]) }
    else if (e.key === 'Escape') onClose()
  }
  return (
    <div className="cmdk-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search">
        <div className="cmdk-in">
          <Search aria-hidden="true" />
          <input ref={input} id="cmdk-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search the docs: risk score, Hindi, approvals…" aria-label="Search" aria-controls="cmdk-list" autoComplete="off" />
          <kbd>Esc</kbd>
        </div>
        <div className="cmdk-list" id="cmdk-list" role="listbox">
          {items.length === 0 && <div className="cmdk-empty">No matches for “{q}”. Try “scanner”, “refund” or “kill switch”.</div>}
          {items.map((it, i) => {
            const Icon = it.icon || BookOpen
            return (
              <button key={it.kind + it.title + (it.to || it.href)} type="button" role="option" aria-selected={i === sel} className="cmdk-item"
                onMouseEnter={() => setSel(i)} onClick={() => go(it)}>
                <Icon aria-hidden="true" /><span><b>{it.title}</b><small>{it.desc}</small></span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
