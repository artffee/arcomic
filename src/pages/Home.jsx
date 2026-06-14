import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'

const features = [
  {
    icon: '🎬',
    title: 'Animate any page',
    body: 'Pair a comic panel or full page with a video. Motion comics, voice-over, behind-the-scenes — anything that plays.',
  },
  {
    icon: '📱',
    title: 'No app to install',
    body: 'Readers scan with their phone browser. Web AR powered by image tracking means zero friction.',
  },
  {
    icon: '🖨️',
    title: 'Works on print & screen',
    body: 'The trigger is the artwork itself. Posters, single issues, trade paperbacks, or a tablet — all fair game.',
  },
  {
    icon: '🔗',
    title: 'Share with a link or QR',
    body: 'Every experience gets a unique URL and QR code. Drop it on the back cover and you’re live.',
  },
  {
    icon: '⚡',
    title: 'Compiles in your browser',
    body: 'Targets are generated client-side — your art never leaves your device in this demo.',
  },
  {
    icon: '🎨',
    title: 'Built for creators',
    body: 'Artists, indie publishers, and educators get a new dimension without touching native code.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Upload your page',
    body: 'Drop in the comic image readers will scan — a cover, a splash page, a single panel.',
  },
  {
    n: '02',
    title: 'Attach a video',
    body: 'Add the animation, motion comic, or clip that should play on top of the artwork.',
  },
  {
    n: '03',
    title: 'Publish & share',
    body: 'We compile an AR target in-browser and give you a link + QR. Point a camera and watch it move.',
  },
]

export default function Home() {
  return (
    <>
      <Hero />

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <SectionHead
          kicker="Why ARComic"
          title="A whole new layer for sequential art"
          sub="Everything you need to add motion, sound, and story to a static page."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="comic-panel p-6 transition-transform hover:-translate-y-1"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-display text-2xl tracking-wide">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-white/10 bg-ink-900">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHead
            kicker="How it works"
            title="From flat page to AR in three steps"
            sub="No SDK, no native build, no waiting on app review."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative comic-panel p-7">
                <div className="font-display text-5xl text-electric/40">
                  {s.n}
                </div>
                <h3 className="mt-2 font-display text-2xl tracking-wide">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/create" className="btn-pop">
              Try it now — it’s free
            </Link>
          </div>
        </div>
      </section>

      {/* Use cases / gallery */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionHead
          kicker="Who it’s for"
          title="Made for storytellers"
          sub="The same tech, pointed at different audiences."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <UseCase
            tint="from-electric to-ink-950"
            title="Indie creators"
            body="Turn a Kickstarter reward into a living artifact. Backers scan the page and unlock a thank-you."
          />
          <UseCase
            tint="from-pop to-ink-950"
            title="Publishers"
            body="Add a trailer or director’s commentary to every issue. New revenue, deeper engagement."
          />
          <UseCase
            tint="from-gold to-ink-950"
            title="Educators"
            body="History and science comics that narrate themselves. Scan a panel, hear the lesson."
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/10 bg-ink-900">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHead
            kicker="Pricing"
            title="Start free, scale when you ship"
            sub="This demo runs entirely on your device — every tier below is illustrative."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <PriceCard
              name="Creator"
              price="Free"
              note="forever"
              features={['Unlimited local experiences', 'In-browser AR viewer', 'Share links & QR codes']}
              cta="Get started"
              highlight={false}
            />
            <PriceCard
              name="Studio"
              price="$19"
              note="/ month"
              features={['Cloud hosting', 'Custom branding', 'Analytics on scans', 'Priority compile']}
              cta="Coming soon"
              highlight
            />
            <PriceCard
              name="Publisher"
              price="Let’s talk"
              note=""
              features={['Bulk import', 'Team seats', 'API access', 'SLA & support']}
              cta="Contact us"
              highlight={false}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
          Ready to make the page move?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Build your first AR comic in under a minute. No account, no install.
        </p>
        <div className="mt-8">
          <Link to="/create" className="btn-pop !text-2xl">
            Create your first experience
          </Link>
        </div>
      </section>
    </>
  )
}

function SectionHead({ kicker, title, sub }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="chip mx-auto">{kicker}</div>
      <h2 className="mt-4 font-display text-4xl tracking-wide sm:text-5xl">
        {title}
      </h2>
      <p className="mt-3 text-white/60">{sub}</p>
    </div>
  )
}

function UseCase({ tint, title, body }) {
  return (
    <div className="comic-panel overflow-hidden">
      <div className={`relative h-40 bg-gradient-to-br ${tint}`}>
        <div className="absolute inset-0 bg-halftone [background-size:12px_12px] opacity-40" />
      </div>
      <div className="p-6">
        <h3 className="font-display text-2xl tracking-wide">{title}</h3>
        <p className="mt-2 text-sm text-white/60">{body}</p>
      </div>
    </div>
  )
}

function PriceCard({ name, price, note, features, cta, highlight }) {
  return (
    <div
      className={`comic-panel p-7 ${
        highlight ? 'border-pop ring-2 ring-pop' : ''
      }`}
    >
      {highlight && (
        <div className="mb-3 inline-block rounded-full bg-pop px-3 py-1 text-xs font-bold text-ink-950">
          Most popular
        </div>
      )}
      <h3 className="font-display text-3xl tracking-wide">{name}</h3>
      <div className="mt-2 flex items-end gap-1">
        <span className="font-display text-4xl text-gold">{price}</span>
        <span className="pb-1 text-sm text-white/50">{note}</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-white/70">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-pop">✦</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        to="/create"
        className={`mt-6 w-full ${highlight ? 'btn-pop' : 'btn-ghost'}`}
      >
        {cta}
      </Link>
    </div>
  )
}
