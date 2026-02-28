import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to inject CSS into the IIFE bundle as a <style> tag
function cssInjectPlugin() {
  return {
    name: 'css-inject',
    apply: 'build' as const,
    enforce: 'post' as const,
    generateBundle(_: unknown, bundle: Record<string, { type: string; fileName: string; source?: string; code?: string }>) {
      let cssCode = '';
      const cssFiles: string[] = [];
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          cssCode += chunk.source ?? '';
          cssFiles.push(fileName);
        }
      }
      // Remove CSS files from bundle
      for (const f of cssFiles) delete bundle[f];
      // Inject CSS into the JS bundle
      if (cssCode) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.fileName.endsWith('.js')) {
            chunk.code = `(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(cssCode)};document.head.appendChild(s);})();\n${chunk.code}`;
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), cssInjectPlugin()],
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'FEGCComments',
      formats: ['iife'],
      fileName: () => 'fegc-comments.js',
    },
    outDir: '../dist/comments',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      // Bundle everything into the IIFE — no external deps
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
