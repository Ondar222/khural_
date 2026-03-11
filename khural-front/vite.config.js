import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";

export default defineConfig({
  plugins: [
    react({
      // Включаем React Fast Refresh для dev
      fastRefresh: true,
    }),
    {
      name: "html-transform",
      transformIndexHtml(html) {
        const apiBaseUrl = process.env.VITE_API_BASE_URL || "";
        // If API base URL is not set, remove the meta tag entirely
        if (!apiBaseUrl) {
          return html.replace(/<meta name="api-base"[^>]*>/g, "");
        }
        return html.replace(/%VITE_API_BASE_URL%/g, apiBaseUrl);
      },
    },
  ],
  build: {
    // Удаляем console.* в production для оптимизации
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // Дополнительные оптимизации
        pure_funcs: ['console.log', 'console.info', 'console.warn'],
        passes: 3,
        // Агрессивные оптимизации
        unused: true,
        dead_code: true,
        toplevel: true,
      },
      mangle: {
        safari10: false,
        toplevel: true,
      },
    },
    // Code splitting для лучшей производительности
    rollupOptions: {
      output: {
        manualChunks: {
          // Критические зависимости - загружаются первыми
          'react-vendor': ['react', 'react-dom/client'],
          // Ant Design - большой чанк, загружается отдельно
          'antd-vendor': ['antd', '@ant-design/icons'],
          // TinyMCE - только когда нужен
          'tinymce-vendor': ['@tinymce/tinymce-react', 'tinymce'],
        },
        // Разделяем чанки по размеру
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/index-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(css)$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash].css';
          }
          if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(name ?? '')) {
            return 'assets/img/[name]-[hash].[ext]';
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(name ?? '')) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    // Ограничения на размер чанков
    chunkSizeWarningLimit: 300,
    // Включаем sourcemap только для production отладки (опционально)
    sourcemap: false,
    // Оптимизация для таргетирования современных браузеров
    target: 'esnext',
    // Увеличиваем размер chunk для лучшей производительности
    cssCodeSplit: true,
    // Предзагрузка модулей
    modulePreload: {
      polyfill: true,
    },
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: ['react', 'react-dom/client', 'antd', '@ant-design/icons', 'axios'],
    esbuildOptions: {
      target: 'esnext',
      // Более агрессивная оптимизация
      minify: true,
    },
  },
  // Улучшаем производительность dev сервера
  esbuild: {
    target: 'esnext',
    legalComments: 'none',
    // Агрессивная минификация
    minify: true,
    // Убираем console
    pure: ['console.log', 'console.info', 'console.warn'],
  },
  server: {
    port: 5173,
    open: false,
    // Сжимаем ответы в dev режиме
    cors: true,
    // Оптимизация WebSocket для HMR
    hmr: {
      protocol: 'ws',
      port: 5173,
    },
    proxy: {
      "/api": {
        // khural-backend now listens on 4000 by default
        target: "http://localhost:3004",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // Proxy files to avoid CORP/CORS issues when backend serves /files cross-origin
      "/files": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3004",
        changeOrigin: true,
        secure: false,
      },
      // Proxy для PDF файлов с khural.rtyva.ru для обхода CORS и X-Frame-Options
      "/pdf-proxy": {
        target: "https://khural.rtyva.ru",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/pdf-proxy/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyRes", (proxyRes, req, res) => {
            // Убираем заголовки, которые блокируют встраивание
            delete proxyRes.headers["x-frame-options"];
            delete proxyRes.headers["X-Frame-Options"];
            delete proxyRes.headers["frame-ancestors"];
            // Добавляем CORS заголовки
            proxyRes.headers["Access-Control-Allow-Origin"] = "*";
            proxyRes.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
            proxyRes.headers["Access-Control-Allow-Headers"] = "*";
          });
        },
      },
      // Proxy для изображений с khural.rtyva.ru для обхода CORS
      "/img-proxy": {
        target: "https://khural.rtyva.ru",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/img-proxy/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyRes", (proxyRes, req, res) => {
            // Добавляем CORS заголовки для изображений
            proxyRes.headers["Access-Control-Allow-Origin"] = "*";
            proxyRes.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
            proxyRes.headers["Access-Control-Allow-Headers"] = "*";
            // Убираем ограничения на встраивание
            delete proxyRes.headers["x-frame-options"];
            delete proxyRes.headers["X-Frame-Options"];
          });
        },
      },
    },
  },
  // Оптимизация для production
  preview: {
    port: 5173,
    cors: true,
    // Включаем сжатие
    proxy: {
      "/api": {
        target: "http://localhost:3004",
        changeOrigin: true,
      },
    },
  },
});
