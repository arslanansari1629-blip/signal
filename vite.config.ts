import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import proxyHandler from './api/proxy.mjs';
import catalogHandler from './api/catalog.mjs';

/** Runs the exact Vercel functions inside the dev/preview server. */
function localApi() {
  const routes: Record<string, (req: any, res: any) => unknown> = {
    '/api/proxy': proxyHandler,
    '/api/catalog': catalogHandler
  };
  const middleware = (req: any, res: any, next: () => void) => {
    const path = (req.url || '').split('?')[0];
    const handler = routes[path];
    if (handler) void handler(req, res);
    else next();
  };
  return {
    name: 'signal-local-api',
    configureServer(server: any) { server.middlewares.use(middleware); },
    configurePreviewServer(server: any) { server.middlewares.use(middleware); }
  };
}

export default defineConfig({
  plugins: [react(), localApi()],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
  build: { outDir: 'dist', sourcemap: false }
});
