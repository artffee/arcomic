// Tiny IndexedDB wrapper for storing AR comic experiences fully client-side.
// Each experience holds the trigger image, the overlay video, and the
// compiled MindAR target (.mind ArrayBuffer) — all as binary blobs.

const DB_NAME = 'arcomic'
const STORE = 'experiences'
const VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(store, mode, run) {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const t = db.transaction(store, mode)
      const os = t.objectStore(store)
      const result = run(os)
      t.oncomplete = () => resolve(result?._value ?? result)
      t.onerror = () => reject(t.error)
      t.onabort = () => reject(t.error)
    }, reject)
  })
}

// Short, URL-friendly id without external deps.
export function makeId() {
  const a = new Uint8Array(8)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10)
}

/**
 * @param {object} exp
 * @param {string} exp.id
 * @param {string} exp.title
 * @param {number} exp.createdAt
 * @param {Blob}   exp.image      trigger artwork
 * @param {Blob}   exp.video      overlay video
 * @param {ArrayBuffer} exp.target compiled .mind data
 * @param {number} exp.videoAspect height/width of the video, for the AR plane
 */
export function saveExperience(exp) {
  return tx(STORE, 'readwrite', (os) => {
    os.put(exp)
  })
}

export function getExperience(id) {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const req = db.transaction(STORE).objectStore(STORE).get(id)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    }, reject)
  })
}

export function listExperiences() {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const req = db.transaction(STORE).objectStore(STORE).getAll()
      req.onsuccess = () => {
        const all = req.result || []
        all.sort((a, b) => b.createdAt - a.createdAt)
        resolve(all)
      }
      req.onerror = () => reject(req.error)
    }, reject)
  })
}

export function deleteExperience(id) {
  return tx(STORE, 'readwrite', (os) => {
    os.delete(id)
  })
}
