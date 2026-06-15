import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { makeId, saveExperience } from '../lib/db.js'
import { loadImageElement, compileTargets } from '../lib/mindar.js'
import { uploadMedia, putExperience } from '../lib/api.js'

const STATES = {
  IDLE: 'idle',
  COMPILING: 'compiling',
  UPLOADING: 'uploading',
  SAVING: 'saving',
  DONE: 'done',
  ERROR: 'error',
}

const MAX_VIDEO_MB = 60
const MAX_IMAGE_MB = 20
const MAX_PAGES = 8

const blankPage = () => ({ key: makeId(), image: null, video: null })

export default function Create() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [pages, setPages] = useState([blankPage()])
  const [status, setStatus] = useState(STATES.IDLE)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  function updatePage(i, patch) {
    setPages((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  function pickImage(i, file) {
    if (!file) return
    setError('')
    if (file.size > MAX_IMAGE_MB * 1024 * 1024)
      return setError(`Image is too large (max ${MAX_IMAGE_MB} MB).`)
    const url = URL.createObjectURL(file)
    pages[i]?.image && URL.revokeObjectURL(pages[i].image.url)
    const probe = new Image()
    probe.onload = () => {
      if (Math.min(probe.naturalWidth, probe.naturalHeight) < 480)
        setError('Heads up: low-resolution pages track poorly. 800px+ recommended.')
    }
    probe.src = url
    updatePage(i, { image: { file, url } })
  }

  function pickVideo(i, file) {
    if (!file) return
    setError('')
    if (file.size > MAX_VIDEO_MB * 1024 * 1024)
      return setError(`Video is too large (max ${MAX_VIDEO_MB} MB). Trim or compress it.`)
    pages[i]?.video && URL.revokeObjectURL(pages[i].video.url)
    updatePage(i, { video: { file, url: URL.createObjectURL(file) } })
  }

  function addPage() {
    setPages((ps) => (ps.length >= MAX_PAGES ? ps : [...ps, blankPage()]))
  }
  function removePage(i) {
    setPages((ps) => {
      const p = ps[i]
      p?.image && URL.revokeObjectURL(p.image.url)
      p?.video && URL.revokeObjectURL(p.video.url)
      return ps.filter((_, idx) => idx !== i)
    })
  }

  function videoAspect(url) {
    return new Promise((resolve) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => resolve(v.videoWidth ? v.videoHeight / v.videoWidth : 1)
      v.onerror = () => resolve(1)
      v.src = url
    })
  }

  async function handlePublish() {
    setError('')
    if (!title.trim()) return setError('Give your experience a title.')
    if (pages.some((p) => !p.image || !p.video))
      return setError('Every page needs both a comic image and a video.')

    try {
      const id = makeId()

      // 1. Compile ALL page images into one AR target (anchor index = page).
      setStatus(STATES.COMPILING)
      setProgress(1)
      const imgEls = await Promise.all(pages.map((p) => loadImageElement(p.image.url)))
      const target = await compileTargets(imgEls, (p) =>
        setProgress(Math.max(1, Math.round(p))),
      )
      const aspects = await Promise.all(pages.map((p) => videoAspect(p.video.url)))

      // 2. Upload the target + each page's media to the cloud.
      setStatus(STATES.UPLOADING)
      const targetUrl = await uploadMedia(
        id,
        'target',
        new Blob([target]),
        'application/octet-stream',
      )
      const pageMetas = await Promise.all(
        pages.map(async (p, i) => {
          const [imageUrl, videoUrl] = await Promise.all([
            uploadMedia(id, `image-${i}`, p.image.file, p.image.file.type),
            uploadMedia(id, `video-${i}`, p.video.file, p.video.file.type),
          ])
          return {
            imageUrl,
            videoUrl,
            videoAspect: aspects[i],
            pageAspect: imgEls[i].naturalHeight / imgEls[i].naturalWidth,
            label: `Page ${i + 1}`,
          }
        }),
      )

      // 3. Write metadata (cloud + local index).
      setStatus(STATES.SAVING)
      const meta = {
        id,
        title: title.trim(),
        createdAt: Date.now(),
        targetUrl,
        pages: pageMetas,
      }
      await putExperience(meta)
      await saveExperience(meta)

      setStatus(STATES.DONE)
      navigate(`/dashboard?new=${id}`)
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Something went wrong while publishing.')
      setStatus(STATES.ERROR)
    }
  }

  const busy =
    status === STATES.COMPILING ||
    status === STATES.UPLOADING ||
    status === STATES.SAVING
  const statusLabel = {
    [STATES.COMPILING]: 'Compiling AR target…',
    [STATES.UPLOADING]: 'Uploading to the cloud…',
    [STATES.SAVING]: 'Saving…',
  }[status]

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="chip">Create</div>
      <h1 className="mt-4 font-display text-5xl tracking-wide">
        Build an AR experience
      </h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Add one page for a single scene, or several to make a multi-page book.
        Each page pairs a comic image with the video that plays over it. We
        compile the AR target right here in your browser.
      </p>

      <div className="mt-8 comic-panel p-6">
        <label className="label" htmlFor="title">
          Experience title
        </label>
        <input
          id="title"
          className="input"
          placeholder="e.g. Issue #1 — The Awakening"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="mt-6 space-y-5">
        {pages.map((page, i) => (
          <div key={page.key} className="comic-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl tracking-wide">
                Page {i + 1}
              </h3>
              {pages.length > 1 && (
                <button
                  onClick={() => removePage(i)}
                  disabled={busy}
                  className="text-sm text-white/40 hover:text-pop"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <DropZone
                  label="Comic page (trigger image)"
                  hint="PNG/JPG. Detailed, high-contrast art tracks best."
                  accept="image/*"
                  onFile={(f) => pickImage(i, f)}
                  disabled={busy}
                  filename={page.image?.file?.name}
                />
                {page.image && (
                  <Thumb>
                    <img src={page.image.url} alt="trigger" className="h-full w-full object-cover" />
                  </Thumb>
                )}
              </div>
              <div>
                <DropZone
                  label="Overlay video"
                  hint="MP4/WebM. Short and looping works best."
                  accept="video/*"
                  onFile={(f) => pickVideo(i, f)}
                  disabled={busy}
                  filename={page.video?.file?.name}
                />
                {page.video && (
                  <Thumb>
                    <video src={page.video.url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                  </Thumb>
                )}
              </div>
            </div>
          </div>
        ))}

        {pages.length < MAX_PAGES && (
          <button
            onClick={addPage}
            disabled={busy}
            className="w-full rounded-xl border-2 border-dashed border-white/15 py-4 text-sm font-semibold text-white/60 transition-colors hover:border-electric hover:text-white"
          >
            + Add another page
          </button>
        )}
      </div>

      <div className="mt-6 comic-panel p-6">
        {busy && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold">{statusLabel}</span>
              <span className="text-white/50">
                {status === STATES.COMPILING ? `${progress}%` : ''}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full bg-pop transition-all"
                style={{ width: status === STATES.COMPILING ? `${progress}%` : '100%' }}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              First compile downloads the tracking engine — give it a moment.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-pop/40 bg-pop/10 px-4 py-3 text-sm text-pop-soft">
            {error}
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={busy}
          className="btn-pop w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Working…' : 'Publish experience'}
        </button>
        <p className="mt-3 text-center text-xs text-white/40">
          Published to the cloud so your share link works on any device.
        </p>
      </div>
    </div>
  )
}

function DropZone({ label, hint, accept, onFile, disabled, filename }) {
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)

  return (
    <div>
      <span className="label">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          onFile(e.dataTransfer.files?.[0])
        }}
        className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          over ? 'border-pop bg-pop/5' : 'border-white/15 hover:border-electric'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <span className="text-2xl">{accept.startsWith('image') ? '🖼️' : '🎞️'}</span>
        <span className="mt-1.5 truncate text-sm font-semibold">
          {filename ? filename : 'Click or drop a file'}
        </span>
        <span className="mt-1 text-xs text-white/40">{hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  )
}

function Thumb({ children }) {
  return (
    <div className="mt-3 aspect-video overflow-hidden rounded-lg border border-white/10 bg-ink-950">
      {children}
    </div>
  )
}
