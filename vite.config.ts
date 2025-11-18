import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      css: {
        postcss: {
          plugins: [
            tailwindcss,
            autoprefixer,
          ],
        },
      },
      server: {
        port: 3001,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3003',
            changeOrigin: true,
          },
          '/newsapi': {
            target: 'https://newsapi.org',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/newsapi/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                if (env.VITE_NEWSAPI_KEY) {
                  proxyReq.setHeader('X-Api-Key', env.VITE_NEWSAPI_KEY);
                }
              });
            },
          },
          '/ninjas': {
            target: 'https://api.api-ninjas.com/v1',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/ninjas/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                if (env.VITE_API_NINJAS_KEY) {
                  proxyReq.setHeader('X-Api-Key', env.VITE_API_NINJAS_KEY);
                }
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});