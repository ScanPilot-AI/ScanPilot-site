import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { scanpilotDevStaticPlugin } from "./scripts/vite-dev-static-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = __dirname;
const productHtml = path.resolve(siteRoot, "product/index.html");
const demoHtml = path.resolve(siteRoot, "demo/index.html");

/** GitHub Pages project site — must match repo name (see Settings → Pages). */
const GITHUB_PAGES_BASE =
  process.env.VITE_BASE_PATH?.replace(/\/?$/, "/") || "/ScanPilot-site/";

export default defineConfig(({ command }) => ({
  plugins: [react(), scanpilotDevStaticPlugin(siteRoot)],
  /**
   * Production: absolute base so fetch('assets/data/...') resolves to
   * /ScanPilot-site/assets/... not /ScanPilot-site/product/assets/...
   */
  base: command === "build" ? GITHUB_PAGES_BASE : "/",
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
