import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://primarily-computational-prostores-rouge.trycloudflare.com',  
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      'metres-saturn-radical-sword.trycloudflare.com', 
    ],
  },
});