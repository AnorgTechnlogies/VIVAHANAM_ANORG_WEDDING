import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production') {
    const urls = [env.VITE_API_KEY, env.VITE_API_URL, env.VITE_API_BASE_URL].filter(Boolean);
    urls.forEach(url => {
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        throw new Error(`CRITICAL ERROR: Production build cannot use localhost API URL (${url}). Configure a real domain in production environment variables.`);
      }
    });
  }
  return {
  base: '/shops/',

  plugins: [react(), tailwindcss()],

  server: {
    port: 5175,
    strictPort: true
  }
  };
});
