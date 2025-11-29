import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    hmr: {
      host: '0.0.0.0',
    },
    cors: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    // Let Vite handle chunk splitting automatically (faster than manual)
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // Automatic chunk splitting - faster than manual
        manualChunks(id) {
          // Split node_modules into vendor chunk
          if (id.includes('node_modules')) {
            // Large libraries get their own chunks
            if (id.includes('framer-motion')) {
              return 'framer-motion'
            }
            if (id.includes('lucide-react')) {
              return 'lucide-icons'
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui'
            }
            // Everything else goes to vendor
            return 'vendor'
          }
        },
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle core dependencies for faster dev server
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
    // Exclude heavy dependencies - they'll be bundled during build
    exclude: ['framer-motion'],
  },
  // Configure logrocket (UMD module) to work with Vite
  define: {
    // Ensure logrocket works in ESM context
    global: 'globalThis',
  },
})
