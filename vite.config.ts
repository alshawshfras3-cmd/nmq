import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  envDir: ".",
  envPrefix: "VITE_",
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "Favicon.svg",
        "Favicon.png",
        "Favicon@0.5x.png",
        "Favicon@2x.png",
      ],
      manifest: {
        name: "Homebranch",
        short_name: "Homebranch",
        description: "Manage and read your self-hosted ebook collection across devices.",
        theme_color: "#1a1a1a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["books", "productivity", "utilities"],
        icons: [
          {
            src: "/Favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
          {
            src: "/Favicon@0.5x.png",
            sizes: "16x16",
            type: "image/png",
          },
          {
            src: "/Favicon.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/Favicon@2x.png",
            sizes: "64x64",
            type: "image/png",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    allowedHosts: [env.ALLOWED_HOST || "localhost"],
    cors: env.CORS_ORIGIN ? {origin: env.CORS_ORIGIN} : undefined,
      proxy: {
        '/api': {
            target: env.VITE_API_ROOT || 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
            headers: { 'X-Forwarded-Prefix': '/api' },
            rewrite: (path) => path.replace(/^\/api/, '')
        },
          '/auth': {
            target: env.VITE_AUTHENTICATION_ROOT || 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
            cookiePathRewrite: {'/refresh': '/auth/refresh'},
            rewrite: (path) => path.replace(/^\/auth/, '')
          }
      }
  }
  };
});
