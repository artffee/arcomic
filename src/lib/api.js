// Client helpers for the cloud backend (Vercel Blob + serverless functions).
// Media uploads go BROWSER -> BLOB directly (no size limit); metadata is a
// small JSON written through /api/experiences.
import { upload } from '@vercel/blob/client'

/** Upload one file/blob to Blob storage under media/{id}/{kind}. Returns its public URL. */
export async function uploadMedia(id, kind, fileOrBlob, contentType) {
  const result = await upload(`media/${id}/${kind}`, fileOrBlob, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    contentType: contentType || fileOrBlob.type || 'application/octet-stream',
  })
  return result.url
}

/** Create (or overwrite) the experience metadata record in the cloud. */
export async function putExperience(meta) {
  const res = await fetch('/api/experiences', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(meta),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed')
  return res.json()
}

/** Fetch an experience by id from the cloud. Returns null if it doesn't exist. */
export async function fetchExperience(id) {
  const res = await fetch(`/api/experiences/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Could not load experience')
  return res.json()
}

/** Update an existing experience's metadata. */
export async function updateExperience(id, meta) {
  const res = await fetch(`/api/experiences/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(meta),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Update failed')
  return res.json()
}

/** Delete an experience (metadata + media) from the cloud. */
export async function deleteExperienceCloud(id) {
  await fetch(`/api/experiences/${id}`, { method: 'DELETE' }).catch(() => {})
}
