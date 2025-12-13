import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  root: '.',
  plugins: [basicSsl()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    host: '10.0.0.100',
    port: 5173,
    open: false,
    https: true
  }
});
