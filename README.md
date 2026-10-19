# Arbiter website

The landing page and full documentation for Arbiter, the safety checkpoint for AI agents.
React 18 + Vite 5, no UI framework, fonts self-hosted, works offline once loaded.

- Landing page: live decision feed, scroll walkthrough of the 7-step check, a replay of four real
  ShopCo decisions, the Polyglot Scanner, the multi-agent map, the approval card and the
  red-team "protection switch".
- Docs: 20 pages with sidebar, "on this page" contents, previous/next, and Ctrl/⌘ K search (or `/`).
- Light and dark themes (follows the system, toggle in the header, remembered per browser).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static files in dist/
npm run preview    # serve dist/ locally
```

## Build options

Two environment variables, both set at build time:

| Variable      | Default    | What it does |
|---------------|------------|--------------|
| `VITE_BASE`   | `/`        | The path the site lives under, e.g. `/projects/arbiter/`. Must start and end with `/` (or be `./`). |
| `VITE_ROUTER` | `browser`  | `browser` gives clean URLs and needs an SPA fallback on the host. `hash` works on any static host with no setup (`/#/docs/sdk`). `memory` keeps the URL fixed, for sandboxed previews. |

```bash
# site at the root of a domain (Vercel, Netlify)
npm run build

# site under a sub-path of a portfolio
VITE_BASE=/projects/arbiter/ npm run build

# GitHub Pages or any host where you can't add a fallback rule
VITE_BASE=/projects/arbiter/ VITE_ROUTER=hash npm run build
```

On Windows PowerShell set the variables first: `$env:VITE_BASE="/projects/arbiter/"; npm run build`.

## Hosting

- **Vercel**: import the folder, framework "Vite". `vercel.json` already sends every path to `index.html`.
- **Netlify**: build command `npm run build`, publish directory `dist`. `public/_redirects` handles the fallback.
- **GitHub Pages**: build with `VITE_ROUTER=hash` and publish `dist/`.

## Putting it in a portfolio under /projects/arbiter

Option A, simplest (works with any portfolio, React or not):

1. `VITE_BASE=/projects/arbiter/ npm run build`
2. Copy everything in `dist/` into your portfolio's static folder at `projects/arbiter/`
   (for a Vite or CRA portfolio that is `public/projects/arbiter/`, for Next.js also `public/projects/arbiter/`).
3. Add a fallback so deep links like `/projects/arbiter/docs/sdk` load the page:
   - Vercel: `{ "source": "/projects/arbiter/(.*)", "destination": "/projects/arbiter/index.html" }` in `rewrites`
   - Netlify: `/projects/arbiter/*  /projects/arbiter/index.html  200` in `_redirects`
   - No way to add rules? Build with `VITE_ROUTER=hash` instead.
4. Link to it from your projects page: `<a href="/projects/arbiter/">Arbiter</a>`.

Option B, deploy it on its own (e.g. `arbiter.vercel.app`) and link to it from the portfolio card.

## Where things are

```
src/
  data/arbiter.js        every number, scenario and red-team row (taken from the prototype's real output)
  docs/registry.js       docs navigation: groups, pages, section ids
  pages/Landing.jsx      landing page sections
  pages/docs/pages.jsx   the 20 docs pages
  content/notes/*.md     the team's research notes, rendered on the "Research notes" page
  components/            VerdictSim, ScannerPlay, AgentMap, RiskBar, header/footer/search
  styles/tokens.css      colours and fonts (charcoal + blue, Ubuntu), light and dark
public/screens/          dashboard screenshots
```

To change a figure, edit `src/data/arbiter.js`; the landing page and docs both read from it.
To add a docs page, add it to `src/docs/registry.js` and add its component to `PAGES` in `src/pages/docs/pages.jsx`.
