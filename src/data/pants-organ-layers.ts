/** Canonical PanTS organ layer schema (28 labels) for local exemplar atlases. */

export type OrganGroupId =
  | "pancreas"
  | "duct_lesion"
  | "vascular"
  | "adjacent_gi"
  | "solid_organs"
  | "renal_adrenal"
  | "other";

export type FocusPresetId =
  | "pancreas_context"
  | "duct_lesion"
  | "vascular_adjacency"
  | "gi_adjacency"
  | "renal_adrenal"
  | "full_abdomen";

export type OrganLayerDef = {
  id: string;
  label: string;
  group: OrganGroupId;
  color: string;
  defaultOpacity: number;
  priority: number;
  isCorePancreasLayer: boolean;
  isFindingLayer: boolean;
};

export const CANONICAL_ORGAN_LABEL_COUNT = 28;

export const ORGAN_LAYERS: OrganLayerDef[] = [
  { id: "pancreas", label: "Pancreas", group: "pancreas", color: "#34d399", defaultOpacity: 0.55, priority: 1, isCorePancreasLayer: true, isFindingLayer: false },
  { id: "pancreas_head", label: "Pancreas head", group: "pancreas", color: "#10b981", defaultOpacity: 0.5, priority: 2, isCorePancreasLayer: true, isFindingLayer: false },
  { id: "pancreas_body", label: "Pancreas body", group: "pancreas", color: "#2dd4bf", defaultOpacity: 0.5, priority: 3, isCorePancreasLayer: true, isFindingLayer: false },
  { id: "pancreas_tail", label: "Pancreas tail", group: "pancreas", color: "#5eead4", defaultOpacity: 0.5, priority: 4, isCorePancreasLayer: true, isFindingLayer: false },
  { id: "pancreatic_duct", label: "Pancreatic duct", group: "duct_lesion", color: "#fbbf24", defaultOpacity: 0.65, priority: 5, isCorePancreasLayer: true, isFindingLayer: false },
  { id: "pancreatic_lesion", label: "Pancreatic lesion", group: "duct_lesion", color: "#f472b6", defaultOpacity: 0.7, priority: 6, isCorePancreasLayer: true, isFindingLayer: true },
  { id: "common_bile_duct", label: "Common bile duct", group: "duct_lesion", color: "#d97706", defaultOpacity: 0.55, priority: 7, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "aorta", label: "Aorta", group: "vascular", color: "#f87171", defaultOpacity: 0.5, priority: 8, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "veins", label: "Veins", group: "vascular", color: "#93c5fd", defaultOpacity: 0.45, priority: 9, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "postcava", label: "Postcava", group: "vascular", color: "#7dd3fc", defaultOpacity: 0.45, priority: 10, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "celiac_artery", label: "Celiac artery", group: "vascular", color: "#ef4444", defaultOpacity: 0.5, priority: 11, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "superior_mesenteric_artery", label: "SMA", group: "vascular", color: "#dc2626", defaultOpacity: 0.5, priority: 12, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "stomach", label: "Stomach", group: "adjacent_gi", color: "#fb923c", defaultOpacity: 0.4, priority: 13, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "duodenum", label: "Duodenum", group: "adjacent_gi", color: "#fdba74", defaultOpacity: 0.4, priority: 14, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "colon", label: "Colon", group: "adjacent_gi", color: "#ea580c", defaultOpacity: 0.38, priority: 15, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "gall_bladder", label: "Gall bladder", group: "adjacent_gi", color: "#84cc16", defaultOpacity: 0.4, priority: 16, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "liver", label: "Liver", group: "solid_organs", color: "#a78bfa", defaultOpacity: 0.42, priority: 17, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "spleen", label: "Spleen", group: "solid_organs", color: "#c084fc", defaultOpacity: 0.4, priority: 18, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "kidney_left", label: "Kidney left", group: "renal_adrenal", color: "#2dd4bf", defaultOpacity: 0.38, priority: 19, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "kidney_right", label: "Kidney right", group: "renal_adrenal", color: "#14b8a6", defaultOpacity: 0.38, priority: 20, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "adrenal_gland_left", label: "Adrenal left", group: "renal_adrenal", color: "#0ea5e9", defaultOpacity: 0.38, priority: 21, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "adrenal_gland_right", label: "Adrenal right", group: "renal_adrenal", color: "#0284c7", defaultOpacity: 0.38, priority: 22, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "lung_left", label: "Lung left", group: "other", color: "#94a3b8", defaultOpacity: 0.3, priority: 23, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "lung_right", label: "Lung right", group: "other", color: "#64748b", defaultOpacity: 0.3, priority: 24, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "bladder", label: "Bladder", group: "other", color: "#7dd3fc", defaultOpacity: 0.32, priority: 25, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "prostate", label: "Prostate", group: "other", color: "#60a5fa", defaultOpacity: 0.32, priority: 26, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "femur_left", label: "Femur left", group: "other", color: "#cbd5e1", defaultOpacity: 0.25, priority: 27, isCorePancreasLayer: false, isFindingLayer: false },
  { id: "femur_right", label: "Femur right", group: "other", color: "#cbd5e1", defaultOpacity: 0.25, priority: 28, isCorePancreasLayer: false, isFindingLayer: false },
];

export const ORGAN_GROUP_LABELS: Record<OrganGroupId, string> = {
  pancreas: "Pancreas",
  duct_lesion: "Duct / Lesion",
  vascular: "Vascular",
  adjacent_gi: "Adjacent GI",
  solid_organs: "Solid organs",
  renal_adrenal: "Renal / Adrenal",
  other: "Other anatomy",
};

export const ORGAN_GROUPS: Record<OrganGroupId, string[]> = {
  pancreas: ["pancreas", "pancreas_head", "pancreas_body", "pancreas_tail"],
  duct_lesion: ["pancreatic_duct", "pancreatic_lesion", "common_bile_duct"],
  vascular: ["aorta", "veins", "postcava", "celiac_artery", "superior_mesenteric_artery"],
  adjacent_gi: ["stomach", "duodenum", "colon", "gall_bladder"],
  solid_organs: ["liver", "spleen"],
  renal_adrenal: ["kidney_left", "kidney_right", "adrenal_gland_left", "adrenal_gland_right"],
  other: ["lung_left", "lung_right", "bladder", "prostate", "femur_left", "femur_right"],
};

export const DEFAULT_VISIBLE_LAYERS = [
  "pancreas",
  "pancreas_head",
  "pancreatic_duct",
  "pancreatic_lesion",
];

export const DEFAULT_LAYER_OPACITY = 0.55;

const layerById = new Map(ORGAN_LAYERS.map((l) => [l.id, l]));

export function getLayerDef(id: string): OrganLayerDef | undefined {
  return layerById.get(id);
}

export function getLayerLabel(id: string): string {
  return getLayerDef(id)?.label ?? id.replace(/_/g, " ");
}

export function getLayerColor(id: string): string {
  return getLayerDef(id)?.color ?? "#38bdf8";
}

export function getGroupForLayer(id: string): OrganGroupId {
  return getLayerDef(id)?.group ?? "other";
}

export const FOCUS_PRESET_DEFS: Record<
  FocusPresetId,
  { label: string; layerIds: string[] }
> = {
  pancreas_context: {
    label: "Pancreas context",
    layerIds: [...ORGAN_GROUPS.pancreas],
  },
  duct_lesion: {
    label: "Duct / lesion",
    layerIds: [...ORGAN_GROUPS.duct_lesion, "pancreas", "pancreas_head"],
  },
  vascular_adjacency: {
    label: "Vascular adjacency",
    layerIds: [...ORGAN_GROUPS.vascular],
  },
  gi_adjacency: {
    label: "GI adjacency",
    layerIds: [...ORGAN_GROUPS.adjacent_gi, ...ORGAN_GROUPS.solid_organs],
  },
  renal_adrenal: {
    label: "Renal / adrenal",
    layerIds: [...ORGAN_GROUPS.renal_adrenal],
  },
  full_abdomen: {
    label: "Full abdomen",
    layerIds: ORGAN_LAYERS.map((l) => l.id),
  },
};

export function getPresetLayers(
  presetId: FocusPresetId,
  available: string[]
): string[] {
  const want = new Set(FOCUS_PRESET_DEFS[presetId].layerIds);
  return available.filter((id) => want.has(id));
}

export function defaultOpacityForLayer(id: string): number {
  return getLayerDef(id)?.defaultOpacity ?? DEFAULT_LAYER_OPACITY;
}

export function groupLayersByCategory(available: string[]): Record<OrganGroupId, string[]> {
  const out = Object.fromEntries(
    (Object.keys(ORGAN_GROUPS) as OrganGroupId[]).map((g) => [g, [] as string[]])
  ) as Record<OrganGroupId, string[]>;
  for (const id of available) {
    const g = getGroupForLayer(id);
    out[g].push(id);
  }
  for (const g of Object.keys(out) as OrganGroupId[]) {
    out[g].sort((a, b) => (getLayerDef(a)?.priority ?? 99) - (getLayerDef(b)?.priority ?? 99));
  }
  return out;
}
