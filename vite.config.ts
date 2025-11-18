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
        chunkSizeWarningLimit: 1500, // Aumentar limite para evitar avisos desnecessários
        minify: 'esbuild', // Usar esbuild que já vem com Vite (mais rápido que terser)
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Separar node_modules em chunks menores e mais específicos
              if (id.includes('node_modules')) {
                // React e React DOM juntos - SEMPRE primeiro e com todas as dependências relacionadas
                if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                  return 'react-vendor';
                }
                // Bibliotecas que dependem do React DEVEM estar no mesmo chunk do React
                if (id.includes('react-dropzone') || 
                    id.includes('@testing-library/react') ||
                    id.includes('@heroicons/react')) {
                  return 'react-vendor';
                }
                // Recharts também precisa do React, então vamos colocá-lo no react-vendor também
                // para evitar problemas de carregamento
                if (id.includes('recharts')) {
                  return 'react-vendor';
                }
                // Google GenAI separado
                if (id.includes('@google/genai')) {
                  return 'google-genai';
                }
                // Bibliotecas PDF separadas individualmente para melhor code splitting
                if (id.includes('html2pdf.js')) {
                  return 'pdf-html2pdf';
                }
                if (id.includes('jspdf')) {
                  return 'pdf-jspdf';
                }
                if (id.includes('html2canvas')) {
                  return 'pdf-html2canvas';
                }
                // UI libraries que não dependem do React
                if (id.includes('clsx')) {
                  return 'ui-vendor';
                }
                // Outras dependências menores juntas (sem React)
                return 'vendor-misc';
              }
            },
            // Garantir ordem de carregamento - React primeiro
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: (chunkInfo) => {
              // Garantir que react-vendor seja carregado primeiro
              if (chunkInfo.name === 'react-vendor') {
                return 'assets/react-vendor-[hash].js';
              }
              return 'assets/[name]-[hash].js';
            },
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
      },
    };
});
