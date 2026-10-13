# A408X Face Lab

Deployed route: https://a408x-gang.captainnemo007.chatgpt.site/ar/face.html

The existing A408X Sqwad website source was found at `/workspace/sites/a408x-gang`, Site `appgprj_6ab9adb20b3c8191ac4de283d7a65202`. Its homepage, AR Lab navigation and four world cards now open Face Lab. The original robot poster and full-body pose studio remain at `/ar/index.html` and link back to Face Lab. The Site's existing owner-only audience is preserved.

## Experience

Face Lab is a static HTML/CSS/JS application with nine original Canvas characters across Robots, Aliens, Monsters and Halloween. Face position, scale, roll and approximate yaw follow landmarks. Blinks, smiles and mouth opening animate the masks. World-specific decorations, wildness, surprise selection, a calm-motion toggle and a camera-free animated demo are included.

`FaceLandmarker` from self-hosted MediaPipe Tasks Vision **0.10.21** runs in a dedicated classic Worker. The pinned **Face Landmarker float16 v1** model provides 478 face landmarks and expression blendshapes. Inference uses at most one frame in flight, downsizes the longest side to 480 px, targets 12.5 detections per second, and slows down on slower devices. Canvas compositing is capped at about 30 redraws per second. These are configured limits, not measured physical-phone frame rates. GPU initialization falls back to CPU. Faces disappearing or results older than 400 ms hide the mask and disable capture.

The tracker does not require a printed image target or WebXR. Architectural patterns reviewed in `artffee/arcomic` (`src/pages/Viewer.jsx`) and `artffee/iron-arcana-ar` include explicit camera launch, cover-fit framing, tracking-loss handling and browser-resource cleanup. Their existing code, branches and deployments are preserved; their image-target trackers are not used for faces.

## Privacy and permission flow

- Page load and character selection never request the camera or load the tracking worker.
- Enable camera is an explicit visitor action followed by the browser's camera permission prompt. Audio is disabled.
- All application scripts, model and WASM files are self-hosted. Frames go only to the same-device Worker. Application code has no uploads, analytics, identity recognition or persistent face storage.
- Take photo composites a local 720 × 960 PNG and stops the camera and tracker before opening a review dialog. A separate **Save photo to device** action requests a download, with an Open photo fallback for mobile browsers. Discard revokes the photo URL and clears the app's references.
- Camera off, cancellation, backgrounding, page exit, disconnected cameras, tracking initialization errors and watchdog timeouts stop the video tracks and worker. Late permissions or bitmap results are rejected and released. Camera access never resumes automatically.
- Camera denial, missing hardware, a busy camera, insecure context and unsupported Worker/OffscreenCanvas capabilities keep the animated demo usable. Visitors can also use the original poster studio to choose a local photo.
- Hosting access controls may still require the adult owner's existing ChatGPT sign-in; the app adds no child accounts. Files chosen for download are subject to the device/browser's normal save behavior.

## Source and reproducibility

Files: `dist/ar/face.html`, `face.css`, `face-art.js`, `face-camera.js`, `face-worker.js`, and existing `icon.svg` + `vendor/mediapipe/`.

The GitHub mirror lives in the isolated `a408x-face-lab/` directory on `artffee/arcomic`, branch `codex/a408x-face-lab`. It contains the app under `public/ar/`, a standalone entry point, tests and this integration guide. No existing ARComic source or configuration is changed.

The mirror excludes large generated/downloaded tracking binaries. Its exact pinned assets can be restored with `node scripts/setup-face-assets.mjs`, which verifies both byte lengths and SHA-256 digests. The deployed Site already includes these assets. See `vendor/mediapipe/assets.json` and `THIRD_PARTY.md`.

## Verification

Executed in the build environment on 2026-10-13:

- `node tests/verify-face.cjs` — **41 checks passed**: nine distinct drawings, expression animation, crop/mirror geometry, smoothing, explicit permission behavior, lost/stale faces, camera switching, capture review, opt-in saving, cancellation races, GPU-to-CPU configuration, timeouts, stream termination, memory cleanup, model/runtime hashes and valid WASM.
- `node tests/verify-ar.cjs` — **55 existing regression checks passed** for the original poster and full-body AR studio.
- JavaScript syntax checks and `git diff --check` passed.
- Face model ZIP inspection verified three valid TFLite payloads, geometry metadata and ZIP integrity.
- Nine-mask contact-sheet artwork was rendered with `@napi-rs/canvas` and visually inspected.

Camera and Worker lifecycle tests use mocks; they do not prove physical camera tracking accuracy. Browser automation was unavailable in this managed environment. Real-browser model initialization, CSS layout, actual permission dialogs, mobile photo download and physical-device performance remain unverified. No claim is made that these device tests passed.

## Device acceptance checks

On an HTTPS deployment, check Safari on iOS and Chrome on Android:

1. At 320 px, 390 px and tablet/desktop widths, verify no horizontal overflow, readable labels, working native buttons, visible focus indicators and usable character controls. Check landscape and camera rotation.
2. Load Face Lab: demo visible, camera indicator off. Switch all four worlds and each character. Enable camera and approve, then verify the actual face tracker initializes without errors.
3. In good light, turn/tilt your head, blink, smile and open your mouth. Move out of frame: no stale mask; capture disabled. Return: tracking recovers.
4. Deny camera permission, retry after changing browser settings, test a busy/missing camera and front/back switching. Close or background the app while permission or model loading is pending: camera indicator turns off.
5. Take a photo: live camera stops; preview appears; no download until Save. Test Save Image behavior, Discard, close with Escape and a second capture.
6. Verify calm motion and OS reduced-motion preference. On a slower phone, check control responsiveness, battery/thermal behavior and actual sustained frame rate.

## Integration on another A408X host

Copy the Face Lab app and its `vendor/mediapipe/` assets together under `/ar/`, and link to `/ar/face.html?world=robots` (also `aliens`, `monsters`, `halloween`). Update the two home links and the poster/full-body link in `face.html` if the host changes. Preserve MIME types (`application/wasm` for `.wasm`), same-origin Worker loading and HTTPS.

For an optional iframe, use `allow="camera"` and an appropriate `Permissions-Policy`; open the app directly if the browser or parent denies camera delegation. No embed is required for the existing A408X Site, where Face Lab is integrated directly.
