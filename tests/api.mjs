// Backend integration test: exercises the real /api functions + Vercel Blob
// round-trip using the SAME client lib the browser uses. Run against `vercel dev`.
//   node tests/api.mjs [baseUrl]   (default http://localhost:3000)
import { upload } from '@vercel/blob/client'

const BASE = process.argv[2] || 'http://localhost:3000'
const id = 'apitest' + Math.floor(performance.now()).toString(36)
let step = 0
const log = (m) => console.log(`\n[${++step}] ${m}`)
const ok = (m) => console.log(`    PASS: ${m}`)
const fail = (m) => {
  console.error(`    FAIL: ${m}`)
  process.exit(1)
}

try {
  // 1. Upload three media blobs directly to Blob via the token-issuing function.
  log('Upload image/video/target via /api/upload')
  const img = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4])], { type: 'image/png' })
  const vid = new Blob([new Uint8Array(2048).fill(7)], { type: 'video/webm' })
  const tgt = new Blob([new Uint8Array(4096).fill(9)], { type: 'application/octet-stream' })
  const opt = { access: 'public', handleUploadUrl: `${BASE}/api/upload` }
  const [imageUrl, videoUrl, targetUrl] = await Promise.all([
    upload(`media/${id}/image`, img, { ...opt, contentType: 'image/png' }).then((r) => r.url),
    upload(`media/${id}/video`, vid, { ...opt, contentType: 'video/webm' }).then((r) => r.url),
    upload(`media/${id}/target`, tgt, { ...opt, contentType: 'application/octet-stream' }).then((r) => r.url),
  ])
  ok(`Uploaded 3 blobs (e.g. ${targetUrl})`)

  // 2. Verify a blob is actually fetchable and intact.
  log('Fetch the uploaded target blob back')
  const back = new Uint8Array(await (await fetch(targetUrl)).arrayBuffer())
  if (back.length !== 4096 || back[0] !== 9) fail(`Target blob corrupt (len=${back.length})`)
  ok('Target blob fetched intact (4096 bytes)')

  // 3. Create the experience metadata record.
  log('POST /api/experiences')
  const meta = {
    id,
    title: 'API Test',
    createdAt: Date.now(),
    targetUrl,
    pages: [{ imageUrl, videoUrl, videoAspect: 0.75, pageAspect: 1.25, label: 'p1' }],
  }
  let r = await fetch(`${BASE}/api/experiences`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(meta),
  })
  if (!r.ok) fail(`POST failed: ${r.status} ${await r.text()}`)
  ok('Experience created')

  // 4. Fetch it back by id (the cross-device read path).
  log('GET /api/experiences/:id')
  r = await fetch(`${BASE}/api/experiences/${id}`)
  if (!r.ok) fail(`GET failed: ${r.status}`)
  const got = await r.json()
  if (got.id !== id || got.pages?.[0]?.videoUrl !== videoUrl) fail('Returned meta mismatch')
  ok('Fetched matching metadata by id')

  // 5. Update (rename) it.
  log('PUT /api/experiences/:id (rename)')
  r = await fetch(`${BASE}/api/experiences/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...meta, title: 'Renamed' }),
  })
  if (!r.ok) fail(`PUT failed: ${r.status}`)
  const after = await (await fetch(`${BASE}/api/experiences/${id}`)).json()
  if (after.title !== 'Renamed') fail('Rename not persisted')
  ok('Update persisted')

  // 6. Delete it and confirm it's gone.
  log('DELETE /api/experiences/:id')
  r = await fetch(`${BASE}/api/experiences/${id}`, { method: 'DELETE' })
  if (!r.ok) fail(`DELETE failed: ${r.status}`)
  const gone = await fetch(`${BASE}/api/experiences/${id}`)
  if (gone.status !== 404) fail(`Expected 404 after delete, got ${gone.status}`)
  ok('Deleted; metadata now 404s')

  console.log('\n========================================')
  console.log('  ✅ BACKEND API ROUND-TRIP PASSED')
  console.log('========================================')
} catch (e) {
  console.error('\n❌ API TEST ERROR:', e.message)
  process.exit(1)
}
