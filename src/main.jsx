import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom'

import '@fontsource/ubuntu/400.css'
import '@fontsource/ubuntu/500.css'
import '@fontsource/ubuntu/700.css'
import '@fontsource/ubuntu-mono/400.css'
import '@fontsource/ubuntu-mono/700.css'
import '@fontsource/noto-sans-devanagari/400.css'
import '@fontsource/noto-sans-kannada/400.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/landing.css'
import './styles/docs.css'

import App from './App.jsx'
import { LightboxProvider } from './lib.jsx'

// VITE_ROUTER: 'browser' (default, needs an SPA fallback on the host),
// 'hash' (works on any static host, e.g. GitHub Pages without a 404 trick),
// 'memory' (no URL changes at all, used for sandboxed previews).
const mode = import.meta.env.VITE_ROUTER || 'browser'
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

const Router = mode === 'hash' ? HashRouter : mode === 'memory' ? MemoryRouter : BrowserRouter
const props = mode === 'browser' && basename && basename !== '.' ? { basename } : {}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router {...props}>
      <LightboxProvider>
        <App />
      </LightboxProvider>
    </Router>
  </React.StrictMode>,
)
