// vite.config.ts
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "file:///D:/FitCoach.IA/node_modules/vite/dist/node/index.js";
import react from "file:///D:/FitCoach.IA/node_modules/@vitejs/plugin-react/dist/index.js";
import removeConsole from "file:///D:/FitCoach.IA/node_modules/vite-plugin-remove-console/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///D:/FitCoach.IA/vite.config.ts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3e3,
      host: "0.0.0.0",
      strictPort: true,
      // SEMPRE usar porta 3000 - falhar se estiver ocupada
      // Forçar fechamento limpo de conexões
      force: false,
      open: true,
      // Abre o navegador automaticamente
      watch: {
        // Ignorar mudanças em arquivos que podem causar loops
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/dist/**",
          "**/build/**",
          "**/public/GIFS/**",
          // Ignorar mudanças nos GIFs para evitar reloads
          "**/.vite/**",
          // Ignorar pasta .vite
          "**/package-lock.json",
          "**/yarn.lock"
        ],
        // Usar polling apenas se necessário (mais estável)
        usePolling: false,
        // Intervalo de polling se necessário
        interval: 100,
        // Ignorar mudanças iniciais
        ignoreInitial: false,
        // Ativar atomic para evitar reloads parciais
        atomic: true
      },
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "Last-Modified": (/* @__PURE__ */ new Date()).toUTCString()
      },
      hmr: {
        protocol: "ws",
        host: "localhost",
        port: 3e3,
        clientPort: 3e3,
        // Desabilitar overlay de erro para evitar problemas visuais
        overlay: false,
        // Configurações para evitar erros 504
        client: {
          overlay: false,
          // Tentativas de reconexão
          reconnect: 10,
          // Tempo entre tentativas (ms)
          timeout: 1e4
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
          "react",
          "react-dom",
          "react/jsx-runtime"
        ]
      },
      // Proxy para redirecionar /api para o backend
      proxy: {
        "/api": {
          target: env.VITE_AI_BACKEND_URL || "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          rewrite: (path2) => path2.replace(/^\/api/, ""),
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, res) => {
              if (mode === "development") {
                console.warn("[Vite Proxy] Backend n\xE3o dispon\xEDvel:", err.message);
                if (res && !res.headersSent) {
                  res.writeHead(503, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: "Backend n\xE3o dispon\xEDvel em desenvolvimento" }));
                }
              }
            });
          }
        }
      },
      // Ensure static assets are served with correct MIME types
      middlewareMode: false,
      fs: {
        // Allow serving files from public directory
        strict: false
      }
    },
    // Ensure public assets are handled correctly
    publicDir: "public",
    preview: {
      port: 3e3,
      host: "0.0.0.0",
      strictPort: true
      // SEMPRE usar porta 3000
    },
    plugins: [
      react(),
      // Remove console.log, console.info, console.debug apenas em produção
      ...mode === "production" ? [removeConsole({ includes: ["log", "info", "debug"] })] : [],
      // Plugin para desabilitar service worker em desenvolvimento e forçar no-cache
      {
        name: "disable-service-worker-dev",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (mode === "development") {
              res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
              res.setHeader("Pragma", "no-cache");
              res.setHeader("Expires", "0");
              res.setHeader("Last-Modified", (/* @__PURE__ */ new Date()).toUTCString());
              res.setHeader("ETag", `"${Date.now()}-${Math.random()}"`);
            }
            if (req.url === "/service-worker.js" || req.url?.startsWith("/service-worker.js?")) {
              res.setHeader("Content-Type", "application/javascript");
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
            next();
          });
        }
      }
    ],
    define: {
      // Definir process.env para compatibilidade (mas preferir import.meta.env)
      "process.env": JSON.stringify({
        API_KEY: env.VITE_GEMINI_API_KEY || "",
        GEMINI_API_KEY: env.VITE_GEMINI_API_KEY || ""
      }),
      "process.env.API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY || ""),
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY || "")
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, ".")
      }
    },
    build: {
      chunkSizeWarningLimit: 1500,
      // Aumentar limite para evitar avisos desnecessários
      minify: "esbuild",
      // Usar esbuild que já vem com Vite (mais rápido que terser)
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
                return "react-vendor";
              }
              if (id.includes("react-dropzone") || id.includes("@testing-library/react") || id.includes("@testing-library/jest-dom") || id.includes("@heroicons/react") || id.includes("recharts") || id.includes("@jest/globals")) {
                return "react-vendor";
              }
              if (id.includes("@google/genai")) {
                return "google-genai";
              }
              if (id.includes("html2pdf.js")) {
                return "pdf-html2pdf";
              }
              if (id.includes("jspdf")) {
                return "pdf-jspdf";
              }
              if (id.includes("html2canvas")) {
                return "pdf-html2canvas";
              }
              if (id.includes("clsx")) {
                return "ui-vendor";
              }
              return "react-vendor";
            }
            return void 0;
          },
          // Garantir ordem de carregamento - React primeiro
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]"
          // Garantir que react-vendor seja sempre carregado primeiro através de dependências
          // O Vite automaticamente ordena os chunks baseado nas dependências
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxGaXRDb2FjaC5JQVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcRml0Q29hY2guSUFcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0ZpdENvYWNoLklBL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHJlbW92ZUNvbnNvbGUgZnJvbSAndml0ZS1wbHVnaW4tcmVtb3ZlLWNvbnNvbGUnO1xyXG5cclxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcclxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKF9fZmlsZW5hbWUpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gICAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCAnLicsICcnKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHNlcnZlcjoge1xyXG4gICAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgICAgaG9zdDogJzAuMC4wLjAnLFxyXG4gICAgICAgIHN0cmljdFBvcnQ6IHRydWUsIC8vIFNFTVBSRSB1c2FyIHBvcnRhIDMwMDAgLSBmYWxoYXIgc2UgZXN0aXZlciBvY3VwYWRhXHJcbiAgICAgICAgLy8gRm9yXHUwMEU3YXIgZmVjaGFtZW50byBsaW1wbyBkZSBjb25leFx1MDBGNWVzXHJcbiAgICAgICAgZm9yY2U6IGZhbHNlLFxyXG4gICAgICAgIG9wZW46IHRydWUsIC8vIEFicmUgbyBuYXZlZ2Fkb3IgYXV0b21hdGljYW1lbnRlXHJcbiAgICAgICAgd2F0Y2g6IHtcclxuICAgICAgICAgIC8vIElnbm9yYXIgbXVkYW5cdTAwRTdhcyBlbSBhcnF1aXZvcyBxdWUgcG9kZW0gY2F1c2FyIGxvb3BzXHJcbiAgICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAgICcqKi9ub2RlX21vZHVsZXMvKionLCBcclxuICAgICAgICAgICAgJyoqLy5naXQvKionLCBcclxuICAgICAgICAgICAgJyoqL2Rpc3QvKionLCBcclxuICAgICAgICAgICAgJyoqL2J1aWxkLyoqJyxcclxuICAgICAgICAgICAgJyoqL3B1YmxpYy9HSUZTLyoqJywgLy8gSWdub3JhciBtdWRhblx1MDBFN2FzIG5vcyBHSUZzIHBhcmEgZXZpdGFyIHJlbG9hZHNcclxuICAgICAgICAgICAgJyoqLy52aXRlLyoqJywgLy8gSWdub3JhciBwYXN0YSAudml0ZVxyXG4gICAgICAgICAgICAnKiovcGFja2FnZS1sb2NrLmpzb24nLFxyXG4gICAgICAgICAgICAnKioveWFybi5sb2NrJ1xyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIC8vIFVzYXIgcG9sbGluZyBhcGVuYXMgc2UgbmVjZXNzXHUwMEUxcmlvIChtYWlzIGVzdFx1MDBFMXZlbClcclxuICAgICAgICAgIHVzZVBvbGxpbmc6IGZhbHNlLFxyXG4gICAgICAgICAgLy8gSW50ZXJ2YWxvIGRlIHBvbGxpbmcgc2UgbmVjZXNzXHUwMEUxcmlvXHJcbiAgICAgICAgICBpbnRlcnZhbDogMTAwLFxyXG4gICAgICAgICAgLy8gSWdub3JhciBtdWRhblx1MDBFN2FzIGluaWNpYWlzXHJcbiAgICAgICAgICBpZ25vcmVJbml0aWFsOiBmYWxzZSxcclxuICAgICAgICAgIC8vIEF0aXZhciBhdG9taWMgcGFyYSBldml0YXIgcmVsb2FkcyBwYXJjaWFpc1xyXG4gICAgICAgICAgYXRvbWljOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnQ2FjaGUtQ29udHJvbCc6ICduby1zdG9yZSwgbm8tY2FjaGUsIG11c3QtcmV2YWxpZGF0ZSwgcHJveHktcmV2YWxpZGF0ZSwgbWF4LWFnZT0wJyxcclxuICAgICAgICAgICdQcmFnbWEnOiAnbm8tY2FjaGUnLFxyXG4gICAgICAgICAgJ0V4cGlyZXMnOiAnMCcsXHJcbiAgICAgICAgICAnTGFzdC1Nb2RpZmllZCc6IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaG1yOiB7XHJcbiAgICAgICAgICBwcm90b2NvbDogJ3dzJyxcclxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxyXG4gICAgICAgICAgcG9ydDogMzAwMCxcclxuICAgICAgICAgIGNsaWVudFBvcnQ6IDMwMDAsXHJcbiAgICAgICAgICAvLyBEZXNhYmlsaXRhciBvdmVybGF5IGRlIGVycm8gcGFyYSBldml0YXIgcHJvYmxlbWFzIHZpc3VhaXNcclxuICAgICAgICAgIG92ZXJsYXk6IGZhbHNlLFxyXG4gICAgICAgICAgLy8gQ29uZmlndXJhXHUwMEU3XHUwMEY1ZXMgcGFyYSBldml0YXIgZXJyb3MgNTA0XHJcbiAgICAgICAgICBjbGllbnQ6IHtcclxuICAgICAgICAgICAgb3ZlcmxheTogZmFsc2UsXHJcbiAgICAgICAgICAgIC8vIFRlbnRhdGl2YXMgZGUgcmVjb25leFx1MDBFM29cclxuICAgICAgICAgICAgcmVjb25uZWN0OiAxMCxcclxuICAgICAgICAgICAgLy8gVGVtcG8gZW50cmUgdGVudGF0aXZhcyAobXMpXHJcbiAgICAgICAgICAgIHRpbWVvdXQ6IDEwMDAwXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBDb25maWd1cmFcdTAwRTdcdTAwRTNvIHBhcmEgZXZpdGFyIGxvb3BzIGRlIHJlbG9hZFxyXG4gICAgICAgIC8vIEF1bWVudGFyIHRlbXBvIGVudHJlIHJlbG9hZHNcclxuICAgICAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgICAgIGV4Y2x1ZGU6IFtdLFxyXG4gICAgICAgICAgLy8gRm9yXHUwMEU3YXIgcmUtb3RpbWl6YVx1MDBFN1x1MDBFM28gcXVhbmRvIG5lY2Vzc1x1MDBFMXJpb1xyXG4gICAgICAgICAgZm9yY2U6IGZhbHNlLFxyXG4gICAgICAgICAgLy8gRW50cmFkYXMgcGFyYSBvdGltaXphXHUwMEU3XHUwMEUzb1xyXG4gICAgICAgICAgZW50cmllczogW10sXHJcbiAgICAgICAgICAvLyBJbmNsdWlyIGRlcGVuZFx1MDBFQW5jaWFzIHF1ZSBwb2RlbSBjYXVzYXIgcHJvYmxlbWFzXHJcbiAgICAgICAgICBpbmNsdWRlOiBbXHJcbiAgICAgICAgICAgICdyZWFjdCcsXHJcbiAgICAgICAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAgICAgICAncmVhY3QvanN4LXJ1bnRpbWUnXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBQcm94eSBwYXJhIHJlZGlyZWNpb25hciAvYXBpIHBhcmEgbyBiYWNrZW5kXHJcbiAgICAgICAgcHJveHk6IHtcclxuICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICB0YXJnZXQ6IGVudi5WSVRFX0FJX0JBQ0tFTkRfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJyksXHJcbiAgICAgICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xyXG4gICAgICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIF9yZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gRW0gZGVzZW52b2x2aW1lbnRvLCBuXHUwMEUzbyBmYWxoYXIgc2UgbyBiYWNrZW5kIG5cdTAwRTNvIGVzdGl2ZXIgcm9kYW5kb1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZGUgPT09ICdkZXZlbG9wbWVudCcpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbVml0ZSBQcm94eV0gQmFja2VuZCBuXHUwMEUzbyBkaXNwb25cdTAwRUR2ZWw6JywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAocmVzICYmICFyZXMuaGVhZGVyc1NlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMywgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0JhY2tlbmQgblx1MDBFM28gZGlzcG9uXHUwMEVEdmVsIGVtIGRlc2Vudm9sdmltZW50bycgfSkpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gRW5zdXJlIHN0YXRpYyBhc3NldHMgYXJlIHNlcnZlZCB3aXRoIGNvcnJlY3QgTUlNRSB0eXBlc1xyXG4gICAgICAgIG1pZGRsZXdhcmVNb2RlOiBmYWxzZSxcclxuICAgICAgICBmczoge1xyXG4gICAgICAgICAgLy8gQWxsb3cgc2VydmluZyBmaWxlcyBmcm9tIHB1YmxpYyBkaXJlY3RvcnlcclxuICAgICAgICAgIHN0cmljdDogZmFsc2UsXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBFbnN1cmUgcHVibGljIGFzc2V0cyBhcmUgaGFuZGxlZCBjb3JyZWN0bHlcclxuICAgICAgcHVibGljRGlyOiAncHVibGljJyxcclxuICAgICAgcHJldmlldzoge1xyXG4gICAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgICAgaG9zdDogJzAuMC4wLjAnLFxyXG4gICAgICAgIHN0cmljdFBvcnQ6IHRydWUgLy8gU0VNUFJFIHVzYXIgcG9ydGEgMzAwMFxyXG4gICAgICB9LFxyXG4gICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgcmVhY3QoKSxcclxuICAgICAgICAvLyBSZW1vdmUgY29uc29sZS5sb2csIGNvbnNvbGUuaW5mbywgY29uc29sZS5kZWJ1ZyBhcGVuYXMgZW0gcHJvZHVcdTAwRTdcdTAwRTNvXHJcbiAgICAgICAgLi4uKG1vZGUgPT09ICdwcm9kdWN0aW9uJyBcclxuICAgICAgICAgID8gW3JlbW92ZUNvbnNvbGUoeyBpbmNsdWRlczogWydsb2cnLCAnaW5mbycsICdkZWJ1ZyddIH0pXVxyXG4gICAgICAgICAgOiBbXVxyXG4gICAgICAgICksXHJcbiAgICAgICAgLy8gUGx1Z2luIHBhcmEgZGVzYWJpbGl0YXIgc2VydmljZSB3b3JrZXIgZW0gZGVzZW52b2x2aW1lbnRvIGUgZm9yXHUwMEU3YXIgbm8tY2FjaGVcclxuICAgICAgICB7XHJcbiAgICAgICAgICBuYW1lOiAnZGlzYWJsZS1zZXJ2aWNlLXdvcmtlci1kZXYnLFxyXG4gICAgICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xyXG4gICAgICAgICAgICAvLyBNaWRkbGV3YXJlIHBhcmEgZm9yXHUwMEU3YXIgbm8tY2FjaGUgZW0gdG9kb3Mgb3MgYXJxdWl2b3MgZW0gZGVzZW52b2x2aW1lbnRvXHJcbiAgICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgLy8gRm9yXHUwMEU3YXIgaGVhZGVycyBkZSBuby1jYWNoZSBwYXJhIGV2aXRhciBlcnJvcyA1MDRcclxuICAgICAgICAgICAgICBpZiAobW9kZSA9PT0gJ2RldmVsb3BtZW50Jykge1xyXG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICduby1zdG9yZSwgbm8tY2FjaGUsIG11c3QtcmV2YWxpZGF0ZSwgcHJveHktcmV2YWxpZGF0ZSwgbWF4LWFnZT0wJyk7XHJcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdQcmFnbWEnLCAnbm8tY2FjaGUnKTtcclxuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0V4cGlyZXMnLCAnMCcpO1xyXG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignTGFzdC1Nb2RpZmllZCcsIG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGljaW9uYXIgRVRhZyBcdTAwRkFuaWNvIHBhcmEgZm9yXHUwMEU3YXIgcmV2YWxpZGFcdTAwRTdcdTAwRTNvXHJcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdFVGFnJywgYFwiJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCl9XCJgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgLy8gSW4gZGV2ZWxvcG1lbnQsIHJldHVybiBlbXB0eSBzZXJ2aWNlIHdvcmtlclxyXG4gICAgICAgICAgICAgIGlmIChyZXEudXJsID09PSAnL3NlcnZpY2Utd29ya2VyLmpzJyB8fCByZXEudXJsPy5zdGFydHNXaXRoKCcvc2VydmljZS13b3JrZXIuanM/JykpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0Jyk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKGBcclxuLy8gU2VydmljZSB3b3JrZXIgZGlzYWJsZWQgaW4gZGV2ZWxvcG1lbnRcclxuLy8gVGhpcyBmaWxlIGlzIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIGJ5IFZpdGVcclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgKCkgPT4ge1xyXG4gIHNlbGYuc2tpcFdhaXRpbmcoKTtcclxufSk7XHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignYWN0aXZhdGUnLCAoKSA9PiB7XHJcbiAgc2VsZi5yZWdpc3RyYXRpb24udW5yZWdpc3RlcigpLnRoZW4oKCkgPT4ge1xyXG4gICAgcmV0dXJuIHNlbGYuY2xpZW50cy5tYXRjaEFsbCgpLnRoZW4oY2xpZW50cyA9PiB7XHJcbiAgICAgIGNsaWVudHMuZm9yRWFjaChjbGllbnQgPT4gY2xpZW50LnBvc3RNZXNzYWdlKHsgdHlwZTogJ1NXX1VOUkVHSVNURVJFRCcgfSkpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0pO1xyXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2ZldGNoJywgKCkgPT4ge1xyXG4gIC8vIERvbid0IGludGVyY2VwdCBhbnl0aGluZyBpbiBkZXZlbG9wbWVudFxyXG59KTtcclxuYCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICAgIGRlZmluZToge1xyXG4gICAgICAgIC8vIERlZmluaXIgcHJvY2Vzcy5lbnYgcGFyYSBjb21wYXRpYmlsaWRhZGUgKG1hcyBwcmVmZXJpciBpbXBvcnQubWV0YS5lbnYpXHJcbiAgICAgICAgJ3Byb2Nlc3MuZW52JzogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgQVBJX0tFWTogZW52LlZJVEVfR0VNSU5JX0FQSV9LRVkgfHwgJycsXHJcbiAgICAgICAgICBHRU1JTklfQVBJX0tFWTogZW52LlZJVEVfR0VNSU5JX0FQSV9LRVkgfHwgJycsXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgJ3Byb2Nlc3MuZW52LkFQSV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9HRU1JTklfQVBJX0tFWSB8fCAnJyksXHJcbiAgICAgICAgJ3Byb2Nlc3MuZW52LkdFTUlOSV9BUElfS0VZJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfR0VNSU5JX0FQSV9LRVkgfHwgJycpLFxyXG4gICAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9HRU1JTklfQVBJX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX0dFTUlOSV9BUElfS0VZIHx8ICcnKVxyXG4gICAgICB9LFxyXG4gICAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgYWxpYXM6IHtcclxuICAgICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4nKSxcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxNTAwLCAvLyBBdW1lbnRhciBsaW1pdGUgcGFyYSBldml0YXIgYXZpc29zIGRlc25lY2Vzc1x1MDBFMXJpb3NcclxuICAgICAgICBtaW5pZnk6ICdlc2J1aWxkJywgLy8gVXNhciBlc2J1aWxkIHF1ZSBqXHUwMEUxIHZlbSBjb20gVml0ZSAobWFpcyByXHUwMEUxcGlkbyBxdWUgdGVyc2VyKVxyXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xyXG4gICAgICAgICAgICAgIC8vIFNlcGFyYXIgbm9kZV9tb2R1bGVzIGVtIGNodW5rcyBtZW5vcmVzIGUgbWFpcyBlc3BlY1x1MDBFRGZpY29zXHJcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUFJJT1JJREFERSAxOiBSZWFjdCBlIFJlYWN0IERPTSAtIFNFTVBSRSBwcmltZWlyb1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygnc2NoZWR1bGVyJykpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUFJJT1JJREFERSAyOiBCaWJsaW90ZWNhcyBxdWUgZGVwZW5kZW0gZG8gUmVhY3QgREVWRU0gZXN0YXIgbm8gbWVzbW8gY2h1bmtcclxuICAgICAgICAgICAgICAgIC8vIEluY2x1aXIgVE9EQVMgYXMgZGVwZW5kXHUwMEVBbmNpYXMgcXVlIHBvZGVtIHVzYXIgUmVhY3QgcGFyYSBldml0YXIgZXJyb3NcclxuICAgICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QtZHJvcHpvbmUnKSB8fCBcclxuICAgICAgICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnQHRlc3RpbmctbGlicmFyeS9yZWFjdCcpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0B0ZXN0aW5nLWxpYnJhcnkvamVzdC1kb20nKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAaGVyb2ljb25zL3JlYWN0JykgfHxcclxuICAgICAgICAgICAgICAgICAgICBpZC5pbmNsdWRlcygncmVjaGFydHMnKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAamVzdC9nbG9iYWxzJykpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUFJJT1JJREFERSAzOiBHb29nbGUgR2VuQUkgc2VwYXJhZG9cclxuICAgICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQGdvb2dsZS9nZW5haScpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiAnZ29vZ2xlLWdlbmFpJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFBSSU9SSURBREUgNDogQmlibGlvdGVjYXMgUERGIHNlcGFyYWRhcyBpbmRpdmlkdWFsbWVudGVcclxuICAgICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnaHRtbDJwZGYuanMnKSkge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gJ3BkZi1odG1sMnBkZic7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2pzcGRmJykpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuICdwZGYtanNwZGYnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdodG1sMmNhbnZhcycpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiAncGRmLWh0bWwyY2FudmFzJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFBSSU9SSURBREUgNTogVUkgbGlicmFyaWVzIHF1ZSBuXHUwMEUzbyBkZXBlbmRlbSBkbyBSZWFjdFxyXG4gICAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdjbHN4JykpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuICd1aS12ZW5kb3InO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUFJJT1JJREFERSA2OiBQb3Igc2VndXJhblx1MDBFN2EsIGNvbG9jYXIgcXVhbHF1ZXIgb3V0cmEgZGVwZW5kXHUwMEVBbmNpYVxyXG4gICAgICAgICAgICAgICAgLy8gcXVlIHBvc3NhIHRlciBzdWItZGVwZW5kXHUwMEVBbmNpYXMgZG8gUmVhY3QgdGFtYlx1MDBFOW0gbm8gcmVhY3QtdmVuZG9yXHJcbiAgICAgICAgICAgICAgICAvLyBJc3NvIGV2aXRhIG8gZXJybyB1c2VTdGF0ZSB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIC8vIEFwZW5hcyBjb2xvY2FyIG5vIHZlbmRvci1taXNjIHNlIHRpdmVyIDEwMCUgZGUgY2VydGV6YSBxdWUgblx1MDBFM28gdXNhIFJlYWN0XHJcbiAgICAgICAgICAgICAgICAvLyBQb3IgZW5xdWFudG8sIHZhbW9zIHNlciBjb25zZXJ2YWRvcmVzIGUgY29sb2NhciB0dWRvIG5vIHJlYWN0LXZlbmRvclxyXG4gICAgICAgICAgICAgICAgLy8gcGFyYSBnYXJhbnRpciBxdWUgblx1MDBFM28gaGFqYSBwcm9ibGVtYXMgZGUgY2FycmVnYW1lbnRvXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0LXZlbmRvcic7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIE5cdTAwRTNvIHNlcGFyYXIgY1x1MDBGM2RpZ28gZG8gcHJcdTAwRjNwcmlvIGFwcCBlbSBjaHVua3MgbWFudWFpc1xyXG4gICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIEdhcmFudGlyIG9yZGVtIGRlIGNhcnJlZ2FtZW50byAtIFJlYWN0IHByaW1laXJvXHJcbiAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XScsXHJcbiAgICAgICAgICAgIC8vIEdhcmFudGlyIHF1ZSByZWFjdC12ZW5kb3Igc2VqYSBzZW1wcmUgY2FycmVnYWRvIHByaW1laXJvIGF0cmF2XHUwMEU5cyBkZSBkZXBlbmRcdTAwRUFuY2lhc1xyXG4gICAgICAgICAgICAvLyBPIFZpdGUgYXV0b21hdGljYW1lbnRlIG9yZGVuYSBvcyBjaHVua3MgYmFzZWFkbyBuYXMgZGVwZW5kXHUwMEVBbmNpYXNcclxuICAg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
