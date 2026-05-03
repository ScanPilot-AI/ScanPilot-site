# OncoShield Static Site

Investor-facing marketing site plus a separate **interactive CT-PDAC Review Console** at `demo/#viewer` (PanTS static exports).

## Run locally

```bash
python3 -m http.server 8080
```

- Homepage: `http://localhost:8080/`
- Interactive demo: `http://localhost:8080/demo/#viewer`

Use `http://` (not `file://`) so the demo page can `fetch()` `assets/data/demoCases.json`.

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
