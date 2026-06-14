import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { listExperiences, deleteExperience } from '../lib/db.js'

export default function Dashboard() {
  const [items, setItems] = useState(null)
  const [share, setShare] = useState(null) // experience being shared
  const [params, setParams] = useSearchParams()

  async function refresh() {
    setItems(await listExperiences())
  }

  useEffect(() => {
    refresh()
  }, [])

  // Auto-open the share dialog for a just-created experience.
  useEffect(() => {
    const newId = params.get('new')
    if (newId && items) {
      const found = items.find((i) => i.id === newId)
      if (found) {
        setShare(found)
        params.delete('new')
        setParams(params, { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  async function handleDelete(id) {
    if (!confirm('Delete this experience? This cannot be undone.')) return
    await deleteExperience(id)
    refresh()
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="chip">My Comics</div>
          <h1 className="mt-4 font-display text-5xl tracking-wide">
            Your AR experiences
          </h1>
          <p className="mt-2 text-white/60">
            Everything you’ve published on this device.
          </p>
        </div>
        <Link to="/create" className="btn-pop">
          + New experience
        </Link>
      </div>

      <div className="mt-10">
        {items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((exp) => (
              <Card
                key={exp.id}
                exp={exp}
                onShare={() => setShare(exp)}
                onDelete={() => handleDelete(exp.id)}
              />
            ))}
          </div>
        )}
      </div>

      {share && <ShareModal exp={share} onClose={() => setShare(null)} />}
    </div>
  )
}

function Card({ exp, onShare, onDelete }) {
  const [thumb, setThumb] = useState(null)
  useEffect(() => {
    const url = URL.createObjectURL(exp.image)
    setThumb(url)
    return () => URL.revokeObjectURL(url)
  }, [exp.image])

  return (
    <div className="comic-panel overflow-hidden">
      <div className="relative aspect-[4/3] bg-ink-950">
        {thumb && (
          <img src={thumb} alt={exp.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 to-transparent p-3">
          <h3 className="font-display text-xl tracking-wide drop-shadow">
            {exp.title}
          </h3>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 p-4">
        <span className="text-xs text-white/40">
          {new Date(exp.createdAt).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <Link
            to={`/view/${exp.id}`}
            className="rounded-lg bg-electric px-3 py-1.5 text-sm font-semibold text-white hover:bg-electric-soft"
          >
            View AR
          </Link>
          <button
            onClick={onShare}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-semibold hover:border-pop hover:text-pop"
          >
            Share
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-sm text-white/50 hover:border-pop hover:text-pop"
            aria-label="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function ShareModal({ exp, onClose }) {
  const url = `${window.location.origin}/view/${exp.id}`
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      color: { dark: '#08070d', light: '#ffffff' },
    }).then(setQr)
  }, [url])

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="comic-panel w-full max-w-md p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-display text-3xl tracking-wide">Share</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-white/50">{exp.title}</p>

        <div className="mt-5 flex justify-center">
          {qr && (
            <img
              src={qr}
              alt="QR code"
              className="rounded-xl border-4 border-white"
              width={220}
              height={220}
            />
          )}
        </div>

        <p className="mt-5 text-center text-sm text-white/60">
          Scan this code, or open the link on a phone, then point the camera at
          your comic page.
        </p>

        <div className="mt-4 flex gap-2">
          <input readOnly value={url} className="input text-sm" />
          <button onClick={copy} className="btn-pop !px-4 !py-2 !text-base">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
          Heads up: experiences live in this browser only. To open on a phone,
          run the dev server on your network and use that address.
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="comic-panel h-64 animate-pulse bg-ink-800" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="comic-panel flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="text-5xl">📦</div>
      <h3 className="mt-4 font-display text-3xl tracking-wide">
        No experiences yet
      </h3>
      <p className="mt-2 max-w-sm text-white/60">
        Upload a comic page and a video to publish your first AR experience.
      </p>
      <Link to="/create" className="btn-pop mt-6">
        Create one now
      </Link>
    </div>
  )
}
