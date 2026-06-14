// Helpers around MindAR's in-browser image-target compiler.
// The prod bundle is excluded from Vite pre-bundling (see vite.config.js) and
// imported lazily so the heavy TensorFlow.js payload only loads when needed.

export async function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Compile a trigger image into a MindAR ".mind" target.
 * @param {HTMLImageElement} imageEl
 * @param {(p:number)=>void} onProgress  0..100
 * @returns {Promise<ArrayBuffer>}
 */
export async function compileTarget(imageEl, onProgress = () => {}) {
  const { Compiler } = await import('mind-ar/dist/mindar-image.prod.js')
  const compiler = new Compiler()
  await compiler.compileImageTargets([imageEl], (p) => onProgress(p))
  const exported = await compiler.exportData()
  // exportData may return a Uint8Array view — normalise to a plain ArrayBuffer.
  return exported instanceof ArrayBuffer ? exported : exported.buffer
}

/** Lazily import the MindAR three.js engine (also brings its own bundled three). */
export async function loadMindARThree() {
  const mod = await import('mind-ar/dist/mindar-image-three.prod.js')
  return mod.MindARThree
}
