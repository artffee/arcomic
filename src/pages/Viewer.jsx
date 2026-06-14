import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as THREE from 'three'
import { getExperience } from '../lib/db.js'
import { fetchExperience } from '../lib/api.js'
import { loadMindARThree } from '../lib/mindar.js'

const PHASE = {
  LOADING: 'loading',
  READY: 'ready', // loaded, waiting for user to start camera
  RUNNING: 'running', // camera live, scanning
  NOTFOUND: 'notfound',
  ERROR: 'error',
}

// Cover-fit a video texture (videoAspect = h/w) onto a plane (pageAspect = h/w).
function coverFit(texture, pageAspect, videoAspect) {
  const planeWH = 1 / pageAspect
  const videoWH = 1 / videoAspect
  texture.center.set(0.5, 0.5)
  if (videoWH > planeWH) {
    const r = planeWH / videoWH
    texture.repeat.set(r, 1)
  } else {
    const r = videoWH / planeWH
    texture.repeat.set(1, r)
  }
}

export default function Viewer() {
  const { id } = useParams()
  const containerRef = useRef(null)
  const mindarRef = useRef(null)
  const planesRef = useRef([]) // [{ video, material, targetOpacity }]
  const objectUrls = useRef([])

  const [exp, setExp] = useState(null)
  const [phase, setPhase] = useState(PHASE.LOADING)
  const [error, setError] = useState('')
  const [foundCount, setFoundCount] = useState(0)
  const [muted, setMuted] = useState(true)

  // Load the experience: cloud first (works cross-device), then local fallback.
  useEffect(() => {
    let alive = true
    ;(async () => {
      let record = null
      try {
        record = await fetchExperience(id)
      } catch {
        /* network issue — try local */
      }
      if (!record) record = await getExperience(id)
      if (!alive) return
      if (!record || !record.targetUrl) {
        setPhase(PHASE.NOTFOUND)
      } else {
        setExp(record)
        setPhase(PHASE.READY)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => () => stop(), []) // cleanup on unmount

  function track(url) {
    objectUrls.current.push(url)
    return url
  }

  async function start() {
    if (!exp) return
    try {
      setError('')
      const MindARThree = await loadMindARThree()

      // Pull the compiled target down and hand MindAR a local blob URL.
      const targetBuf = await (await fetch(exp.targetUrl)).arrayBuffer()
      const mindUrl = track(URL.createObjectURL(new Blob([targetBuf])))

      const mindar = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: mindUrl,
        uiScanning: false,
        uiLoading: false,
        uiError: false,
      })
      mindarRef.current = mindar
      const { renderer, scene, camera } = mindar
      planesRef.current = []

      exp.pages.forEach((page, i) => {
        const videoEl = document.createElement('video')
        videoEl.src = page.videoUrl
        videoEl.loop = true
        videoEl.muted = muted
        videoEl.playsInline = true
        videoEl.crossOrigin = 'anonymous'

        const texture = new THREE.VideoTexture(videoEl)
        texture.colorSpace = THREE.SRGBColorSpace
        coverFit(texture, page.pageAspect || page.videoAspect || 1, page.videoAspect || 1)

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0,
        })
        const geometry = new THREE.PlaneGeometry(1, page.pageAspect || page.videoAspect || 1)
        const plane = new THREE.Mesh(geometry, material)

        const anchor = mindar.addAnchor(i)
        anchor.group.add(plane)
        const entry = { video: videoEl, material, targetOpacity: 0 }
        planesRef.current.push(entry)

        anchor.onTargetFound = () => {
          entry.targetOpacity = 1
          videoEl.play().catch(() => {})
          setFoundCount((c) => c + 1)
        }
        anchor.onTargetLost = () => {
          entry.targetOpacity = 0
          setFoundCount((c) => Math.max(0, c - 1))
        }
      })

      await mindar.start()
      renderer.setAnimationLoop(() => {
        // Smooth fade in/out; pause a fully-faded video to save cycles.
        for (const p of planesRef.current) {
          p.material.opacity += (p.targetOpacity - p.material.opacity) * 0.15
          if (p.targetOpacity === 0 && p.material.opacity < 0.02 && !p.video.paused) {
            p.video.pause()
          }
        }
        renderer.render(scene, camera)
      })
      setPhase(PHASE.RUNNING)
    } catch (e) {
      console.error(e)
      setError(
        e?.name === 'NotAllowedError'
          ? 'Camera access was blocked. Allow the camera and try again.'
          : e?.message || 'Could not start the AR experience.',
      )
      setPhase(PHASE.ERROR)
    }
  }

  function stop() {
    try {
      mindarRef.current?.renderer?.setAnimationLoop(null)
      mindarRef.current?.stop()
    } catch {
      /* ignore */
    }
    mindarRef.current = null
    for (const p of planesRef.current) {
      p.video.pause()
      p.video.src = ''
    }
    planesRef.current = []
    objectUrls.current.forEach((u) => URL.revokeObjectURL(u))
    objectUrls.current = []
  }

  function toggleMute() {
    const next = !muted
    setMuted(next)
    for (const p of planesRef.current) p.video.muted = next
  }

  const tracking = foundCount > 0

  return (
    <div className="fixed inset-0 bg-ink-950 text-white">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <Link
          to="/dashboard"
          className="rounded-full bg-ink-950/70 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-ink-950"
        >
          ← Exit
        </Link>
        {exp && (
          <span className="max-w-[45%] truncate rounded-full bg-ink-950/70 px-4 py-2 text-sm font-semibold backdrop-blur">
            {exp.title}
          </span>
        )}
        {phase === PHASE.RUNNING ? (
          <button
            onClick={toggleMute}
            className="rounded-full bg-ink-950/70 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-ink-950"
          >
            {muted ? '🔇 Muted' : '🔊 Sound'}
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>

      {phase === PHASE.LOADING && (
        <Center>
          <Spinner />
          <p className="mt-4 text-white/70">Loading experience…</p>
        </Center>
      )}

      {phase === PHASE.NOTFOUND && (
        <Center>
          <div className="text-5xl">🔍</div>
          <h2 className="mt-4 font-display text-3xl tracking-wide">
            Experience not found
          </h2>
          <p className="mt-2 max-w-xs text-white/60">
            This AR experience doesn’t exist (or was removed). Double-check the
            link.
          </p>
          <Link to="/create" className="btn-pop mt-6">
            Create one
          </Link>
        </Center>
      )}

      {phase === PHASE.READY && exp && (
        <Center>
          <ScanGraphic />
          <h2 className="mt-6 font-display text-4xl tracking-wide">{exp.title}</h2>
          <p className="mt-2 max-w-xs text-white/60">
            Point your camera at the comic page to bring it to life.
            {exp.pages.length > 1 && ` ${exp.pages.length} pages in this book.`}
          </p>
          <button onClick={start} className="btn-pop mt-6 !text-2xl">
            Start camera
          </button>
          <p className="mt-3 text-xs text-white/40">
            We’ll ask for camera permission next.
          </p>
        </Center>
      )}

      {phase === PHASE.ERROR && (
        <Center>
          <div className="text-5xl">⚠️</div>
          <h2 className="mt-4 font-display text-3xl tracking-wide">
            Couldn’t start
          </h2>
          <p className="mt-2 max-w-xs text-white/60">{error}</p>
          <button onClick={() => setPhase(PHASE.READY)} className="btn-ghost mt-6">
            Try again
          </button>
        </Center>
      )}

      {phase === PHASE.RUNNING && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center px-4">
          {tracking ? (
            <div className="rounded-full bg-pop/90 px-5 py-3 text-sm font-bold text-ink-950 backdrop-blur">
              ✦ Tracking — enjoy the show
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-full bg-ink-950/70 px-5 py-3 backdrop-blur">
              <span className="h-3 w-3 animate-pulse rounded-full bg-pop" />
              <span className="text-sm font-semibold">
                Scanning… slowly aim at the comic page
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Center({ children }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-ink-950/85 px-6 text-center backdrop-blur-sm">
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-pop" />
  )
}

function ScanGraphic() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <span className="absolute h-24 w-24 rounded-2xl border-2 border-pop animate-pulseRing" />
      <div className="comic-panel grid grid-cols-2 gap-1 p-1.5">
        {['#6c5ce7', '#ff3d7f', '#ffd23f', '#22d3ee'].map((c, i) => (
          <div
            key={i}
            className="h-9 w-9 rounded"
            style={{ background: `linear-gradient(135deg, ${c}, #08070d)` }}
          />
        ))}
      </div>
    </div>
  )
}
