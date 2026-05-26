import { getSiteBase } from "../lib/site-base";

/**
 * Legacy demo slice paths under assets/demo-cases/.
 */
function assetBase(): string {
  return `${getSiteBase()}assets/demo-cases`;
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
