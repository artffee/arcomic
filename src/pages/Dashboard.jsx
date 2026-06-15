import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { listExperiences, deleteExperience, saveExperience } from '../lib/db.js'
import { deleteExperienceCloud, updateExperience } from '../lib/api.js'

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
    if (!confirm('Delete this experience? This removes it everywhere and cannot be undone.')) return
    await Promise.all([deleteExperience(id), deleteExperienceCloud(id)])
    refresh()
  }

  async function handleRename(exp) {
    const title = prompt('Rename experience', exp.title)?.trim()
    if (!title || title === exp.title) return
    const updated = { ...exp, title }
    await updateExperience(exp.id, updated) // cloud
    await saveExperience(updated) // local index
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
                onRename={() => handleRename(exp)}
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

function Card({ exp, onShare, onRename, onDelete }) {
  const thumb = exp.pages?.[0]?.imageUrl
  const pageCount = exp.pages?.length || 1

  return (
    <div className="comic-panel overflow-hidden">
      <div className="relative aspect-[4/3] bg-ink-950">
        {thumb && (
          <img src={thumb} alt={exp.title} className="h-full w-full object-cover" />
        )}
        {pageCount > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-ink-950/80 px-2.5 py-1 text-xs font-bold backdrop-blur">
            {pageCount} pages
          </span>
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
            onClick={onRename}
            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-sm text-white/50 hover:border-pop hover:text-pop"
            aria-label="Rename"
            title="Rename"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-sm text-white/50 hover:border-pop hover:text-pop"
            aria-label="Delete"
            title="Delete"
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

  function downloadQR() {
    if (!qr) return
    const a = document.createElement('a')
    a.href = qr
    a.download = `arcomic-${exp.id}.png`
    a.click()
  }

  // A print-ready sheet: QR + title + scan instructions, opened in a new tab.
  function printSheet() {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(
      exp.title,
    )} — ARComic</title><style>
      *{font-family:system-ui,sans-serif;text-align:center}
      body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;margin:0;padding:40px}
      img{width:300px;height:300px;border:6px solid #08070d;border-radius:16px}
      h1{font-size:28px;margin:24px 0 4px}p{color:#444;margin:4px 0;font-size:16px}
      .brand{margin-top:18px;font-weight:800;letter-spacing:1px;color:#ff3d7f}
    </style></head><body>
      <img src="${qr}" alt="QR"/>
      <h1>${escapeHtml(exp.title)}</h1>
      <p>Scan this code, then point your camera at the comic page.</p>
      <p style="color:#888;font-size:13px">${url}</p>
      <div class="brand">ARComic — comics that come alive</div>
      <script>window.onload=()=>setTimeout(()=>window.print(),250)</script>
    </body></html>`)
    w.document.close()
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

        <div className="mt-3 flex gap-2">
          <button onClick={downloadQR} className="btn-ghost flex-1 !py-2 !text-sm">
            ⬇ Download QR
          </button>
          <button onClick={printSheet} className="btn-ghost flex-1 !py-2 !text-sm">
            🖨 Print sheet
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-electric/30 bg-electric/10 px-3 py-2 text-xs text-electric-soft">
          Published to the cloud — this link and QR work on any phone. Print the
          QR next to your comic page so readers can scan it.
        </div>
      </div>
    </div>
  )
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
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
