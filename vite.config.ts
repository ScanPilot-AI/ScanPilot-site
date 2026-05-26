import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { scanpilotDevStaticPlugin } from "./scripts/vite-dev-static-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = __dirname;
const productHtml = path.resolve(siteRoot, "product/index.html");
const demoHtml = path.resolve(siteRoot, "demo/index.html");

export default defineConfig(({ command }) => ({
  plugins: [react(), scanpilotDevStaticPlugin(siteRoot)],
  /** Dev: absolute base so /product/ loads /@vite and /src modules correctly. */
  base: command === "build" ? "./" : "/",
  server: {
    port: 5173,
    strictPort: true,
    open: "/",
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
  build: {
    outDir: "dist",
    assetsDir: "static",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        product: productHtml,
        demo: demoHtml,
      },
    },
  },
}));
