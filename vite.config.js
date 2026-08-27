import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_URL || 'https://attendance-backend-production-48ca.up.railway.app';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false
        },
        '/iclock': {
          target,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
