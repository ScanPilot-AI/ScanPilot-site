const rawPng = import.meta.glob("../../assets/demo-cases/**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const urlByRel = new Map<string, string>();

for (const [modulePath, href] of Object.entries(rawPng)) {
  const idx = modulePath.indexOf("demo-cases/");
  if (idx === -1) continue;
  const rel = modulePath.slice(idx + "demo-cases/".length);
  urlByRel.set(rel.replace(/^\.\//, ""), href);
}

export function demoAssetUrl(...segments: string[]): string {
  const key = segments.filter(Boolean).join("/");
  return urlByRel.get(key) ?? "";
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
