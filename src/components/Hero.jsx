import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* glow + halftone backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-halftone [background-size:16px_16px]" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-electric/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-pop/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="chip">
            <span className="h-2 w-2 animate-pulse rounded-full bg-pop" />
            Augmented reality for comics
          </span>
          <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-wide sm:text-6xl md:text-7xl">
            Your comics,
            <br />
            <span className="text-pop">brought to life.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/70">
            Link a video to any printed page. Readers point their phone at the
            artwork and watch it animate — speech bubbles talk, panels move, the
            story breaks the page.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/create" className="btn-pop">
              Create an experience
            </Link>
            <a href="#how" className="btn-ghost">
              See how it works
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-white/50">
            <Stat n="No app" label="Runs in the browser" />
            <Stat n="100%" label="Free demo" />
            <Stat n="< 1 min" label="To publish" />
          </div>
        </div>

        <HeroCard />
      </div>
    </section>
  )
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="font-display text-xl text-gold">{n}</div>
      <div>{label}</div>
    </div>
  )
}

function HeroCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm animate-float">
      <div className="comic-panel overflow-hidden">
        {/* faux comic page */}
        <div className="grid grid-cols-2 gap-1.5 bg-ink-950 p-1.5">
          {['#6c5ce7', '#ff3d7f', '#ffd23f', '#22d3ee'].map((c, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] overflow-hidden rounded-md"
              style={{ background: `linear-gradient(135deg, ${c}, #08070d)` }}
            >
              <div className="absolute inset-0 bg-halftone [background-size:10px_10px] opacity-40" />
              {i === 1 && (
                <div className="absolute left-2 top-2 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-ink-950 shadow">
                  KA-POW!
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* scanning ring overlay */}
      <div className="absolute -bottom-6 -right-6 flex h-24 w-24 items-center justify-center">
        <span className="absolute h-16 w-16 rounded-full border-2 border-pop animate-pulseRing" />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pop text-ink-950 shadow-panel">
          <PlayIcon />
        </div>
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
