import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Relative base path works for both Vercel (SPA) and Capacitor
    base: './',
    build: {
      outDir: 'dist',
    },
    plugins: [react()],
    define: {
      // Inject env var safely. Fallback to empty string to avoid "undefined" in code.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || "")
    }
  };
});