import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="font-display text-2xl tracking-wide">
            AR<span className="text-pop">Comic</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-white/50">
            The augmented-reality layer for comic books. Print stays still; the
            story moves.
          </p>
        </div>

        <FooterCol
          title="Product"
          items={[
            { label: 'Create', to: '/create' },
            { label: 'My Comics', to: '/dashboard' },
            { label: 'How it works', to: '/#how' },
          ]}
        />
        <FooterCol
          title="For creators"
          items={[
            { label: 'Artists', to: '/create' },
            { label: 'Publishers', to: '/create' },
            { label: 'Educators', to: '/create' },
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            { label: 'About', to: '/' },
            { label: 'Pricing', to: '/#pricing' },
            { label: 'Contact', to: '/' },
          ]}
        />
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} ARComic. A demo AR platform for comics —
        inspired by the Artivive model.
      </div>
    </footer>
  )
}

function FooterCol({ title, items }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
        {title}
      </h4>
      <ul className="space-y-2 text-sm text-white/60">
        {items.map((i) => (
          <li key={i.label}>
            <Link to={i.to} className="hover:text-pop">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
