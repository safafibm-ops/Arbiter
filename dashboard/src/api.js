const json = (r) => {
  if (!r.ok) return r.json().then((b) => Promise.reject(new Error(b.detail || r.statusText)))
  return r.json()
}
const post = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }).then(json)

export const api = {
  state: () => fetch('/api/state').then(json),
  feed: () => fetch('/api/feed').then(json),
  scenarios: () => fetch('/api/scenarios').then(json),
  shopco: () => fetch('/api/shopco').then(json),
  audit: () => fetch('/api/audit?limit=60').then(json),
  policy: () => fetch('/api/policy').then(json),
  run: (id) => post(`/api/scenarios/${id}/run`),
  decide: (id, action, note = '') => post(`/api/approvals/${id}`, { action, note, by: 'Manager' }),
  kill: (scope, target, on) => post('/api/kill', { scope, target, on }),
  mode: (enforce) => post('/api/mode', { enforce }),
  tamper: () => post('/api/audit/tamper'),
  reset: () => post('/api/reset'),
  forgetRules: () => fetch('/api/rules/learned', { method: 'DELETE' }).then(json),
  scan: (text) => post('/api/scan', { text, source: 'pasted text', preview: true }),
}
