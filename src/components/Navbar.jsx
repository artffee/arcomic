import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/create', label: 'Create' },
  { to: '/dashboard', label: 'My Comics' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-2xl tracking-wide">
            AR<span className="text-pop">Comic</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-pop' : 'text-white/70 hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <Link to="/create" className="btn-pop !px-5 !py-2 !text-base">
          Start creating
        </Link>
      </nav>
    </header>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 64 64" className="h-8 w-8">
      <rect x="12" y="10" width="40" height="44" rx="4" fill="#16131f" stroke="#ff3d7f" strokeWidth="3" />
      <line x1="32" y1="12" x2="32" y2="52" stroke="#6c5ce7" strokeWidth="2" />
      <line x1="14" y1="30" x2="50" y2="30" stroke="#6c5ce7" strokeWidth="2" />
      <circle cx="48" cy="48" r="11" fill="#ffd23f" stroke="#08070d" strokeWidth="3" />
      <path d="M44 48l3 3 6-6" fill="none" stroke="#08070d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
