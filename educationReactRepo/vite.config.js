import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxInject: 'import React from "react"',
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
