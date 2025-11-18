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
        },
        // Ensure static assets are served with correct MIME types
        middlewareMode: false,
        fs: {
          // Allow serving files from public directory
          strict: false,
        }
      },
      // Ensure public assets are handled correctly
      publicDir: 'public',
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
                // PRIORIDADE 1: React e React DOM - SEMPRE primeiro
                if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                  return 'react-vendor';
                }
                // PRIORIDADE 2: Bibliotecas que dependem do React DEVEM estar no mesmo chunk
                // Incluir TODAS as dependências que podem usar React para evitar erros
                if (id.includes('react-dropzone') || 
                    id.includes('@testing-library/react') ||
                    id.includes('@testing-library/jest-dom') ||
                    id.includes('@heroicons/react') ||
                    id.includes('recharts') ||
                    id.includes('@jest/globals')) {
                  return 'react-vendor';
                }
                // PRIORIDADE 3: Google GenAI separado
                if (id.includes('@google/genai')) {
                  return 'google-genai';
                }
                // PRIORIDADE 4: Bibliotecas PDF separadas individualmente
                if (id.includes('html2pdf.js')) {
                  return 'pdf-html2pdf';
                }
                if (id.includes('jspdf')) {
                  return 'pdf-jspdf';
                }
                if (id.includes('html2canvas')) {
                  return 'pdf-html2canvas';
                }
                // PRIORIDADE 5: UI libraries que não dependem do React
                if (id.includes('clsx')) {
                  return 'ui-vendor';
                }
                // PRIORIDADE 6: Por segurança, colocar qualquer outra dependência
                // que possa ter sub-dependências do React também no react-vendor
                // Isso evita o erro useState undefined
                // Apenas colocar no vendor-misc se tiver 100% de certeza que não usa React
                // Por enquanto, vamos ser conservadores e colocar tudo no react-vendor
                // para garantir que não haja problemas de carregamento
                return 'react-vendor';
              }
              // Não separar código do próprio app em chunks manuais
              return undefined;
            },
            // Garantir ordem de carregamento - React primeiro
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
            // Garantir que react-vendor seja sempre carregado primeiro através de dependências
            // O Vite automaticamente ordena os chunks baseado nas dependências
          },
        },
      },
    };
});
