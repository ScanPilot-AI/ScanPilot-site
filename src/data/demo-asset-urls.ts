/**
 * Public demo slice paths — no import.meta.glob so the product app boots instantly.
 * Files live under assets/demo-cases/ (served at /assets/demo-cases/ in dev and dist).
 */
function assetBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${normalized}assets/demo-cases`;
}

export function demoAssetUrl(...segments: string[]): string {
  const key = segments.filter(Boolean).join("/");
  return `${assetBase()}/${key}`;
}

export function ctSliceUrl(caseFolder: string, sliceIndex: number): string {
  const pad = String(sliceIndex).padStart(2, "0");
  return demoAssetUrl(caseFolder, "ct", `${pad}.png`);
}

export function overlaySliceUrl(
  caseFolder: string,
  layerPrefix: string,
  sliceIndex: number
): string {
  const pad = String(sliceIndex).padStart(2, "0");
  return demoAssetUrl(caseFolder, "overlay", `${layerPrefix}_${pad}.png`);
}
