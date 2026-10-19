import { ZONES } from '../data/arbiter.js'

const COLORS = ['var(--c0)', 'var(--c1)', 'var(--c2)', 'var(--c3)']

/** Stacked risk factors on a 0–100 scale, with the four decision zones underneath. */
export default function RiskBar({ factors, risk, dark = false, showList = true }) {
  return (
    <div className={`riskbar ${dark ? 'dark' : ''}`}>
      <div className="rb-track" role="img" aria-label={`Risk ${risk} of 100: ${factors.map(([l, p]) => `${l} +${p}`).join(', ')}`}>
        {factors.map(([label, pts], i) => (
          <span key={label} style={{ flexBasis: `${pts}%`, background: COLORS[i] }} title={`${label}: +${pts}`}>+{pts}</span>
        ))}
      </div>
      <div className="rb-zones" aria-hidden="true">
        {ZONES.map((z) => <i key={z.key} className={`z-${z.key}`} style={{ flexBasis: `${z.to - z.from}%` }} />)}
        <b className="rb-mark" style={{ left: `${risk}%`, opacity: factors.length ? 1 : 0 }} />
      </div>
      <div className="rb-zone-labels" aria-hidden="true">
        {ZONES.map((z) => <span key={z.key} style={{ flexBasis: `${z.to - z.from}%` }} title={`${z.range} ${z.label}`}><em>{z.range}</em> {z.short}</span>)}
      </div>
      {showList && (
        <ul className="rb-list">
          {factors.map(([label, pts], i) => (
            <li key={label}><i style={{ background: COLORS[i] }} /><span>{label}</span><b>+{pts}</b></li>
          ))}
          {factors.length > 0 && <li className="total"><i /><span>Risk score</span><b>{risk}</b></li>}
        </ul>
      )}
    </div>
  )
}
