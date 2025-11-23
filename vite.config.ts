import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore - Node.js types may not be available in IDE but work at runtime
import { fileURLToPath as _fileURLToPath } from 'node:url'
// @ts-ignore
import { dirname as _dirname, resolve } from 'node:path'

const __filename = _fileURLToPath(import.meta.url)
const __dirname = _dirname(__filename)

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'esbuild',
    target: 'es2015',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // This ensures proper dependency resolution and chunk loading order
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
