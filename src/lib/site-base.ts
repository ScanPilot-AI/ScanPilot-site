/**
 * Root URL for static assets (JSON, PNGs).
 * GitHub Pages serves this repo at /ScanPilot-site/ — fetches must not be relative to /product/ or /demo/.
 */
export function getSiteBase(): string {
  const envBase = import.meta.env.BASE_URL;

  if (envBase && envBase !== "./" && envBase !== ".") {
    return envBase.endsWith("/") ? envBase : `${envBase}/`;
  }

  if (typeof location !== "undefined") {
    const segs = location.pathname.split("/").filter(Boolean);
    const last = segs[segs.length - 1];
    if (
      segs.length >= 2 &&
      (last === "product" || last === "demo" || last === "index.html")
    ) {
      return `/${segs[0]}/`;
    }
  }

  return "/";
}

export function siteAssetUrl(...parts: string[]): string {
  const base = getSiteBase();
  const path = parts.filter(Boolean).join("/");
  return `${base}${path}`;
}
