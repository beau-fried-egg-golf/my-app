import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/embed/',
  build: {
    outDir: '../dist/embed',
    emptyOutDir: true,
  },
});
