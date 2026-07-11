import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
        start_url: "/",
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
  },
});
