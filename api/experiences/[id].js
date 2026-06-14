// Read / update / delete a single experience by id.
import { head, put, del, list } from '@vercel/blob'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing id' })
  const metaPath = `meta/${id}.json`

  if (req.method === 'GET') {
    try {
      const info = await head(metaPath)
      const data = await (await fetch(info.url)).json()
      res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30')
      return res.status(200).json(data)
    } catch {
      return res.status(404).json({ error: 'Experience not found' })
    }
  }

  if (req.method === 'PUT') {
    const meta = req.body
    if (!meta || meta.id !== id) {
      return res.status(400).json({ error: 'Body id must match URL id' })
    }
    try {
      const record = { ...meta, updatedAt: Date.now() }
      await put(metaPath, JSON.stringify(record), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      })
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err?.message || 'Update failed' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await del(metaPath).catch(() => {})
      const { blobs } = await list({ prefix: `media/${id}/` })
      if (blobs.length) await del(blobs.map((b) => b.url))
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err?.message || 'Delete failed' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
