import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
};

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

function trySendStatic(
  res: ServerResponse,
  filePath: string
): boolean {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", contentType(filePath));
  res.end(fs.readFileSync(filePath));
  return true;
}

/**
 * Dev-only: serve marketing homepage, demo, and assets before Vite's SPA handler.
 * The React Infrastructure Console stays at /product/ (Vite MPA entry).
 */
export function scanpilotDevStaticPlugin(siteRoot: string): Plugin {
  return {
    name: "scanpilot-dev-static",
    apply: "serve",
    configureServer(server) {
      // Run before Vite internals so `/` is not swallowed by root index handling.
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const raw = req.url ?? "/";
          const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
          const pathname = raw.split("?")[0] || "/";

          if (pathname === "/" || pathname === "/index.html") {
            if (trySendStatic(res, path.join(siteRoot, "index.html"))) {
              return;
            }
          }

          if (pathname.startsWith("/assets/")) {
            const file = path.join(siteRoot, pathname);
            if (trySendStatic(res, file)) return;
          }

          if (pathname === "/demo" || pathname === "/demo/") {
            res.statusCode = 302;
            res.setHeader("Location", `/demo/index.html${q}`);
            res.end();
            return;
          }

          if (pathname.startsWith("/demo/")) {
            const file = path.join(siteRoot, pathname);
            if (trySendStatic(res, file)) return;
          }

          if (pathname === "/product" || pathname === "/product/") {
            req.url = `/product/index.html${q}`;
          }

          next();
        }
      );
    },
  };
}
