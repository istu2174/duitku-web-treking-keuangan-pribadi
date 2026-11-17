import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server meneruskan /api ke Express di port 3001
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
