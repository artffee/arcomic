// Issues short-lived tokens so the browser can upload media (image / video /
// compiled .mind target) DIRECTLY to Vercel Blob, bypassing the 4.5 MB
// serverless request-body limit. Used by `upload()` from @vercel/blob/client.
import { handleUpload } from '@vercel/blob/client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const result = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/gif',
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'application/octet-stream', // compiled .mind target
        ],
        // 60 MB ceiling per file — keeps abuse and storage cost in check.
        maximumSizeInBytes: 60 * 1024 * 1024,
        addRandomSuffix: false,
        allowOverwrite: true,
      }),
      onUploadCompleted: async () => {
        // No-op: metadata is written separately via /api/experiences.
      },
    })
    return res.status(200).json(result)
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Upload failed' })
  }
}
