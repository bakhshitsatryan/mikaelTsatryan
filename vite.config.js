import { defineConfig } from 'vite';
import { resolve } from 'path';

// VITE_BASE is set in GitHub Actions to '/repo-name/'
// locally it stays './' so dev server and preview work as expected
const base = process.env.VITE_BASE || './';

export default defineConfig({
  base,
  publicDir: 'public',
  server: {
    port: 5173,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        biography: resolve(__dirname, 'biography.html'),
        photos: resolve(__dirname, 'photos.html')
      }
    }
  }
});
