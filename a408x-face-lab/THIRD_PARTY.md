# Tracking runtime and model

Live AR self-hosts Google's `@mediapipe/tasks-vision` version **0.10.21** and the **Pose Landmarker Lite float16 v1** model. Their license is Apache 2.0; a copy is in `dist/ar/vendor/mediapipe/LICENSE.txt`. Copyright notices in the JS and WASM loader files are retained. `assets.json` records source URLs, byte lengths, and SHA-256 hashes for the shipped files.

The package's CommonJS browser bundle is renamed `vision-bundle.js` and loaded through `importScripts` in a classic Worker with an `exports` bridge. The upstream code is otherwise unchanged. Both SIMD and non-SIMD WASM runtimes are included. This pinned runtime was inspected for network endpoints and telemetry code; application frames are transferred only to the local Worker, and the browser fetches only same-origin model/runtime assets.

Official implementation reference: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js

Original A408X robot artwork, UI, rig geometry, and camera lifecycle code are authored for this project.

Face Lab also self-hosts the **Face Landmarker float16 v1** model from `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, using the same pinned Tasks Vision runtime. The model's byte length and SHA-256 digest are recorded in `assets.json`. The face Worker uses FaceLandmarker and expression blendshapes; its frames remain local.

Official face implementation reference: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
