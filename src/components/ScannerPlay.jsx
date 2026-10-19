import { useState } from 'react'
import { SCAN_SAMPLES } from '../data/arbiter.js'

/** The dashboard's Language scanner samples, with every matched phrase marked and explained. */
export default function ScannerPlay() {
  const [id, setId] = useState('hindi')
  const s = SCAN_SAMPLES.find((x) => x.id === id)
  return (
    <div className="scanner">
      <div className="scanner-head">
        <span className="scanner-title">Language scanner · test samples</span>
        <div className="scanner-tabs" role="tablist" aria-label="Sample">
          {SCAN_SAMPLES.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={x.id === id} className={x.flagged ? '' : 'ok'} onClick={() => setId(x.id)}>{x.label}</button>
          ))}
        </div>
      </div>
      <div className="scanner-grid" role="tabpanel">
        <div className="scanner-in">
          <div className="scanner-label">Untrusted text</div>
          <p className="scanner-text" lang={s.lang}>
            {s.parts.map((p, i) => typeof p === 'string'
              ? <span key={i}>{p}</span>
              : <mark key={i} className={p[1] || ''}>{p[1] === 'zw' ? '⟨zero-width⟩' : p[0]}</mark>)}
          </p>
        </div>
        <div className="scanner-out">
          <div className="scanner-verdict">
            <span className={`chip ${s.flagged ? 'c-block' : 'c-allow'}`}>{s.flagged ? 'Hidden instruction found' : 'Clean'}</span>
            {s.score && <span className="muted small">signal score {s.score} (instruction at 3+ with an action)</span>}
          </div>
          <p className="scanner-sum">{s.summary}</p>
          {s.signals.length > 0 && (
            <ul className="signals">
              {s.signals.map(([sig, txt, meaning]) => (
                <li key={sig + txt}><span className="sig">{sig}</span><span className="orig" lang={s.lang}>{txt}</span><span className="mean">{meaning}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
