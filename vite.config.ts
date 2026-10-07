import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '');
  // 构建产物是公开的静态文件，密钥只在本机开发时注入。
  const devKey = command === 'serve' ? (env.DEEPSEEK_API_KEY ?? '').trim() : '';
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    define: {
      __DEV_API_KEY__: JSON.stringify(devKey),
    },
    server: { port: 5173, host: true },
  };
});
