import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/priceless-2709/',
  server: { port: 5173, host: true },
  build: { outDir: 'docs', emptyOutDir: true },
});
