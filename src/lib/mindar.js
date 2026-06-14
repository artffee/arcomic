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
 * Compile one or more trigger images into a single MindAR ".mind" target.
 * Each image becomes anchor index i, matching the page order.
 * @param {HTMLImageElement[]} imageEls
 * @param {(p:number)=>void} onProgress  0..100
 * @returns {Promise<ArrayBuffer>}
 */
export async function compileTargets(imageEls, onProgress = () => {}) {
  const { Compiler } = await import('mind-ar/dist/mindar-image.prod.js')
  const compiler = new Compiler()
  await compiler.compileImageTargets(imageEls, (p) => onProgress(p))
  const exported = await compiler.exportData()
  // exportData returns a Uint8Array that may be a *view* into a larger backing
  // buffer. Taking `.buffer` would keep the extra trailing bytes, which makes
  // MindAR's loader throw "Extra N bytes found". Copy out exactly byteLength.
  if (exported instanceof ArrayBuffer) return exported
  return exported.slice().buffer // TypedArray.slice() -> new exact-size buffer
}

/** Lazily import the MindAR three.js engine (also brings its own bundled three). */
export async function loadMindARThree() {
  const mod = await import('mind-ar/dist/mindar-image-three.prod.js')
  return mod.MindARThree
}
