import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Home } from 'lucide-react'

export default function NotFound() {
  useEffect(() => { document.title = 'Page not found · Arbiter' }, [])
  return (
    <main id="main" className="notfound container">
      <div>
        <div className="code404">404</div>
        <h1 className="h2">Blocked: this page doesn't exist</h1>
        <p>Arbiter checked the address and found nothing here. Head back home or open the docs.</p>
        <div className="row">
          <Link to="/" className="btn btn-brand"><Home aria-hidden="true" />Home</Link>
          <Link to="/docs/introduction" className="btn btn-line"><BookOpen aria-hidden="true" />Documentation</Link>
        </div>
      </div>
    </main>
  )
}
