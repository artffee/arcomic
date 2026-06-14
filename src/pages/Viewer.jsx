import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as THREE from 'three'
import { getExperience } from '../lib/db.js'
import { loadMindARThree } from '../lib/mindar.js'

const PHASE = {
  LOADING: 'loading',
  READY: 'ready', // loaded, waiting for user to start camera
  RUNNING: 'running', // camera live, scanning
  NOTFOUND: 'notfound',
  ERROR: 'error',
}

export default function Viewer() {
  const { id } = useParams()
  const containerRef = useRef(null)
  const mindarRef = useRef(null)
  const videoElRef = useRef(null)
  const objectUrls = useRef([])

  const [exp, setExp] = useState(null)
  const [phase, setPhase] = useState(PHASE.LOADING)
  const [error, setError] = useState('')
  const [tracking, setTracking] = useState(false)
  const [muted, setMuted] = useState(true)

  // Load the experience record.
  useEffect(() => {
    let alive = true
    getExperience(id).then((record) => {
      if (!alive) return
      if (!record) {
        setError('not-found')
        setPhase(PHASE.NOTFOUND)
      } else {
        setExp(record)
        setPhase(PHASE.READY)
      }
    })
    return () => {
      alive = false
    }
  }, [id])

  // Cleanup on unmount.
  useEffect(() => {
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function track(url) {
    objectUrls.current.push(url)
    return url
  }

  async function start() {
    if (!exp) return
    try {
      setError('')
      const MindARThree = await loadMindARThree()

      const mindUrl = track(URL.createObjectURL(new Blob([exp.target])))
      const videoUrl = track(URL.createObjectURL(exp.video))

      const mindar = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: mindUrl,
        uiScanning: false,
        uiLoading: false,
        uiError: false,
      })
      mindarRef.current = mindar
      const { renderer, scene, camera } = mindar

      // Hidden video element feeding a texture.
      const videoEl = document.createElement('video')
      videoEl.src = videoUrl
      videoEl.loop = true
      videoEl.muted = muted
      videoEl.playsInline = true
      videoEl.crossOrigin = 'anonymous'
      videoElRef.current = videoEl

      const texture = new THREE.VideoTexture(videoEl)
      texture.colorSpace = THREE.SRGBColorSpace
      const geometry = new THREE.PlaneGeometry(1, exp.videoAspect || 1)
      const material = new THREE.MeshBasicMaterial({ map: texture })
      const plane = new THREE.Mesh(geometry, material)

      const anchor = mindar.addAnchor(0)
      anchor.group.add(plane)

      anchor.onTargetFound = () => {
        setTracking(true)
        videoEl.play().catch(() => {})
      }
      anchor.onTargetLost = () => {
        setTracking(false)
        videoEl.pause()
      }

      await mindar.start()
      renderer.setAnimationLoop(() => renderer.render(scene, camera))
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
    if (videoElRef.current) {
      videoElRef.current.pause()
      videoElRef.current.src = ''
      videoElRef.current = null
    }
    objectUrls.current.forEach((u) => URL.revokeObjectURL(u))
    objectUrls.current = []
  }

  function toggleMute() {
    const next = !muted
    setMuted(next)
    if (videoElRef.current) videoElRef.current.muted = next
  }

  return (
    <div className="fixed inset-0 bg-ink-950 text-white">
      {/* MindAR injects its camera <video> + <canvas> here */}
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
          <span className="rounded-full bg-ink-950/70 px-4 py-2 text-sm font-semibold backdrop-blur">
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

      {/* Overlays per phase */}
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
            This AR experience doesn’t exist on this device. Experiences are
            stored locally in the browser that created them.
          </p>
          <Link to="/create" className="btn-pop mt-6">
            Create one
          </Link>
        </Center>
      )}

      {phase === PHASE.READY && exp && (
        <Center>
          <ScanGraphic />
          <h2 className="mt-6 font-display text-4xl tracking-wide">
            {exp.title}
          </h2>
          <p className="mt-2 max-w-xs text-white/60">
            Point your camera at the comic page to bring it to life.
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
          <button
            onClick={() => setPhase(PHASE.READY)}
            className="btn-ghost mt-6"
          >
            Try again
          </button>
        </Center>
      )}

      {/* Running hint */}
      {phase === PHASE.RUNNING && !tracking && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-ink-950/70 px-5 py-3 backdrop-blur">
            <span className="h-3 w-3 animate-pulse rounded-full bg-pop" />
            <span className="text-sm font-semibold">
              Scanning… aim at the comic page
            </span>
          </div>
        </div>
      )}
      {phase === PHASE.RUNNING && tracking && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center">
          <div className="rounded-full bg-pop/90 px-5 py-3 text-sm font-bold text-ink-950 backdrop-blur">
            ✦ Tracking — enjoy the show
          </div>
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
