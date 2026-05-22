# ScanPilot Static Site

Investor-facing marketing site plus a separate **interactive CT-PDAC Review Console** at `demo/#viewer` (PanTS static exports).

## Run locally

**Full site (recommended)** — marketing homepage, sample viewer, and Infrastructure Console:

```bash
npm install
npm run dev
```

If port 5173 is already in use, stop the old Vite process (`Ctrl+C` in that terminal, or `lsof -ti:5173 | xargs kill`) so dev always runs on **5173**. A stale server on 5173 can show a blank white `/product/` page.

- Homepage: `http://localhost:5173/`
- Sample CT Viewer: `http://localhost:5173/demo/#viewer`
- Infrastructure Console: `http://localhost:5173/product/`

**Product app only** (faster HMR while editing React):

```bash
npm run dev:product
```

**Production preview** (after `npm run build`):

```bash
npm run preview
```

- Mirrors GitHub Pages layout under `dist/`

**Static-only fallback** (no React HMR):

```bash
python3 -m http.server 8080
```

Use `http://` (not `file://`) so pages can `fetch()` JSON under `assets/data/`.

## Project structure

```txt
oncoshield-site/
  index.html
  demo/index.html
  assets/
    css/style.css, demo-page.css
    js/demo-page.js
    data/demoCases.json
    demo-cases/          # PNG stacks from export script
    images/              # hero-ct, ct-evidence, validation-results, reader-study, etc.
  scripts/
    export_oncoshield_demo_assets.py
    requirements-demo-export.txt
```

## Regenerating demo slices

```bash
.venv/bin/python scripts/export_oncoshield_demo_assets.py
```

## Compliance

Research/product demo positioning on the marketing site. Not for diagnosis or patient-care decisions. Assistive second-read design—not autonomous diagnosis. Not FDA cleared.
