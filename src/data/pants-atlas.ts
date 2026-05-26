export type OrganGroupKey =
  | "pancreas"
  | "duct_lesion"
  | "adjacent_gi"
  | "vascular"
  | "renal_adrenal"
  | "other";

export type FocusPresetId =
  | "pancreas_screening"
  | "duct_lesion_review"
  | "vascular_context"
  | "full_anatomy";

export type PanTSGlobalCaseSummary = {
  caseId: string;
  manifestPath: string;
  sliceCount: number;
  organCount: number;
  hasPancreaticDuct: boolean;
  hasPancreaticLesion: boolean;
  thumbnailFrame: string | null;
};

export type PanTSGlobalManifest = {
  version: number;
  generatedAt: string;
  disclaimer: string;
  caseCount: number;
  totalExportedCtFrames: number;
  totalOrganOverlayStacks: number;
  uniqueOrganLayers: string[];
  cases: PanTSGlobalCaseSummary[];
};

export type PanTSCaseManifest = {
  version: number;
  caseId: string;
  sliceCount: number;
  ctFrames: string[];
  sourceSliceIds: number[];
  overlays: Record<string, string[]>;
  availableOrgans: string[];
  hasPancreaticDuct: boolean;
  hasPancreaticLesion: boolean;
  thumbnailFrame: string | null;
};

export type PanTSAtlasDatabase = {
  version: number;
  generatedAt: string;
  sourceRoot: string;
  caseCount: number;
  cases: Array<{
    caseId: string;
    displayName: string;
    organs: string[];
    organCount: number;
    hasPancreaticDuct: boolean;
    hasPancreaticLesion: boolean;
    organGroups: OrganGroupKey[];
  }>;
  uniqueOrgans: string[];
  groupCoverage: Record<
    string,
    { caseCount: number; caseIds: string[] }
  >;
};

export const ATLAS_DISCLAIMER =
  "Static demo using precomputed PanTS-derived assets. Not for clinical diagnosis.";

const ORGAN_GROUP_MAP: Record<string, OrganGroupKey> = {
  pancreas: "pancreas",
  pancreas_head: "pancreas",
  pancreas_body: "pancreas",
  pancreas_tail: "pancreas",
  pancreatic_duct: "duct_lesion",
  pancreatic_lesion: "duct_lesion",
  duodenum: "adjacent_gi",
  stomach: "adjacent_gi",
  colon: "adjacent_gi",
  gall_bladder: "adjacent_gi",
  common_bile_duct: "adjacent_gi",
  aorta: "vascular",
  celiac_artery: "vascular",
  superior_mesenteric_artery: "vascular",
  postcava: "vascular",
  veins: "vascular",
  kidney_left: "renal_adrenal",
  kidney_right: "renal_adrenal",
  adrenal_gland_left: "renal_adrenal",
  adrenal_gland_right: "renal_adrenal",
  bladder: "renal_adrenal",
  prostate: "renal_adrenal",
};

export const ORGAN_GROUP_LABELS: Record<OrganGroupKey, string> = {
  pancreas: "Pancreas",
  duct_lesion: "Duct / Lesion",
  adjacent_gi: "Adjacent GI",
  vascular: "Vascular",
  renal_adrenal: "Renal / Adrenal",
  other: "Other anatomy",
};

export const FOCUS_PRESETS: Record<
  FocusPresetId,
  { label: string; organs: (organs: string[]) => string[] }
> = {
  pancreas_screening: {
    label: "Pancreas Screening",
    organs: (available) =>
      available.filter((o) =>
        ["pancreas", "pancreas_head", "pancreas_body", "pancreas_tail"].includes(
          o
        )
      ),
  },
  duct_lesion_review: {
    label: "Duct / Lesion Review",
    organs: (available) =>
      available.filter((o) =>
        ["pancreatic_duct", "pancreatic_lesion", "pancreas", "pancreas_head"].includes(
          o
        )
      ),
  },
  vascular_context: {
    label: "Vascular Context",
    organs: (available) =>
      available.filter((o) => organGroupFor(o) === "vascular"),
  },
  full_anatomy: {
    label: "Full Anatomy Atlas",
    organs: (available) => [...available],
  },
};

function atlasBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${normalized}assets/pants-atlas`;
}

export function toPublicAssetPath(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  if (clean.startsWith("assets/pants-atlas/")) {
    return `${atlasBase()}/${clean.slice("assets/pants-atlas/".length)}`;
  }
  return `${atlasBase()}/${clean}`;
}

export async function loadPanTSGlobalManifest(): Promise<PanTSGlobalManifest | null> {
  try {
    const res = await fetch(`${atlasBase()}/cases/manifest.json`);
    if (!res.ok) return null;
    return (await res.json()) as PanTSGlobalManifest;
  } catch {
    return null;
  }
}

export async function loadPanTSAtlasDatabase(): Promise<PanTSAtlasDatabase | null> {
  try {
    const res = await fetch(`${atlasBase()}/database/pantsAtlasDatabase.json`);
    if (!res.ok) return null;
    return (await res.json()) as PanTSAtlasDatabase;
  } catch {
    return null;
  }
}

export async function loadPanTSCaseManifest(
  caseId: string
): Promise<PanTSCaseManifest | null> {
  try {
    const res = await fetch(`${atlasBase()}/cases/${caseId}/manifest.json`);
    if (!res.ok) return null;
    return (await res.json()) as PanTSCaseManifest;
  } catch {
    return null;
  }
}

export function organGroupFor(organId: string): OrganGroupKey {
  return ORGAN_GROUP_MAP[organId] ?? "other";
}

export function groupOrgans(organs: string[]): Record<OrganGroupKey, string[]> {
  const groups: Record<OrganGroupKey, string[]> = {
    pancreas: [],
    duct_lesion: [],
    adjacent_gi: [],
    vascular: [],
    renal_adrenal: [],
    other: [],
  };
  for (const organ of organs) {
    groups[organGroupFor(organ)].push(organ);
  }
  for (const key of Object.keys(groups) as OrganGroupKey[]) {
    groups[key].sort();
  }
  return groups;
}

export function formatOrganLabel(organId: string): string {
  return organId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function overlayForSlice(
  manifest: PanTSCaseManifest,
  organ: string,
  sliceIndex: number
): string | null {
  const paths = manifest.overlays[organ];
  if (!paths?.length) return null;
  const rel = paths[sliceIndex];
  if (!rel) return null;
  return toPublicAssetPath(rel);
}

export function ctFrameForSlice(
  manifest: PanTSCaseManifest,
  sliceIndex: number
): string | null {
  const rel = manifest.ctFrames[sliceIndex];
  if (!rel) return null;
  return toPublicAssetPath(rel);
}
