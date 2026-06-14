# ARComic 🦸‍♀️📱

**Bring comics to life with augmented reality** — an Artivive-style platform, but for comic books. Link a video to any printed page; readers point their phone or webcam at the artwork and watch it animate, locked in place over the page.

Everything runs **client-side** — image-target compilation, storage, and the AR viewer all happen in the browser. No backend, no app install.

## Stack

- **React + Vite + Tailwind CSS** — UI and build
- **MindAR** (`mind-ar`) — in-browser image-target compilation + tracking (TensorFlow.js + Three.js under the hood)
- **Three.js** — renders the video plane over the tracked page
- **IndexedDB** — stores experiences (trigger image, overlay video, compiled `.mind` target) on-device
- **qrcode** — share QR codes

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
src/
  pages/
    Home.jsx       Marketing landing (hero, features, how-it-works, pricing)
    Create.jsx     Upload + in-browser target compilation + save
    Dashboard.jsx  Experience list, share modal (link + QR), delete
    Viewer.jsx     MindAR camera viewer with the video overlay
  components/       Navbar, Footer, Hero
  lib/
    db.js          IndexedDB wrapper
    mindar.js      MindAR compiler + engine loaders (lazy-imported)
```

## What's a real MVP vs. what's faked

**Real & working:** upload, in-browser target compilation, local persistence, the AR
camera viewer with image tracking + video overlay, share links/QR, delete.

**Illustrative only (next steps for production):**

- **Cloud sync** — a backend (storage + DB) so experiences open on any device from a shared link.
- **Accounts** — the pricing tiers are demo copy; there's no auth.
- **Analytics** — scan counts, etc.
- **Dual Three.js instances** — the MindAR prod bundle ships its own Three.js while we import
  our own for the video plane. It works for this overlay; a production build would align them.
```
