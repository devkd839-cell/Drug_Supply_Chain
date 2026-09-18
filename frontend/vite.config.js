import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Use import.meta.url-based resolution (works in both ESM and Vite's build context)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    // ethers v6 needs globalThis in the browser build
    global: 'globalThis',
  },
  build: {
    // Suppress the 500 kB chunk warning — the app intentionally bundles ethers + recharts
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks for better caching
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-ethers':  ['ethers'],
          'vendor-motion':  ['framer-motion'],
          'vendor-charts':  ['recharts'],
          'vendor-lucide':  ['lucide-react'],
        },
      },
    },
  },
})
