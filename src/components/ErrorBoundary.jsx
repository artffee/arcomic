import { Component } from 'react'
import { Link } from 'react-router-dom'

// Keeps a render crash (e.g. in the AR viewer) from showing a blank screen.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ARComic crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center text-white">
          <div className="text-5xl">💥</div>
          <h1 className="mt-4 font-display text-4xl tracking-wide">
            Something broke
          </h1>
          <p className="mt-2 max-w-sm text-white/60">
            An unexpected error stopped this page. Reloading usually fixes it.
          </p>
          <pre className="mt-4 max-w-md overflow-auto rounded-lg bg-ink-800 p-3 text-left text-xs text-pop-soft">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="mt-6 flex gap-3">
            <button onClick={() => window.location.reload()} className="btn-pop">
              Reload
            </button>
            <Link to="/" className="btn-ghost" onClick={() => this.setState({ error: null })}>
              Go home
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
