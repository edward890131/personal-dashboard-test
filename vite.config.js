/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Vite 設定：React 18 + Tailwind v4
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // path alias：@ 對應到 src/，import 起來比 ../../ 乾淨
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    css: true,
    // 跟 ESLint ignore 對齊：_trash-design-system 是舊版備份，不要跑它的測試
    exclude: ["**/node_modules/**", "**/dist/**", "**/_trash-design-system/**"],
  },
});
