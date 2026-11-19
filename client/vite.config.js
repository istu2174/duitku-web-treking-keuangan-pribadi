import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Vite dev server meneruskan /api ke Express di port 3001.
// Mode "pages" (GitHub Pages): tanpa server, excelService diganti penyimpanan localStorage.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'pages' ? './' : '/',
  resolve: {
    // Client tidak pernah butuh excelService versi Node (fs); Rollup tetap me-resolve import() lokal.js
    alias: [
      {
        find: /^.*\/services\/excelService\.js$/,
        replacement: fileURLToPath(new URL('./src/lib/simpanLokal.js', import.meta.url)),
      },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
}));
