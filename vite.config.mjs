import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/

export default defineConfig({
  optimizeDeps: {
    noDiscovery: true
  },
  build: {
    target: 'esnext',            // plus rapide pour les navigateurs modernes
    minify: 'esbuild',           // rapide et efficace
    sourcemap: false,            // désactive le sourcemap en prod
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';     // regroupe toutes les dépendances dans un seul chunk
          }
        }
      }
    }
  },
  plugins: [
    vue(),
    Components({
      resolvers: [PrimeVueResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});



