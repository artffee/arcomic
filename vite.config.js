import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// MindAR + TensorFlow.js ship large prebuilt bundles; bump the warning limit
// and let Vite serve them over https-friendly host so the webcam works on LAN.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['mind-ar'],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
