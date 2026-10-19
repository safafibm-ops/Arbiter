// Shared helpers and labels for the dashboard.

export const VERDICT = {
  allow: { label: 'Allow', tone: 'good', icon: '✓' },
  alert: { label: 'Allow + alert', tone: 'warn', icon: '!' },
  hold: { label: 'Ask a manager', tone: 'warn', icon: '⏸' },
  block: { label: 'Block', tone: 'bad', icon: '✕' },
  flag: { label: 'Flagged', tone: 'bad', icon: '⚑' },
  clean: { label: 'Clean', tone: 'good', icon: '✓' },
}

export const ZONES = [
  { from: 0, to: 40, label: 'Allow', tone: 'good' },
  { from: 40, to: 70, label: 'Allow + alert', tone: 'warn' },
  { from: 70, to: 90, label: 'Ask a manager', tone: 'serious' },
  { from: 90, to: 100, label: 'Block', tone: 'bad' },
]

export const zoneOf = (risk) => ZONES.find((z) => risk >= z.from && risk < z.to) || ZONES[3]

export const LANG = { en: 'English', hi: 'Hindi', kn: 'Kannada', hinglish: 'Hinglish', translation: 'Translation' }

export const time = (ts) =>
  new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const rupees = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export const agentName = (id) => {
  if (!id) return ''
  const base = id.replace('_agent', '')
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export const TOOL_LABEL = {
  lookup_customer: 'Look up customer',
  issue_refund: 'Issue refund',
  send_email: 'Send email',
  delete_record: 'Delete record',
  read_inbox: 'Read inbox',
}

export const actionTitle = (v) => {
  if (v.kind === 'message') return `Message to ${agentName(v.to_agent)}`
  if (v.kind === 'scan') return 'Language scan'
  return TOOL_LABEL[v.tool] || v.tool
}

// The reason text is "<what happened>. <Verdict>: <why>." Split it so the UI can show both parts.
export const splitReason = (reason = '') => {
  const m = reason.match(/^(.*?\.)\s+((?:Blocked|Needs a manager|Allowed|Approved|Delivered|Arbiter is OFF)[\s\S]*)$/)
  return m ? { what: m[1], why: m[2] } : { what: reason, why: '' }
}
