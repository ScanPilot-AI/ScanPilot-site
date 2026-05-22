/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCANPILOT_API_URL?: string;
  readonly VITE_SCANPILOT_API_BASE_URL?: string;
  readonly VITE_SCANPILOT_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
