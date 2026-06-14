// Create an experience: writes its metadata JSON to Blob at a deterministic
// path (meta/{id}.json) so the viewer can fetch it by id from any device.
import { put } from '@vercel/blob'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const meta = req.body
  if (!meta || typeof meta !== 'object' || !meta.id) {
    return res.status(400).json({ error: 'Missing experience id' })
  }
  if (!Array.isArray(meta.pages) || meta.pages.length === 0 || !meta.targetUrl) {
    return res.status(400).json({ error: 'Experience needs a target and at least one page' })
  }
  try {
    const record = { ...meta, updatedAt: Date.now() }
    await put(`meta/${meta.id}.json`, JSON.stringify(record), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return res.status(200).json({ ok: true, id: meta.id })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Save failed' })
  }
}
