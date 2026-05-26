import { getSiteBase } from "../lib/site-base";

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

export type PanTSCatalogCase = {
  caseId: string;
  shape: string | null;
  spacing: string | null;
  ctPhase: string | null;
  sex: string | null;
  age: number | null;
  manufacturer: string | null;
  manufacturerModel: string | null;
  studyType: string | null;
  site: string | null;
  siteDetail: string | null;
  siteNationality: string | null;
  studyYear: string | number | null;
  tumor: boolean | null;
  hasLocalVolume: boolean;
  hasLocalLabels: boolean;
  hasFullSegmentation?: boolean;
  availabilityStatus?: "full_volume_segmentation" | "local_volume_only" | "metadata_only";
};

/** Canonical atlas case record from assets/pants-atlas/database/pantsAtlasDatabase.json */
export type PanTSAtlasCase = {
  caseId: string;
  displayName?: string;
  sliceCount: number;
  ctFrames?: string[];
  ctSliceNames?: string[];
  sourceSliceIds?: number[];
  overlaysByOrgan?: Record<string, string[]>;
  overlaySliceNames?: Record<string, string[]>;
  availableOrgans: string[];
  organs?: string[];
  organCount?: number;
  hasPancreas?: boolean;
  hasPancreaticDuct: boolean;
  hasPancreaticLesion: boolean;
  thumbnail?: string | null;
  organGroups?: string[];
};

export type PanTSAtlasDatabase = {
  version: number;
  generatedAt: string;
  caseCount: number;
  cases: PanTSAtlasCase[];
  uniqueOrgans?: string[];
};

export type PanTSAtlasCaseIndex = {
  version: number;
  generatedAt: string;
  cases: Array<{
    caseId: string;
    displayName?: string;
    sliceCount: number;
    organCount?: number;
    hasPancreaticDuct: boolean;
    hasPancreaticLesion: boolean;
    thumbnail?: string | null;
  }>;
};

export type PanTSOrganSchema = {
  version: number;
  generatedAt: string;
  groups: Record<string, string>;
  organs: Array<{ id: string; label: string; group: string }>;
};

export type PanTSLocalAtlasCase = {
  caseId: string;
  ctPngFrames: string[];
  thumbnail: string | null;
  overlaysByOrgan: Record<string, string[]>;
  availableOrgans: string[];
  localFrameCount: number;
  sourceSliceIds: number[];
  hasPancreaticDuct: boolean;
  hasPancreaticLesion: boolean;
  metadata: Partial<PanTSCatalogCase>;
};

export type PanTSLocalAtlas = {
  version: number;
  generatedAt: string;
  caseCount: number;
  cases: PanTSLocalAtlasCase[];
};

export type PanTSCatalog = {
  version: number;
  generatedAt: string;
  totalCases: number;
  cases: PanTSCatalogCase[];
};

export type PanTSAtlasSummary = {
  version: number;
  generatedAt: string;
  disclosure?: string;
  totalCatalogCases: number;
  localVolumeCases: number;
  localFullSegmentationCases?: number;
  metadataOnlyCases: number;
  tumorCases: number;
  tumorPositiveCases?: number;
  tumorNegativeCases?: number;
  noTumorCases: number;
  tumorUnknownCases?: number;
  tumorPositiveRate?: number;
  sexCounts: Record<string, number>;
  ageBucketCounts?: Record<string, number>;
  ctPhaseCounts: Record<string, number>;
  siteCounts: Record<string, number>;
  siteDetailCounts?: Record<string, number>;
  siteNationalityCounts?: Record<string, number>;
  manufacturerCounts: Record<string, number>;
  manufacturerModelCounts?: Record<string, number>;
  studyTypeCounts?: Record<string, number>;
  studyYearRange?: { min: number | null; max: number | null };
  studyYearCounts?: Record<string, number>;
  studyDecadeCounts?: Record<string, number>;
  tumorByAgeBucket?: Record<string, number>;
  tumorRateByAgeBucket?: Record<
    string,
    { tumorPositive: number; total: number; rate: number }
  >;
  tumorBySex?: Record<string, number>;
  tumorByCtPhase?: Record<string, number>;
  tumorBySiteNationality?: Record<string, number>;
  canonicalOrganLabelCount?: number;
  exportedOrganLayerCount?: number;
  uniqueOrganLayers: string[];
  exportedCtFrames: number;
  exportedOverlayStacks: number;
  localCaseIds: string[];
};

/** Viewer-facing manifest shape (built from PanTSAtlasCase — not fetched from disk). */
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

export type CatalogFilterOptions = {
  query?: string;
  tumor?: "any" | "tumor" | "no_tumor";
  sex?: "any" | "M" | "F";
  availability?: "all" | "local" | "metadata";
  ctPhase?: string;
  site?: string;
  siteNationality?: string;
  manufacturer?: string;
};

export const ATLAS_DISCLAIMER =
  "Static demo using precomputed PanTS-derived assets. Not for clinical diagnosis.";

export const METADATA_ONLY_NOTE =
  "This case is indexed in the PanTS metadata catalog. The CT volume is not bundled in this static ScanPilot demo.";

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
        ["pancreas", "pancreas_head", "pancreas_body", "pancreas_tail"].includes(o)
      ),
  },
  duct_lesion_review: {
    label: "Duct / Lesion Review",
    organs: (available) =>
      available.filter((o) =>
        ["pancreatic_duct", "pancreatic_lesion", "pancreas", "pancreas_head"].includes(o)
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

let catalogCache: PanTSCatalog | null = null;
let summaryCache: PanTSAtlasSummary | null = null;
let atlasDatabaseCache: PanTSAtlasDatabase | null = null;
let caseIndexCache: PanTSAtlasCaseIndex | null = null;
let organSchemaCache: PanTSOrganSchema | null = null;
const atlasCaseMap = new Map<string, PanTSAtlasCase>();

function dataBase(): string {
  return `${getSiteBase()}assets/data`;
}

function atlasBase(): string {
  return `${getSiteBase()}assets/pants-atlas`;
}

function databaseBase(): string {
  return `${atlasBase()}/database`;
}

export function toPublicAssetPath(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  if (clean.startsWith("assets/pants-atlas/")) {
    return `${atlasBase()}/${clean.slice("assets/pants-atlas/".length)}`;
  }
  if (clean.startsWith("assets/")) {
    return `${getSiteBase()}${clean}`;
  }
  return `${atlasBase()}/${clean}`;
}

function padSliceName(sliceIndex: number, width = 3): string {
  return `${String(sliceIndex).padStart(width, "0")}.png`;
}

function resolveSliceName(
  caseRecord: PanTSAtlasCase,
  sliceIndex: number,
  kind: "ct" | "overlay",
  layerId?: string
): string {
  if (kind === "ct") {
    const fromJson = caseRecord.ctSliceNames?.[sliceIndex];
    if (fromJson) return fromJson;
    const fromFrame = caseRecord.ctFrames?.[sliceIndex];
    if (fromFrame) {
      const parts = fromFrame.split("/");
      return parts[parts.length - 1] ?? padSliceName(sliceIndex);
    }
    return padSliceName(sliceIndex);
  }
  if (!layerId) return padSliceName(sliceIndex);
  const fromJson = caseRecord.overlaySliceNames?.[layerId]?.[sliceIndex];
  if (fromJson) return fromJson;
  const fromOverlay = caseRecord.overlaysByOrgan?.[layerId]?.[sliceIndex];
  if (fromOverlay) {
    const parts = fromOverlay.split("/");
    return parts[parts.length - 1] ?? padSliceName(sliceIndex);
  }
  return padSliceName(sliceIndex);
}

function indexAtlasCases(db: PanTSAtlasDatabase): void {
  atlasCaseMap.clear();
  for (const c of db.cases) {
    atlasCaseMap.set(c.caseId, c);
  }
}

export async function loadPanTSAtlasDatabase(): Promise<PanTSAtlasDatabase | null> {
  if (atlasDatabaseCache) return atlasDatabaseCache;
  try {
    const res = await fetch(`${databaseBase()}/pantsAtlasDatabase.json`);
    if (!res.ok) return null;
    atlasDatabaseCache = (await res.json()) as PanTSAtlasDatabase;
    indexAtlasCases(atlasDatabaseCache);
    return atlasDatabaseCache;
  } catch {
    return null;
  }
}

export async function loadPanTSCaseIndex(): Promise<PanTSAtlasCaseIndex | null> {
  if (caseIndexCache) return caseIndexCache;
  try {
    const res = await fetch(`${databaseBase()}/caseIndex.json`);
    if (!res.ok) return null;
    caseIndexCache = (await res.json()) as PanTSAtlasCaseIndex;
    return caseIndexCache;
  } catch {
    return null;
  }
}

export async function loadPanTSOrganSchema(): Promise<PanTSOrganSchema | null> {
  if (organSchemaCache) return organSchemaCache;
  try {
    const res = await fetch(`${databaseBase()}/organSchema.json`);
    if (!res.ok) return null;
    organSchemaCache = (await res.json()) as PanTSOrganSchema;
    return organSchemaCache;
  } catch {
    return null;
  }
}

/** Load database + index + schema; returns true when atlas PNG cases are available. */
export async function ensurePanTSAtlasLoaded(): Promise<boolean> {
  const db = await loadPanTSAtlasDatabase();
  if (!db?.cases.length) return false;
  await Promise.all([loadPanTSCaseIndex(), loadPanTSOrganSchema()]);
  return true;
}

export function getAtlasCase(caseId: string): PanTSAtlasCase | null {
  return atlasCaseMap.get(caseId) ?? null;
}

export function getAtlasCaseCount(): number {
  return atlasCaseMap.size;
}

export function getCaseCTFrameUrl(caseId: string, sliceIndex: number): string | null {
  const c = getAtlasCase(caseId);
  if (!c || sliceIndex < 0 || sliceIndex >= c.sliceCount) return null;

  const rel = c.ctFrames?.[sliceIndex];
  if (rel) return toPublicAssetPath(rel);

  const sliceName = resolveSliceName(c, sliceIndex, "ct");
  return `${atlasBase()}/cases/${caseId}/ct/${sliceName}`;
}

export function getCaseOverlayUrl(
  caseId: string,
  layerId: string,
  sliceIndex: number
): string | null {
  const c = getAtlasCase(caseId);
  if (!c || !caseHasLayer(caseId, layerId)) return null;
  if (sliceIndex < 0 || sliceIndex >= c.sliceCount) return null;

  const rel = c.overlaysByOrgan?.[layerId]?.[sliceIndex];
  if (rel) return toPublicAssetPath(rel);

  const sliceName = resolveSliceName(c, sliceIndex, "overlay", layerId);
  if (!sliceName) return null;
  return `${atlasBase()}/cases/${caseId}/overlays/${layerId}/${sliceName}`;
}

export function getAvailableLayersForCase(caseId: string): string[] {
  const c = getAtlasCase(caseId);
  return c?.availableOrgans ?? [];
}

export function caseHasLayer(caseId: string, layerId: string): boolean {
  return getAvailableLayersForCase(caseId).includes(layerId);
}

export function atlasCaseToManifest(atlas: PanTSAtlasCase): PanTSCaseManifest {
  const overlays: Record<string, string[]> = {};
  for (const [organ, paths] of Object.entries(atlas.overlaysByOrgan ?? {})) {
    overlays[organ] = paths ?? [];
  }
  return {
    version: 2,
    caseId: atlas.caseId,
    sliceCount: atlas.sliceCount,
    ctFrames: atlas.ctFrames ?? [],
    sourceSliceIds: atlas.sourceSliceIds ?? [],
    overlays,
    availableOrgans: atlas.availableOrgans,
    hasPancreaticDuct: atlas.hasPancreaticDuct,
    hasPancreaticLesion: atlas.hasPancreaticLesion,
    thumbnailFrame: atlas.thumbnail ?? null,
  };
}

export function atlasCaseToLocalEntry(
  atlas: PanTSAtlasCase,
  metadata: Partial<PanTSCatalogCase> = {}
): PanTSLocalAtlasCase {
  return {
    caseId: atlas.caseId,
    ctPngFrames: atlas.ctFrames ?? [],
    thumbnail: atlas.thumbnail ?? null,
    overlaysByOrgan: atlas.overlaysByOrgan ?? {},
    availableOrgans: atlas.availableOrgans,
    localFrameCount: atlas.sliceCount,
    sourceSliceIds: atlas.sourceSliceIds ?? [],
    hasPancreaticDuct: atlas.hasPancreaticDuct,
    hasPancreaticLesion: atlas.hasPancreaticLesion,
    metadata,
  };
}

export async function loadPanTSCatalog(): Promise<PanTSCatalog | null> {
  if (catalogCache) return catalogCache;
  try {
    const res = await fetch(`${dataBase()}/pantsCatalog.json`);
    if (!res.ok) return null;
    catalogCache = (await res.json()) as PanTSCatalog;
    return catalogCache;
  } catch {
    return null;
  }
}

export async function loadPanTSLocalAtlas(): Promise<PanTSLocalAtlas | null> {
  const db = await loadPanTSAtlasDatabase();
  if (!db) return null;
  const catalog = await loadPanTSCatalog();
  const cases: PanTSLocalAtlasCase[] = db.cases.map((atlas) => {
    const meta = catalog?.cases.find((c) => c.caseId === atlas.caseId);
    return atlasCaseToLocalEntry(atlas, meta ?? {});
  });
  return {
    version: db.version,
    generatedAt: db.generatedAt,
    caseCount: db.caseCount,
    cases,
  };
}

export async function loadPanTSAtlasSummary(): Promise<PanTSAtlasSummary | null> {
  if (summaryCache) return summaryCache;
  try {
    const res = await fetch(`${dataBase()}/pantsAtlasSummary.json`);
    if (!res.ok) return null;
    summaryCache = (await res.json()) as PanTSAtlasSummary;
    return summaryCache;
  } catch {
    return null;
  }
}

/** @deprecated Use getAtlasCase + atlasCaseToManifest — never fetches manifest.json */
export async function loadPanTSCaseManifest(
  caseId: string
): Promise<PanTSCaseManifest | null> {
  await ensurePanTSAtlasLoaded();
  const atlas = getAtlasCase(caseId);
  if (!atlas) return null;
  return atlasCaseToManifest(atlas);
}

export function localCaseToManifest(local: PanTSLocalAtlasCase): PanTSCaseManifest {
  return atlasCaseToManifest({
    caseId: local.caseId,
    sliceCount: local.localFrameCount,
    ctFrames: local.ctPngFrames,
    sourceSliceIds: local.sourceSliceIds,
    overlaysByOrgan: local.overlaysByOrgan,
    availableOrgans: local.availableOrgans,
    hasPancreaticDuct: local.hasPancreaticDuct,
    hasPancreaticLesion: local.hasPancreaticLesion,
    thumbnail: local.thumbnail,
  });
}

export function isLocalVolumeCase(caseId: string): boolean {
  return atlasCaseMap.has(caseId);
}

export function getCaseMetadata(caseId: string): PanTSCatalogCase | null {
  if (!catalogCache) return null;
  return catalogCache.cases.find((c) => c.caseId === caseId) ?? null;
}

export function getLocalAtlasCase(caseId: string): PanTSLocalAtlasCase | null {
  const atlas = getAtlasCase(caseId);
  if (!atlas) return null;
  return atlasCaseToLocalEntry(atlas, getCaseMetadata(caseId) ?? {});
}

export function filterCatalogCases(
  cases: PanTSCatalogCase[],
  opts: CatalogFilterOptions
): PanTSCatalogCase[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  return cases.filter((c) => {
    if (opts.tumor === "tumor" && c.tumor !== true) return false;
    if (opts.tumor === "no_tumor" && c.tumor !== false) return false;
    if (opts.sex && opts.sex !== "any" && c.sex !== opts.sex) return false;
    if (opts.availability === "local" && !c.hasLocalVolume) return false;
    if (opts.availability === "metadata" && c.hasLocalVolume) return false;
    if (opts.ctPhase && opts.ctPhase !== "any" && c.ctPhase !== opts.ctPhase) {
      return false;
    }
    if (opts.site && opts.site !== "any" && c.site !== opts.site) return false;
    if (
      opts.siteNationality &&
      opts.siteNationality !== "any" &&
      c.siteNationality !== opts.siteNationality
    ) {
      return false;
    }
    if (
      opts.manufacturer &&
      opts.manufacturer !== "any" &&
      c.manufacturer !== opts.manufacturer
    ) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      c.caseId,
      c.ctPhase,
      c.sex,
      c.site,
      c.siteDetail,
      c.manufacturer,
      c.manufacturerModel,
      c.studyType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q) || c.caseId.toLowerCase().includes(q);
  });
}

export function getTumorBadge(c: PanTSCatalogCase): string {
  if (c.tumor === true) return "Tumor";
  if (c.tumor === false) return "No tumor";
  return "Unknown";
}

export function getAvailabilityBadge(c: PanTSCatalogCase): string {
  return c.hasLocalVolume ? "Local volume" : "Metadata only";
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
  return organId.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function overlayForSlice(
  manifest: PanTSCaseManifest,
  organ: string,
  sliceIndex: number
): string | null {
  return getCaseOverlayUrl(manifest.caseId, organ, sliceIndex);
}

export function ctFrameForSlice(
  manifest: PanTSCaseManifest,
  sliceIndex: number
): string | null {
  return getCaseCTFrameUrl(manifest.caseId, sliceIndex);
}

/** @deprecated Use loadPanTSAtlasDatabase */
export async function loadPanTSGlobalManifest() {
  const db = await loadPanTSAtlasDatabase();
  const summary = await loadPanTSAtlasSummary();
  if (!db || !summary) return null;
  return {
    version: db.version,
    generatedAt: db.generatedAt,
    disclaimer: ATLAS_DISCLAIMER,
    caseCount: db.caseCount,
    totalExportedCtFrames: summary.exportedCtFrames,
    totalOrganOverlayStacks: summary.exportedOverlayStacks,
    uniqueOrganLayers: summary.uniqueOrganLayers,
    cases: db.cases.map((c) => ({
      caseId: c.caseId,
      sliceCount: c.sliceCount,
      organCount: c.availableOrgans.length,
      hasPancreaticDuct: c.hasPancreaticDuct,
      hasPancreaticLesion: c.hasPancreaticLesion,
      thumbnailFrame: c.thumbnail ?? null,
    })),
  };
}
