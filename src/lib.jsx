import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Path to a file in /public that works under any base path. */
export const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

/** Adds a small lift-in once an element scrolls into view. Elements start visible, so nothing is hidden if JS or IO is missing. */
export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight * 0.9) return
    el.classList.add('pre')
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.remove('pre'); io.disconnect() }
    }, { rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

export function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useReveal()
  return <Tag ref={ref} className={`reveal ${className}`} {...rest}>{children}</Tag>
}

/* ---------- tiny syntax highlighter (python, yaml, bash, http) ---------- */
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const RULES = {
  python: [[/#.*$/gm, 'c'], [/("[^"\n]*"|'[^'\n]*')/g, 's'], [/\b(from|import|as|try|except|def|return|if|else|for|in|with|class|None|True|False)\b/g, 'k'], [/\b\d[\d_]*\b/g, 'n'], [/\b([a-z_]+)(?=\()/g, 'f']],
  yaml: [[/#.*$/gm, 'c'], [/("[^"\n]*")/g, 's'], [/^(\s*-?\s*)([\w.-]+)(?=:)/gm, 'k', 1], [/\b\d+\b/g, 'n']],
  bash: [[/#.*$/gm, 'c'], [/("[^"\n]*")/g, 's'], [/^(\s*)(pip|npm|cd|python|export|git|cp|npx)\b/gm, 'k', 1]],
  http: [[/#.*$/gm, 'c'], [/("[^"\n]*")/g, 's'], [/^(POST|GET)\b/gm, 'k'], [/\b\d+\b/g, 'n']],
}
export function highlight(code, lang) {
  const rules = RULES[lang]
  if (!rules) return esc(code)
  // Collect every match, then keep the earliest-starting ones that don't overlap (rule order breaks ties).
  const cands = []
  rules.forEach(([re, cls, skip], order) => {
    re.lastIndex = 0
    let m
    while ((m = re.exec(code))) {
      const start = m.index + (skip ? m[skip].length : 0)
      const end = m.index + m[0].length
      if (end > start) cands.push({ start, end, cls, order })
      if (m[0].length === 0) re.lastIndex++
    }
  })
  cands.sort((a, b) => a.start - b.start || a.order - b.order)
  const marks = []
  let last = 0
  for (const c of cands) if (c.start >= last) { marks.push(c); last = c.end }
  let out = '', i = 0
  for (const mk of marks) {
    out += esc(code.slice(i, mk.start)) + `<span class="tok-${mk.cls}">${esc(code.slice(mk.start, mk.end))}</span>`
    i = mk.end
  }
  return out + esc(code.slice(i))
}

export function CodeBlock({ code, lang = 'bash', title }) {
  const [copied, setCopied] = useState(false)
  const pre = useRef(null)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true); setTimeout(() => setCopied(false), 1400)
    } catch {
      const r = document.createRange(); r.selectNodeContents(pre.current)
      const s = getSelection(); s.removeAllRanges(); s.addRange(r)
    }
  }
  return (
    <div className="code">
      <div className="code-head">
        <span className="dots" aria-hidden="true"><i /><i /><i /></span>
        <span>{title || lang}</span>
        <button type="button" className="copy-btn" onClick={copy} aria-label="Copy code">
          {copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre ref={pre}><code dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} /></pre>
    </div>
  )
}

/* ---------- screenshots with a lightbox ---------- */
const LightboxCtx = createContext(() => {})
export function LightboxProvider({ children }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!src) return
    const k = (e) => e.key === 'Escape' && setSrc(null)
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [src])
  return (
    <LightboxCtx.Provider value={setSrc}>
      {children}
      {src && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Screenshot" onClick={() => setSrc(null)}>
          <img src={src.src} alt={src.alt} />
        </div>
      )}
    </LightboxCtx.Provider>
  )
}
export function Shot({ src, alt, caption }) {
  const open = useContext(LightboxCtx)
  const url = asset(src)
  return (
    <figure className="shot">
      <button type="button" onClick={() => open({ src: url, alt })} aria-label={`Enlarge: ${alt}`}>
        <img src={url} alt={alt} loading="lazy" width="1600" height="1000" />
      </button>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

/* ---------- theme ---------- */
export function useTheme() {
  const get = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const [theme, setTheme] = useState(get)
  const toggle = useCallback(() => {
    const next = get() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('arbiter-theme', next) } catch {}
    setTheme(next)
  }, [])
  return [theme, toggle]
}

export function useMedia(q) {
  const [m, setM] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const mq = matchMedia(q); const f = () => setM(mq.matches)
    mq.addEventListener('change', f); return () => mq.removeEventListener('change', f)
  }, [q])
  return m
}
