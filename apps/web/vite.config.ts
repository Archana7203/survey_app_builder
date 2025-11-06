import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env from the same directory as vite.config.ts (apps/web/)
  const env = loadEnv(mode, __dirname, '');
  console.log('Loading env from:', __dirname);
  console.log('Loaded API URL:', env.VITE_API_BASE_URL);
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: [
        '.trycloudflare.com', 
      ],
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});