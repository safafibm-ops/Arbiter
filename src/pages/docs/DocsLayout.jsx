import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { DOC_GROUPS, DOC_PAGES, findPage } from '../../docs/registry.js'
import { PAGES } from './pages.jsx'

export default function DocsLayout() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const page = findPage(slug)
  const [navOpen, setNavOpen] = useState(false)
  const [active, setActive] = useState(null)

  useEffect(() => { setNavOpen(false) }, [slug])
  useEffect(() => { if (page) document.title = `${page.title} · Arbiter docs` }, [page])
  useEffect(() => {
    if (!page || !('IntersectionObserver' in window)) return
    const els = page.sections.map(([id]) => document.getElementById(id)).filter(Boolean)
    setActive(els[0]?.id || null)
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-15% 0px -75% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [page])

  if (!page) return <Navigate to="/docs/introduction" replace />
  const Body = PAGES[slug]
  const i = DOC_PAGES.findIndex((p) => p.slug === slug)
  const prev = DOC_PAGES[i - 1], next = DOC_PAGES[i + 1]

  return (
    <div className="docs container">
      <aside className={`docs-side ${navOpen ? 'open' : ''}`} aria-label="Documentation">
        <button type="button" className="docs-side-toggle" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen} aria-controls="docs-nav">
          <span><small>{page.group}</small>{page.title}</span><ChevronDown aria-hidden="true" />
        </button>
        <nav id="docs-nav" className="docs-nav">
          {DOC_GROUPS.map((g) => (
            <div key={g.title} className="docs-group">
              <div className="docs-group-t">{g.title}</div>
              {g.pages.map((p) => <NavLink key={p.slug} to={`/docs/${p.slug}`}>{p.title}</NavLink>)}
            </div>
          ))}
        </nav>
      </aside>

      <main id="main" className="docs-main">
        <article className="prose">
          <div className="doc-crumb">{page.group}</div>
          <h1>{page.title}</h1>
          <p className="doc-desc">{page.desc}</p>
          <Body />
        </article>
        <nav className="doc-pager" aria-label="Previous and next page">
          {prev ? <Link to={`/docs/${prev.slug}`} className="pg prev"><small><ArrowLeft aria-hidden="true" />Previous</small><b>{prev.title}</b></Link> : <span />}
          {next ? <Link to={`/docs/${next.slug}`} className="pg next"><small>Next<ArrowRight aria-hidden="true" /></small><b>{next.title}</b></Link> : <span />}
        </nav>
      </main>

      {page.sections.length > 0 && (
        <aside className="docs-toc" aria-label="On this page">
          <div className="docs-toc-t">On this page</div>
          {page.sections.map(([id, t]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'on' : ''}
              onClick={(e) => { e.preventDefault(); navigate({ hash: id }, { replace: true }) }}>{t}</a>
          ))}
        </aside>
      )}
    </div>
  )
}
