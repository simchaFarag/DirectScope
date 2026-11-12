import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  // the native projects (android/, ios/) hold copies of the built site – keep the dev server from scanning or watching them
  optimizeDeps: { entries: ['index.html'] },
  server: {
    watch: { ignored: ['**/android/**', '**/ios/**'] },
    host: true,
    // the Node API (server/) runs on :4000 during development
    proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' },
  },
});
