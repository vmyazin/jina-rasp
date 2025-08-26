import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'public',
  server: {
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:2999',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '/src': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'public/index.html'
    }
  }
})