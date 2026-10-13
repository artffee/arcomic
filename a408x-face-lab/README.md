# A408X Face Lab

Nine original, expressive face transformations: three robots, two aliens, two monsters and two playful Halloween characters. Face position, roll, approximate yaw, blinks, smiles and mouth opening follow a MediaPipe Face Landmarker running on the device in a Worker. Colorful animated effects, a camera-free demo and opt-in local photo capture are included.

**Integrated app:** https://a408x-gang.captainnemo007.chatgpt.site/ar/face.html

This isolated directory does not change ARComic's existing app. It mirrors the Face Lab source integrated into the existing A408X Sqwad Site. The Site's current private audience is preserved.

## Run

```bash
cd a408x-face-lab
npm run assets
python3 -m http.server 8080 --directory public
```

Open `http://localhost:8080/ar/face.html` on the same computer. Phone camera testing requires an HTTPS host. There is no build or backend. For static hosting, run `npm run assets` first and publish `public/`.

Tracking binaries are intentionally downloaded rather than checked in. The downloader verifies pinned byte lengths and SHA-256 digests; the deployed A408X Site already includes them. It never handles visitor data. Home/poster links in `face.html` point to the existing A408X Site and can be changed for another host.

## Checks

```bash
npm install --ignore-scripts
npm run check
npm test
```

41 Face Lab checks passed in the implementation environment; all 55 original A408X poster/body-AR regression checks also passed in the parent Site checkout. Tests cover rendering, face geometry, expression animation, privacy and resource cleanup with camera/worker mocks. Actual browser model initialization, physical-camera accuracy, mobile layout/download behavior and sustained phone performance remain unverified because browser QA was unavailable.

See [INTEGRATION.md](INTEGRATION.md) for architecture, privacy flow, acceptance checks and integration. See [THIRD_PARTY.md](THIRD_PARTY.md) for runtime/model attribution. No camera frame is uploaded or saved by default. Enable camera requires a click and browser permission; saving requires a separate click after photo review.
