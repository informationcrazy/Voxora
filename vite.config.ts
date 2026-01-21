import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  // Fix: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    // CRITICAL: Use relative base path for embedded deployment (Electron/Tauri/GitHub Pages)
    base: './',
    plugins: [react()],
    define: {
      // 将构建时的环境变量注入到客户端代码中
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    }
  };
});