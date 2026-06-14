import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { makeId, saveExperience } from '../lib/db.js'
import { loadImageElement, compileTarget } from '../lib/mindar.js'

const STATES = {
  IDLE: 'idle',
  COMPILING: 'compiling',
  SAVING: 'saving',
  DONE: 'done',
  ERROR: 'error',
}

export default function Create() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [image, setImage] = useState(null) // { file, url }
  const [video, setVideo] = useState(null) // { file, url }
  const [status, setStatus] = useState(STATES.IDLE)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  // Revoke object URLs on change/unmount.
  useEffect(() => () => image && URL.revokeObjectURL(image.url), [image])
  useEffect(() => () => video && URL.revokeObjectURL(video.url), [video])

  function pickImage(file) {
    if (!file) return
    setImage({ file, url: URL.createObjectURL(file) })
  }
  function pickVideo(file) {
    if (!file) return
    setVideo({ file, url: URL.createObjectURL(file) })
  }

  function videoAspect(url) {
    return new Promise((resolve) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () =>
        resolve(v.videoWidth ? v.videoHeight / v.videoWidth : 1)
      v.onerror = () => resolve(1)
      v.src = url
    })
  }

  async function handlePublish() {
    setError('')
    if (!title.trim()) return setError('Give your experience a title.')
    if (!image) return setError('Upload a comic page to use as the trigger.')
    if (!video) return setError('Upload a video to overlay on the page.')

    try {
      setStatus(STATES.COMPILING)
      setProgress(1)
      const imgEl = await loadImageElement(image.url)
      const target = await compileTarget(imgEl, (p) =>
        setProgress(Math.max(1, Math.round(p))),
      )
      const aspect = await videoAspect(video.url)

      setStatus(STATES.SAVING)
      const id = makeId()
      await saveExperience({
        id,
        title: title.trim(),
        createdAt: Date.now(),
        image: image.file,
        video: video.file,
        target,
        videoAspect: aspect,
      })
      setStatus(STATES.DONE)
      navigate(`/dashboard?new=${id}`)
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Something went wrong while compiling.')
      setStatus(STATES.ERROR)
    }
  }

  const busy = status === STATES.COMPILING || status === STATES.SAVING

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="chip">Create</div>
      <h1 className="mt-4 font-display text-5xl tracking-wide">
        Build an AR experience
      </h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Upload the comic page readers will scan and the video that should play
        on top of it. We compile the AR target right here in your browser.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Left: inputs */}
        <div className="space-y-6">
          <div className="comic-panel p-6">
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

          <DropZone
            label="Comic page (trigger image)"
            hint="PNG or JPG. Detailed, high-contrast artwork tracks best."
            accept="image/*"
            onFile={pickImage}
            disabled={busy}
            filename={image?.file?.name}
          />

          <DropZone
            label="Overlay video"
            hint="MP4 or WebM. Keep it short and looping for the best effect."
            accept="video/*"
            onFile={pickVideo}
            disabled={busy}
            filename={video?.file?.name}
          />
        </div>

        {/* Right: preview + publish */}
        <div className="space-y-6">
          <div className="comic-panel p-6">
            <h3 className="font-display text-2xl tracking-wide">Preview</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PreviewTile label="Trigger">
                {image ? (
                  <img
                    src={image.url}
                    alt="trigger"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Empty>Comic page</Empty>
                )}
              </PreviewTile>
              <PreviewTile label="Overlay">
                {video ? (
                  <video
                    src={video.url}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  <Empty>Video</Empty>
                )}
              </PreviewTile>
            </div>
            <p className="mt-4 text-xs text-white/40">
              When a reader points their camera at the trigger, the overlay
              video plays locked to the artwork.
            </p>
          </div>

          <div className="comic-panel p-6">
            {busy && (
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">
                    {status === STATES.COMPILING
                      ? 'Compiling AR target…'
                      : 'Saving…'}
                  </span>
                  <span className="text-white/50">
                    {status === STATES.COMPILING ? `${progress}%` : ''}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className="h-full bg-pop transition-all"
                    style={{
                      width:
                        status === STATES.COMPILING ? `${progress}%` : '100%',
                    }}
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
              Stored locally on this device — nothing is uploaded.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DropZone({ label, hint, accept, onFile, disabled, filename }) {
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)

  return (
    <div className="comic-panel p-6">
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
        className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          over ? 'border-pop bg-pop/5' : 'border-white/15 hover:border-electric'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <span className="text-3xl">{accept.startsWith('image') ? '🖼️' : '🎞️'}</span>
        <span className="mt-2 text-sm font-semibold">
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

function PreviewTile({ label, children }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className="aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-ink-950">
        {children}
      </div>
    </div>
  )
}

function Empty({ children }) {
  return (
    <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
      {children}
    </div>
  )
}
