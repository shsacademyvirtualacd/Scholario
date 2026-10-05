import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  appType: 'spa', // Explicitly enable Single Page Application history fallback routing
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'versioned-service-worker',
      apply: 'build',
      closeBundle() {
        const swDistPath = path.resolve(__dirname, 'dist', 'sw.js');
        if (fs.existsSync(swDistPath)) {
          let swContent = fs.readFileSync(swDistPath, 'utf8');
          const buildId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
          swContent = swContent.replace(/__BUILD_HASH__/g, buildId);
          fs.writeFileSync(swDistPath, swContent, 'utf8');
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    // Cloudflare Pages — output to dist/
    outDir: 'dist',
    emptyOutDir: true,
    // Code-split by route (lazy imports handled automatically)
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
