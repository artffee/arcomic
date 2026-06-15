# ARComic 🦸‍♀️📱

**Bring comics to life with augmented reality** — an Artivive-style platform, but for comic books. Link a video to any printed page; readers point their phone or webcam at the artwork and watch it animate, locked in place over the page.

Everything runs **client-side** — image-target compilation, storage, and the AR viewer all happen in the browser. No backend, no app install.

## Stack

- **React + Vite + Tailwind CSS** — UI and build
- **MindAR** (`mind-ar`) — in-browser image-target compilation + tracking (TensorFlow.js + Three.js under the hood)
- **Three.js** — renders the video plane(s) over the tracked page
- **Vercel Blob + serverless functions** (`/api`) — cloud storage for media + the compiled
  target, and metadata CRUD, so **share links work on any device**
- **IndexedDB** — a light local index of the experiences you created (for "My Comics")
- **qrcode** — share QR codes (download PNG + print-ready sheet)

### Architecture

- **Create** compiles the AR target in your browser, uploads the image(s), video(s), and
  `.mind` target **directly to Blob** (browser → storage, bypassing the function body
  limit), then writes a small metadata JSON via `POST /api/experiences`.
- **Viewer** fetches the experience by id from `GET /api/experiences/:id` (falling back to
  the local index), so any phone with the link can load it.
- A multi-page "book" compiles all page images into **one** target; anchor index = page.

## Getting started

```bash
npm install --ignore-scripts   # see note below
npm run dev
```

Open http://localhost:5173.

> **Why `--ignore-scripts`?** `mind-ar` pulls in the native `canvas` module for its
> *Node*-side compiler. We only use the **browser** bundles, which don't need it, so we
> skip the native build (it otherwise requires Python + MSVC build tools on Windows).

## How to use it

1. **Create** → upload a comic page (the *trigger*) and a video (the *overlay*), give it a title, and hit **Publish**. The AR target compiles in your browser.
2. **My Comics** → see your experiences. **Share** gives you a link + QR code.
3. **View AR** (or scan the QR) → **Start camera**, point it at the comic page, and the video plays locked to the artwork.

### Testing on a phone

Experiences are stored in the **browser that created them** (IndexedDB), so a QR scanned on
your phone opens a *different* store. For an end-to-end phone test in this MVP:

- Find the **Network** URL printed by `npm run dev` (e.g. `http://10.0.0.250:5173`).
- Create the experience **on the phone** at that address, then view it there.
- Camera access requires a **secure context** — `localhost` is fine; over LAN most
  browsers need HTTPS. Use a tunnel (e.g. `npx localtunnel --port 5173`) or `vite`'s
  `--https` for camera access on a remote device.

Tip: a **high-contrast, detailed** comic page tracks far better than flat or repetitive art.

## Project structure

```
api/
  upload.js              Issues client tokens for direct browser -> Blob uploads
  experiences/
    index.js             POST create (writes meta JSON to Blob)
    [id].js              GET / PUT / DELETE a single experience
src/
  pages/
    Home.jsx       Marketing landing (hero, features, how-it-works, pricing)
    Create.jsx     Multi-page upload + in-browser compile + cloud publish
    Dashboard.jsx  Experience list, share (QR + print), rename, delete
    Viewer.jsx     MindAR camera viewer (multi-page, cover-fit video overlay)
  components/       Navbar, Footer, Hero, ErrorBoundary
  lib/
    db.js          Local index (IndexedDB)
    api.js         Cloud client (Blob upload + metadata CRUD)
    mindar.js      MindAR compiler + engine loaders (lazy-imported)
tests/             api.mjs (backend), e2e.mjs (browser, cross-device)
```

## Local development with the backend

The `/api` functions need a Vercel Blob store. The project is already linked, so:

```bash
vercel env pull           # writes BLOB_READ_WRITE_TOKEN into .env.local
vercel dev                # runs the functions + app together
```

> `vercel dev` + Vite has a known quirk where the SPA rewrite intercepts Vite's dev module
> requests. Use `tests/api.mjs` to exercise the backend against `vercel dev`, and the
> production deploy (or `npm run dev` for frontend-only) for the browser UI.

## Tests

- `node tests/api.mjs [baseUrl]` — backend round-trip (upload → fetch → CRUD).
- `node tests/e2e.mjs [baseUrl]` — headless browser: load → build a 2-page book → compile →
  publish → **cross-device** cloud fetch → AR engine start. Defaults to production.
- CI (`.github/workflows/ci.yml`) builds every push/PR; the e2e is a manual `workflow_dispatch`.

## What's real vs what's still illustrative

**Real & working:** in-browser target compilation, **cloud storage with cross-device share
links/QR**, printable QR, the AR viewer with image tracking + cover-fit video overlay,
multi-page books, rename, delete.

**Still illustrative (next steps):**

- **Accounts/auth** — pricing tiers are demo copy; uploads are currently unauthenticated
  (fine for a demo — add auth + rate limits before real public use).
- **Analytics** — scan counts, etc.
- **Dual Three.js instances** — the MindAR prod bundle ships its own Three.js while we import
  our own for the video plane. It works for this overlay; a production build would align them.
