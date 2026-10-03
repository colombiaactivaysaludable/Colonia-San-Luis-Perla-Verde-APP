import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'serve-service-worker',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/sw.js' || req.url === '/service-worker.js') {
              const swPath = path.resolve(__dirname, 'public/sw.js');
              if (fs.existsSync(swPath)) {
                res.setHeader('Content-Type', 'application/javascript');
                res.setHeader('Service-Worker-Allowed', '/');
                res.setHeader('Cache-Control', 'no-cache');
                res.end(fs.readFileSync(swPath));
                return;
              }
            }
            next();
          });
        },
      },
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        includeAssets: ['icon.svg', 'manifest.json', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Colonia San Luis - Perla Verde',
          short_name: 'San Luis',
          description: 'App deportiva Colonia San Luis - Perla Verde. "La Perla Bonita de Antioquia"',
          theme_color: '#064e3b',
          background_color: '#064e3b',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
