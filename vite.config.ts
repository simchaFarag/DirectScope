import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Content-Security-Policy for the built site, as a <meta> tag so it ships with every deploy (no server config needed).
 * The login token lives in localStorage – the CSP is the second line of defence against an injected script reading it.
 * Build only: the dev server needs inline scripts and a websocket for hot reload.
 */
function csp(apiUrl?: string): Plugin {
  const api = apiUrl ? ` ${new URL(apiUrl).origin}` : '';
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' data: blob:${api}`,
    // nominatim: the address lookup behind "הפעל מיקום" (src/lib/location.ts)
    `connect-src 'self' https://nominatim.openstreetmap.org${api}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  return {
    name: 'directscope-csp',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), csp(env.VITE_API_URL)],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: {
      host: true,
      // the Node API (server/) runs on :4000 during development
      proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' },
    },
  };
});
