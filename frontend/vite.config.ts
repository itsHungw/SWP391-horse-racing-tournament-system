import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendOrigin = env.VITE_BACKEND_ORIGIN || "http://localhost:8080";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          changeOrigin: true,
          target: backendOrigin,
        },
        "/uploads": {
          changeOrigin: true,
          target: backendOrigin,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Split large, stable vendors into their own cacheable chunks instead of one
          // monolithic bundle. lightweight-charts is only pulled in by the lazy WalletPage
          // chunk, so it no longer ships to public visitors at all.
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            motion: ["framer-motion"],
            charts: ["lightweight-charts"],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: fileURLToPath(new URL("./src/test/setup.ts", import.meta.url)),
    },
  };
});
