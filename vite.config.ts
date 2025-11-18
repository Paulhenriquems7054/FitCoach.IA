import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        hmr: {
          protocol: 'ws',
          host: 'localhost',
          port: 3000
        }
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true
      },
      plugins: [
        react(),
        // Remove console.log, console.info, console.debug em produção
        removeConsole({ includes: ['log', 'info', 'debug'] }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000,
        minify: 'esbuild', // Usar esbuild que já vem com Vite (mais rápido que terser)
        rollupOptions: {
          output: {
            manualChunks: {
              // Separar bibliotecas grandes em chunks próprios
              'react-vendor': ['react', 'react-dom'],
              'google-genai': ['@google/genai'],
              'pdf-vendor': ['html2pdf.js', 'jspdf', 'html2canvas'],
              'chart-vendor': ['recharts'],
              'ui-vendor': ['@heroicons/react', 'clsx'],
            },
            // Otimizar nomes de chunks
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
      },
    };
});
