import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true, // SEMPRE usar porta 3000 - o script kill-port-3000.ps1 garante que está livre
        // Forçar fechamento limpo de conexões
        force: false,
        open: true, // Abre o navegador automaticamente
        watch: {
          // Ignorar mudanças em arquivos que podem causar loops
          ignored: [
            '**/node_modules/**', 
            '**/.git/**', 
            '**/dist/**', 
            '**/build/**',
            '**/public/GIFS/**', // Ignorar mudanças nos GIFs para evitar reloads
            '**/.vite/**', // Ignorar pasta .vite
            '**/package-lock.json',
            '**/yarn.lock',
            '**/vite.config.ts.timestamp-*', // Ignorar timestamps do Vite
            '**/.env.local',
            '**/.env.*.local'
          ],
          // Usar polling apenas se necessário (mais estável)
          usePolling: false,
          // Intervalo de polling se necessário
          interval: 100,
          // Ignorar mudanças iniciais para evitar restart no início
          ignoreInitial: true,
          // Ativar atomic para evitar reloads parciais
          atomic: true,
          // Delay antes de processar mudanças (evita múltiplos restarts)
          delay: 500
        },
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Last-Modified': new Date().toUTCString()
        },
        hmr: {
          protocol: 'ws',
          host: 'localhost',
          port: 3000,
          clientPort: 3000,
          // Desabilitar overlay de erro para evitar problemas visuais
          overlay: false,
          // Configurações para evitar erros 504 e "server is being restarted"
          client: {
            overlay: false,
            // Tentativas de reconexão
            reconnect: 10,
            // Tempo entre tentativas (ms)
            timeout: 10000
          }
        },
        // Configuração para evitar loops de reload
        // Aumentar tempo entre reloads
        optimizeDeps: {
          exclude: [],
          // Forçar re-otimização quando necessário
          force: false,
          // Entradas para otimização
          entries: [],
          // Incluir dependências que podem causar problemas
          include: [
            'react',
            'react-dom',
            'react/jsx-runtime'
          ]
        },
        // Proxy para redirecionar /api para o backend
        proxy: {
          '/api': {
            target: env.VITE_AI_BACKEND_URL || 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, ''),
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, res) => {
                // Em desenvolvimento, não falhar se o backend não estiver rodando
                if (mode === 'development') {
                  // Silenciar erro 503 para endpoint de uso de IA (é esperado quando backend não está rodando)
                  const isUsageEndpoint = _req?.url?.includes('/ai/usage');
                  if (!isUsageEndpoint) {
                    console.warn('[Vite Proxy] Backend não disponível:', err.message);
                  }
                  if (res && !res.headersSent) {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Backend não disponível em desenvolvimento' }));
                  }
                }
              });
              // Tratar resposta 503 do backend de forma silenciosa para endpoints opcionais
              proxy.on('proxyRes', (proxyRes, req) => {
                if (mode === 'development' && proxyRes.statusCode === 503) {
                  const isUsageEndpoint = req.url?.includes('/ai/usage');
                  if (isUsageEndpoint) {
                    // Silenciar este erro específico - é tratado graciosamente pelo frontend
                    // Não fazer nada, apenas deixar passar
                  }
                }
              });
            },
          },
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
        strictPort: true // SEMPRE usar porta 3000
      },
      plugins: [
        react(),
        // Remove console.log, console.info, console.debug apenas em produção
        ...(mode === 'production' 
          ? [removeConsole({ includes: ['log', 'info', 'debug'] })]
          : []
        ),
        // Plugin para desabilitar service worker em desenvolvimento e forçar no-cache
        {
          name: 'disable-service-worker-dev',
          configureServer(server) {
            // Middleware simplificado - apenas corrigir case sensitivity e deixar o Vite servir
            server.middlewares.use((req, res, next) => {
              // Interceptar /api/ai/usage em desenvolvimento e retornar dados vazios
              // Isso evita erro 503 quando o backend não está rodando
              if (mode === 'development' && req.url?.startsWith('/api/ai/usage')) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                
                // Responder a OPTIONS (preflight)
                if (req.method === 'OPTIONS') {
                  res.writeHead(200);
                  res.end();
                  return;
                }
                
                // Retornar dados vazios para GET
                res.writeHead(200);
                res.end(JSON.stringify({
                  byDay: [],
                  totals: {
                    calls: 0,
                    tokensIn: 0,
                    tokensOut: 0,
                    costUsd: 0,
                  },
                  month: null,
                }));
                return;
              }
              
              // In development, return empty service worker ANTES de qualquer outra coisa
              if (req.url === '/service-worker.js' || req.url?.startsWith('/service-worker.js?')) {
                res.setHeader('Content-Type', 'application/javascript');
                res.end(`
// Service worker disabled in development
// This file is automatically generated by Vite
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', () => {
  self.registration.unregister().then(() => {
    return self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_UNREGISTERED' }));
    });
  });
});
self.addEventListener('fetch', () => {
  // Don't intercept anything in development
});
`);
                return;
              }
              
              // Redirecionar /favicon.ico para o favicon SVG
              if (req.url === '/favicon.ico') {
                req.url = '/icons/favicon.svg';
              }
              
              // Corrigir case sensitivity para GIFs: sempre usar /GIFS/ (maiúscula)
              // Isso garante compatibilidade com sistemas case-sensitive (Linux/Vercel)
              if (req.url?.toLowerCase().startsWith('/gifs/')) {
                req.url = '/GIFS' + req.url.substring(5);
              }
              
              // Decodificar URL se necessário para verificar se é um GIF e servir o arquivo
              let decodedUrl = req.url;
              try {
                if (req.url?.includes('%')) {
                  decodedUrl = decodeURIComponent(req.url);
                  // Atualizar req.url para o Vite servir o arquivo com o nome decodificado
                  // Isso garante que o Vite encontre o arquivo no sistema de arquivos
                  req.url = decodedUrl;
                }
              } catch (e) {
                // Se falhar na decodificação, usar o URL original
                decodedUrl = req.url;
              }
              
              // Para arquivos GIF, servir diretamente do sistema de arquivos
              // Isso garante que arquivos com espaços e acentos funcionem corretamente
              const isGif = req.url?.endsWith('.gif') || decodedUrl?.endsWith('.gif');
              if (req.url?.startsWith('/GIFS/') && isGif) {
                // Construir caminho do arquivo no sistema de arquivos
                // Remover /GIFS/ e construir caminho relativo a public/GIFS/
                let gifPath = decodedUrl.replace(/^\/GIFS\//i, '');
                
                // Normalizar separadores de caminho para o sistema operacional
                gifPath = gifPath.replace(/\//g, path.sep);
                
                const filePath = path.join(__dirname, 'public', 'GIFS', gifPath);
                
                // Verificar se o arquivo existe
                try {
                  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                    // Ler e servir o arquivo diretamente
                    const fileContent = fs.readFileSync(filePath);
                    res.setHeader('Content-Type', 'image/gif');
                    res.setHeader('Accept-Ranges', 'bytes');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                    // Em desenvolvimento, desabilitar cache para evitar problemas
                    if (mode === 'development') {
                      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                      res.setHeader('Pragma', 'no-cache');
                      res.setHeader('Expires', '0');
                    } else {
                      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    }
                    res.writeHead(200);
                    res.end(fileContent);
                    return; // Não chamar next(), já servimos o arquivo
                  } else {
                    // Arquivo não encontrado - tentar variações do nome
                    // Em Windows, o sistema de arquivos não é case-sensitive, mas vamos tentar encontrar
                    if (mode === 'development') {
                      // Tentar encontrar arquivo com case diferente
                      const dirPath = path.dirname(filePath);
                      const fileName = path.basename(filePath);
                      
                      try {
                        if (fs.existsSync(dirPath)) {
                          const files = fs.readdirSync(dirPath);
                          const foundFile = files.find(f => f.toLowerCase() === fileName.toLowerCase());
                          if (foundFile) {
                            const correctPath = path.join(dirPath, foundFile);
                            const fileContent = fs.readFileSync(correctPath);
                            res.setHeader('Content-Type', 'image/gif');
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            if (mode === 'development') {
                              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                            } else {
                              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                            }
                            res.writeHead(200);
                            res.end(fileContent);
                            console.log(`[Vite] GIF encontrado com case diferente: ${foundFile} (procurado: ${fileName})`);
                            return;
                          }
                        }
                      } catch (dirError) {
                        // Ignorar erro de leitura de diretório
                      }
                      
                      console.warn(`[Vite] GIF não encontrado: ${filePath} (URL: ${req.url}, decoded: ${decodedUrl})`);
                    }
                  }
                } catch (error) {
                  // Erro ao ler arquivo - logar em desenvolvimento
                  if (mode === 'development') {
                    console.warn(`[Vite] Erro ao ler GIF: ${filePath}`, error);
                  }
                }
              }
              
              // Para favicon SVG, definir headers corretos
              if (req.url?.endsWith('/favicon.svg') || req.url?.endsWith('favicon.svg')) {
                res.setHeader('Content-Type', 'image/svg+xml');
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              }
              
              // SEMPRE chamar next() para deixar o Vite processar a requisição
              // O Vite serve index.html automaticamente para rotas não encontradas
              // IMPORTANTE: Não retornar aqui, apenas chamar next()
              next();
            });
          },
        },
      ],
      define: {
        // Definir process.env para compatibilidade (mas preferir import.meta.env)
        'process.env': JSON.stringify({
          API_KEY: env.VITE_GEMINI_API_KEY || '',
          GEMINI_API_KEY: env.VITE_GEMINI_API_KEY || '',
        }),
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1500, // Aumentar limite para evitar avisos desnecessários
        minify: 'esbuild', // Usar esbuild que já vem com Vite (mais rápido que terser)
        // Garantir que arquivos da pasta public sejam copiados
        copyPublicDir: true,
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
