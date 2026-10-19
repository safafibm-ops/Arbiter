import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CommandPalette, Footer, Header } from './components/Chrome.jsx'
import Landing from './pages/Landing.jsx'
import NotFound from './pages/NotFound.jsx'

const DocsLayout = lazy(() => import('./pages/docs/DocsLayout.jsx'))

function ScrollManager() {
  const { pathname, hash } = useLocation()
  const lastPath = useRef(pathname)
  useLayoutEffect(() => {
    const samePage = lastPath.current === pathname
    lastPath.current = pathname
    if (!hash) { if (!samePage) window.scrollTo(0, 0); return }
    const id = decodeURIComponent(hash.slice(1))
    // the target may render a frame later on a fresh page
    let tries = 0
    const go = () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: samePage ? 'smooth' : 'auto', block: 'start' })
      else if (tries++ < 10) requestAnimationFrame(go)
    }
    go()
    if (samePage) return
    // fonts and images above the target can shift it; settle once they load,
    // unless the reader has already started scrolling
    const y0 = () => window.scrollY
    let start
    const settle = () => {
      const el = document.getElementById(id)
      if (el && Math.abs(y0() - start) < 4) { el.scrollIntoView({ block: 'start' }); start = y0() }
    }
    const t1 = setTimeout(() => { start = y0() }, 50)
    const t2 = setTimeout(settle, 450)
    const t3 = setTimeout(settle, 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [pathname, hash])
  return null
}

export default function App() {
  const [search, setSearch] = useState(false)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch((s) => !s) }
      else if (e.key === '/' && !/input|textarea|select/i.test(e.target.tagName) && !e.target.isContentEditable) { e.preventDefault(); setSearch(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <ScrollManager />
      <Header onSearch={() => setSearch(true)} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Navigate to="/docs/introduction" replace />} />
        <Route path="/docs/:slug" element={<Suspense fallback={<main id="main" style={{ minHeight: '80vh' }} />}><DocsLayout /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <CommandPalette open={search} onClose={() => setSearch(false)} />
    </>
  )
}
