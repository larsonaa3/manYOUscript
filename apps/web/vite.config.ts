import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this at https://<user>.github.io/<repo>/, not the
// domain root - set VITE_BASE_PATH="/manYOUscript/" only for that build.
// Hostinger (domain root) and local dev are unaffected by the default "/".
const basePath = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "manYOUscript",
        short_name: "manYOUscript",
        description: "A markdown-first writing and campaign-notes vault.",
        theme_color: "#4c5fd5",
        background_color: "#fafafa",
        display: "standalone",
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: "icons/192x192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/512x512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  server: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
