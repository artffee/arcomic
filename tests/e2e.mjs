// Headless end-to-end test of the ARComic deployment.
// Verifies everything that does NOT need a real camera/printed page:
//   1. site loads + React mounts
//   2. Create flow: real in-browser image + video -> MindAR compile -> IndexedDB save
//   3. Dashboard shows the experience + a share QR
//   4. AR viewer boots the camera engine (fake device) without throwing
//
// Usage: node tests/e2e.mjs [baseUrl]   (default: https://arcomic.vercel.app)

import { chromium } from 'playwright'

const BASE = process.argv[2] || 'https://arcomic.vercel.app'
const pageErrors = []
const consoleErrors = []
let step = 0

function log(msg) {
  console.log(`\n[${++step}] ${msg}`)
}
function ok(msg) {
  console.log(`    PASS: ${msg}`)
}
function fail(msg) {
  console.error(`    FAIL: ${msg}`)
  throw new Error(msg)
}

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

const context = await browser.newContext()
await context.grantPermissions(['camera'], { origin: BASE })
const page = await context.newPage()

page.on('pageerror', (e) => pageErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})

try {
  // 1. Landing page mounts
  log(`Load ${BASE}`)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByText('brought to life.').waitFor({ timeout: 15000 })
  ok('Landing page rendered (React mounted)')

  // 2. Create page
  log('Open /create and fill the form')
  await page.goto(`${BASE}/create`, { waitUntil: 'networkidle' })
  await page.getByPlaceholder('e.g. Issue #1 — The Awakening').fill('E2E Test Comic')
  ok('Title field works')

  // Generate a feature-rich image + a real webm video entirely in-browser,
  // then hand them to the hidden <input type=file> elements the way the UI does.
  log('Generate real image + video and attach them')
  await page.evaluate(async () => {
    function setFile(selector, file) {
      const input = document.querySelector(selector)
      const dt = new DataTransfer()
      dt.items.add(file)
      input.files = dt.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }

    // Feature-rich trigger image (MindAR needs detail/contrast to compile).
    const c = document.createElement('canvas')
    c.width = 640
    c.height = 800
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, c.width, c.height)
    const rnd = (n) => Math.floor(Math.random() * n)
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgb(${rnd(256)},${rnd(256)},${rnd(256)})`
      ctx.fillRect(rnd(c.width), rnd(c.height), 10 + rnd(60), 10 + rnd(60))
      ctx.strokeStyle = '#fff'
      ctx.strokeRect(rnd(c.width), rnd(c.height), 20 + rnd(80), 20 + rnd(80))
    }
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 70px sans-serif'
    ctx.fillText('KA-POW!', 40, 420)
    const imgBlob = await new Promise((r) => c.toBlob(r, 'image/png'))
    setFile('input[accept="image/*"]', new File([imgBlob], 'page.png', { type: 'image/png' }))

    // Real ~0.7s webm recorded from an animated canvas.
    const vc = document.createElement('canvas')
    vc.width = 320
    vc.height = 240
    const vctx = vc.getContext('2d')
    const stream = vc.captureStream(15)
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm' })
    const chunks = []
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    const done = new Promise((res) => (rec.onstop = res))
    rec.start()
    const t0 = performance.now()
    await new Promise((res) => {
      function draw() {
        const t = (performance.now() - t0) / 1000
        vctx.fillStyle = `hsl(${(t * 200) % 360},80%,50%)`
        vctx.fillRect(0, 0, vc.width, vc.height)
        vctx.fillStyle = '#fff'
        vctx.font = 'bold 40px sans-serif'
        vctx.fillText('AR', 130, 130)
        if (performance.now() - t0 < 700) requestAnimationFrame(draw)
        else res()
      }
      draw()
    })
    rec.stop()
    await done
    const vidBlob = new Blob(chunks, { type: 'video/webm' })
    setFile('input[accept="video/*"]', new File([vidBlob], 'clip.webm', { type: 'video/webm' }))
  })
  // Confirm the UI registered both files.
  await page.getByText('page.png').waitFor({ timeout: 5000 })
  await page.getByText('clip.webm').waitFor({ timeout: 5000 })
  ok('Image + video attached and reflected in the UI')

  // 3. Publish -> compile -> save -> dashboard + share modal
  log('Publish (this runs the in-browser MindAR compile — can take a while)')
  await page.getByRole('button', { name: 'Publish experience' }).click()
  await page.waitForURL('**/dashboard**', { timeout: 120000 })
  ok('Compiled + saved, navigated to dashboard')

  await page.getByRole('img', { name: 'QR code' }).waitFor({ timeout: 15000 })
  const shareUrl = await page.locator('input[readonly]').inputValue()
  if (!/\/view\/[a-z0-9]+$/.test(shareUrl)) fail(`Unexpected share URL: ${shareUrl}`)
  ok(`Share modal + QR rendered (${shareUrl})`)

  // Close modal, confirm a card persisted in the dashboard list.
  await page.keyboard.press('Escape')
  await page.getByRole('link', { name: 'View AR' }).first().waitFor({ timeout: 5000 })
  ok('Experience card persisted in dashboard (IndexedDB round-trip)')

  // 4. AR viewer boots the camera engine (fake camera)
  log('Open the AR viewer and start the (fake) camera')
  await page.goto(shareUrl, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Start camera' }).click()
  // RUNNING phase shows the scanning hint; ERROR phase shows "Couldn't start".
  const scanning = page.getByText('aim at the comic page')
  const errored = page.getByText("Couldn't start")
  await Promise.race([
    scanning.waitFor({ timeout: 60000 }),
    errored.waitFor({ timeout: 60000 }),
  ])
  if (await errored.isVisible()) {
    const detail = await page.locator('p').allInnerTexts()
    fail(`Viewer entered error state: ${detail.join(' | ')}`)
  }
  ok('AR engine started, camera acquired, scanning (no crash)')

  // Final: no uncaught exceptions allowed
  log('Check for uncaught page errors')
  if (pageErrors.length) fail(`Uncaught errors:\n${pageErrors.join('\n')}`)
  ok('No uncaught page errors')

  console.log('\n========================================')
  console.log('  ✅ ALL CHECKS PASSED')
  console.log('========================================')
  if (consoleErrors.length) {
    console.log(`\n(note) ${consoleErrors.length} console.error message(s) — non-fatal:`)
    ;[...new Set(consoleErrors)].slice(0, 8).forEach((e) => console.log('  - ' + e.slice(0, 160)))
  }
} catch (e) {
  console.error('\n========================================')
  console.error('  ❌ TEST FAILED')
  console.error('========================================')
  console.error(e.message)
  await page.screenshot({ path: 'tests/failure.png', full_page: true }).catch(() => {})
  if (pageErrors.length) console.error('\nUncaught page errors:\n' + pageErrors.join('\n'))
  await browser.close()
  process.exit(1)
}

await browser.close()
process.exit(0)
