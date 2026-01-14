import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";

export default defineConfig({
  plugins: [
    react(),
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
  server: {
    port: 5173,
    open: false,
    proxy: {
      "/api": {
        // khural-backend now listens on 4000 by default
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // Proxy files to avoid CORP/CORS issues when backend serves /files cross-origin
      "/files": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
