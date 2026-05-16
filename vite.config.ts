import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    assetsDir: "static",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "product/index.html"),
    },
  },
});
