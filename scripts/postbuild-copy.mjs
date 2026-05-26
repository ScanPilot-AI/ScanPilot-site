import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Canonical marketing homepage at site root (ePAI narrative — not the React app).
fs.copyFileSync(
  path.join(root, "index.html"),
  path.join(dist, "index.html")
);

// Legacy static demo + PanTS Atlas PNG stacks + shared assets at same relative URLs.
copyDir(path.join(root, "assets"), path.join(dist, "assets"));
copyDir(path.join(root, "demo"), path.join(dist, "demo"));

const atlasManifest = path.join(root, "assets", "pants-atlas", "cases", "manifest.json");
if (fs.existsSync(atlasManifest)) {
  console.log("PanTS Atlas assets copied with dist/assets/pants-atlas");
} else {
  console.warn(
    "Warning: assets/pants-atlas missing — run scripts/export_pants_atlas_png.py before deploy"
  );
}
