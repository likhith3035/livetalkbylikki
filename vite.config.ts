import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";

// Force Vite re-optimization trigger

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    include: ["qrcode.react", "jszip"],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase-vendor";
            if (id.includes("@supabase")) return "supabase-vendor";
            if (id.includes("recharts")) return "charts-vendor";
            return "vendor";
          }
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'production' && viteCompression({ algorithm: 'gzip' }),
    mode === 'production' && viteCompression({ algorithm: 'brotliCompress' }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      includeAssets: ["robots.txt", "logo.png", "og-image.jpg"],
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/AdminDashboard-*.js", "**/QrScanner-*.js"],
        importScripts: ["sw-custom.js"],
      },
      manifest: {
        name: "LiveTalk – Talk to Anyone Instantly",
        short_name: "LiveTalk",
        description: "LiveTalk by Likki – The #1 Omegle alternative for anonymous text and video chat with strangers worldwide. No signup, no tracking, 100% free.",
        theme_color: "#7c3aed",
        background_color: "#0a0a0f",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["social", "communication", "entertainment"],
        icons: [
          {
            src: "logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "logo-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshot-desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "LiveTalk Desktop Interface",
          },
          {
            src: "screenshot-mobile.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
            label: "LiveTalk Mobile Interface",
          },
        ],
        shortcuts: [
          {
            name: "Start Chatting",
            short_name: "Start",
            description: "Start a new anonymous chat",
            url: "/chat",
            icons: [{ src: "logo.png", sizes: "192x192" }],
          },
          {
            name: "Safety Center",
            short_name: "Safety",
            description: "Learn how to stay safe",
            url: "/safety",
            icons: [{ src: "logo.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
