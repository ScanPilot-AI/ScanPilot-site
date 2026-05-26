import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ModelAnalysisResponse } from "../data/scanpilot-demo-data";
import { DEMO_CASES, getDemoCase } from "../data/scanpilot-demo-data";
import {
  ATLAS_DISCLAIMER,
  atlasCaseToManifest,
  ensurePanTSAtlasLoaded,
  getAtlasCase,
  getAtlasCaseCount,
  loadPanTSCatalog,
  loadPanTSLocalAtlas,
  loadPanTSAtlasSummary,
  type PanTSCatalog,
  type PanTSCatalogCase,
  type PanTSAtlasSummary,
  type PanTSLocalAtlas,
  type PanTSCaseManifest,
} from "../data/pants-atlas";
import {
  DEFAULT_VISIBLE_LAYERS,
  defaultOpacityForLayer,
  getPresetLayers,
  type FocusPresetId,
} from "../data/pants-organ-layers";
import type { CtAnalysisResult } from "../lib/scanpilot-api";

export type ReviewQueueRow = {
  caseId: string;
  source: string;
  modelStatus: string;
  reviewPriority: string;
  assignedReviewer: string;
  outputPackage: string;
  state: string;
  stateKey: "pending" | "in_review" | "exported";
};

export type DemoSection =
  | "atlas"
  | "sandbox"
  | "dataset"
  | "cohort"
  | "labels"
  | "findings"
  | "queue"
  | "viewer"
  | "api"
  | "validation"
  | "compliance"
  | "export"
  | "overview";

const SEED_QUEUE: ReviewQueueRow[] = [
  {
    caseId: "PanTS_00000017",
    source: "PanTS Atlas",
    modelStatus: "Precomputed",
    reviewPriority: "elevated",
    assignedReviewer: "Dr. Chen (demo)",
    outputPackage: "atlas_review_v1.zip",
    state: "In review",
    stateKey: "in_review",
  },
  {
    caseId: "PanTS_00000030",
    source: "PanTS Atlas",
    modelStatus: "Precomputed",
    reviewPriority: "routine",
    assignedReviewer: "Unassigned",
    outputPackage: "atlas_review_v1.zip",
    state: "Pending review",
    stateKey: "pending",
  },
  {
    caseId: "PanTS_00000035",
    source: "PanTS Atlas",
    modelStatus: "Precomputed",
    reviewPriority: "elevated",
    assignedReviewer: "Dr. Okonkwo (demo)",
    outputPackage: "atlas_review_v1.zip",
    state: "Exported",
    stateKey: "exported",
  },
];

type DemoWorkspaceValue = {
  atlasReady: boolean;
  atlasLoading: boolean;
  catalog: PanTSCatalog | null;
  summary: PanTSAtlasSummary | null;
  localAtlas: PanTSLocalAtlas | null;
  selectedCaseId: string;
  selectedCaseManifest: PanTSCaseManifest | null;
  sliceIndex: number;
  selectedOrgans: string[];
  layerOpacityById: Record<string, number>;
  isPlaying: boolean;
  focusPreset: FocusPresetId;
  disclaimer: string;
  selectedConsoleCaseId: string | null;
  metadataDrawerCaseId: string | null;
  setSelectedCaseId: (id: string) => void;
  selectCatalogCase: (caseId: string) => void;
  openAtlasCase: (caseId: string) => void;
  closeMetadataDrawer: () => void;
  getCatalogCase: (caseId: string) => PanTSCatalogCase | null;
  setSliceIndex: (index: number) => void;
  setSelectedOrgans: (organs: string[]) => void;
  toggleOrgan: (organ: string) => void;
  toggleGroup: (groupId: string, layerIds: string[]) => void;
  applyFocusPreset: (preset: FocusPresetId) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  resetLayerState: () => void;
  showAllLayers: () => void;
  hideAllLayers: () => void;
  setIsPlaying: (playing: boolean) => void;
  selectedCohortId: string | null;
  setSelectedCohortId: (id: string | null) => void;
  lastAnalysis: ModelAnalysisResponse | null;
  setLastAnalysis: (r: ModelAnalysisResponse | null) => void;
  ctAnalysisResult: CtAnalysisResult | null;
  setCtAnalysisResult: (r: CtAnalysisResult | null) => void;
  reviewQueue: ReviewQueueRow[];
  addToReviewQueue: (result: CtAnalysisResult) => void;
  activeSection: DemoSection;
  setActiveSection: (s: DemoSection) => void;
};

const DemoWorkspaceContext = createContext<DemoWorkspaceValue | null>(null);

function initLayerState(manifest: PanTSCaseManifest): {
  organs: string[];
  opacities: Record<string, number>;
} {
  const available = manifest.availableOrgans;
  const fromPreset = getPresetLayers("pancreas_context", available);
  const fromDefault = DEFAULT_VISIBLE_LAYERS.filter((id) => available.includes(id));
  const organs =
    fromPreset.length > 0
      ? fromPreset
      : fromDefault.length > 0
        ? fromDefault
        : available.slice(0, 1);
  const opacities: Record<string, number> = {};
  for (const id of available) {
    opacities[id] = defaultOpacityForLayer(id);
  }
  return { organs, opacities };
}

export function DemoWorkspaceProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<PanTSCatalog | null>(null);
  const [summary, setSummary] = useState<PanTSAtlasSummary | null>(null);
  const [localAtlas, setLocalAtlas] = useState<PanTSLocalAtlas | null>(null);
  const [atlasLoading, setAtlasLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseIdState] = useState("");
  const [selectedCaseManifest, setSelectedCaseManifest] =
    useState<PanTSCaseManifest | null>(null);
  const [sliceIndex, setSliceIndex] = useState(8);
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);
  const [layerOpacityById, setLayerOpacityById] = useState<Record<string, number>>(
    {}
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusPreset, setFocusPreset] = useState<FocusPresetId>("pancreas_context");
  const [selectedConsoleCaseId, setSelectedConsoleCaseId] = useState<string | null>(
    null
  );
  const [metadataDrawerCaseId, setMetadataDrawerCaseId] = useState<string | null>(
    null
  );
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(
    "PAN-EARLY-001"
  );
  const [lastAnalysis, setLastAnalysis] = useState<ModelAnalysisResponse | null>(
    null
  );
  const [ctAnalysisResult, setCtAnalysisResult] =
    useState<CtAnalysisResult | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueRow[]>(SEED_QUEUE);
  const [activeSection, setActiveSection] = useState<DemoSection>("overview");

  const fallbackCaseId = DEMO_CASES[0]?.case_id ?? "";
  const atlasReady =
    getAtlasCaseCount() > 0 ||
    (localAtlas !== null && localAtlas.caseCount > 0);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const catalogMap = useMemo(() => {
    const m = new Map<string, PanTSCatalogCase>();
    for (const c of catalog?.cases ?? []) {
      m.set(c.caseId, c);
    }
    return m;
  }, [catalog]);

  const getCatalogCase = useCallback(
    (caseId: string) => catalogMap.get(caseId) ?? null,
    [catalogMap]
  );

  const loadLocalCase = useCallback((caseId: string) => {
    const atlas = getAtlasCase(caseId);
    if (atlas) {
      const manifest = atlasCaseToManifest(atlas);
      const { organs, opacities } = initLayerState(manifest);
      setSelectedCaseIdState(caseId);
      setSelectedCaseManifest(manifest);
      setSliceIndex(Math.floor(manifest.sliceCount / 2));
      setSelectedOrgans(organs);
      setLayerOpacityById(opacities);
      setFocusPreset("pancreas_context");
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAtlasLoading(true);
      const [cat, , sum] = await Promise.all([
        loadPanTSCatalog(),
        ensurePanTSAtlasLoaded(),
        loadPanTSAtlasSummary(),
      ]);
      const local = await loadPanTSLocalAtlas();
      if (cancelled) return;
      setCatalog(cat);
      setLocalAtlas(local);
      setSummary(sum);

      const firstLocal = local?.cases[0]?.caseId;
      if (firstLocal && loadLocalCase(firstLocal)) {
        /* loaded */
      } else {
        const legacy = getDemoCase(fallbackCaseId);
        setSelectedCaseIdState(legacy.case_id);
      }
      setAtlasLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackCaseId, loadLocalCase]);

  useEffect(() => {
    if (!isPlaying || !selectedCaseManifest) {
      if (playTimer.current) {
        clearInterval(playTimer.current);
        playTimer.current = null;
      }
      return;
    }
    playTimer.current = setInterval(() => {
      setSliceIndex((prev) => {
        const max = Math.max(0, selectedCaseManifest.sliceCount - 1);
        return prev >= max ? 0 : prev + 1;
      });
    }, 280);
    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [isPlaying, selectedCaseManifest]);

  const setSelectedCaseId = useCallback(
    (id: string) => {
      if (!loadLocalCase(id)) {
        const legacy = getDemoCase(id);
        setSelectedCaseIdState(legacy.case_id);
        setSelectedCaseManifest(null);
      }
      setMetadataDrawerCaseId(null);
    },
    [loadLocalCase]
  );

  const selectCatalogCase = useCallback(
    (caseId: string) => {
      setSelectedConsoleCaseId(caseId);
      const meta = catalogMap.get(caseId);
      if (meta?.hasLocalVolume) {
        setMetadataDrawerCaseId(null);
        return;
      }
      setMetadataDrawerCaseId(caseId);
    },
    [catalogMap]
  );

  const openAtlasCase = useCallback(
    (caseId: string) => {
      if (loadLocalCase(caseId)) {
        setMetadataDrawerCaseId(null);
        setSelectedConsoleCaseId(caseId);
        setActiveSection("atlas");
      }
    },
    [loadLocalCase]
  );

  const closeMetadataDrawer = useCallback(() => {
    setMetadataDrawerCaseId(null);
  }, []);

  const toggleOrgan = useCallback((organ: string) => {
    setSelectedOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  }, []);

  const toggleGroup = useCallback((_groupId: string, layerIds: string[]) => {
    setSelectedOrgans((prev) => {
      const allOn = layerIds.every((id) => prev.includes(id));
      if (allOn) return prev.filter((id) => !layerIds.includes(id));
      const next = new Set(prev);
      for (const id of layerIds) next.add(id);
      return [...next];
    });
  }, []);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayerOpacityById((prev) => ({ ...prev, [layerId]: opacity }));
  }, []);

  const resetLayerState = useCallback(() => {
    if (!selectedCaseManifest) return;
    const { organs, opacities } = initLayerState(selectedCaseManifest);
    setSelectedOrgans(organs);
    setLayerOpacityById(opacities);
    setFocusPreset("pancreas_context");
  }, [selectedCaseManifest]);

  const showAllLayers = useCallback(() => {
    if (!selectedCaseManifest) return;
    setSelectedOrgans([...selectedCaseManifest.availableOrgans]);
  }, [selectedCaseManifest]);

  const hideAllLayers = useCallback(() => {
    setSelectedOrgans([]);
  }, []);

  const applyFocusPreset = useCallback(
    (preset: FocusPresetId) => {
      setFocusPreset(preset);
      if (!selectedCaseManifest) return;
      const organs = getPresetLayers(preset, selectedCaseManifest.availableOrgans);
      setSelectedOrgans(
        organs.length > 0 ? organs : selectedCaseManifest.availableOrgans
      );
    },
    [selectedCaseManifest]
  );

  const addToReviewQueue = useCallback((result: CtAnalysisResult) => {
    const caseId = result.bdmapId ?? `CASE-${result.sessionId.slice(0, 8)}`;
    const row: ReviewQueueRow = {
      caseId,
      source: "CT Analysis Sandbox",
      modelStatus: result.modelStatus,
      reviewPriority: result.reviewPriority,
      assignedReviewer: "Unassigned",
      outputPackage: result.simulated
        ? "validation_bundle_demo.zip"
        : "validation_bundle.zip",
      state: "Pending review",
      stateKey: "pending",
    };
    setReviewQueue((prev) => {
      if (prev.some((r) => r.caseId === caseId)) return prev;
      return [row, ...prev];
    });
  }, []);

  const value = useMemo(
    () => ({
      atlasReady,
      atlasLoading,
      catalog,
      summary,
      localAtlas,
      selectedCaseId,
      selectedCaseManifest,
      sliceIndex,
      selectedOrgans,
      layerOpacityById,
      isPlaying,
      focusPreset,
      disclaimer: ATLAS_DISCLAIMER,
      selectedConsoleCaseId,
      metadataDrawerCaseId,
      setSelectedCaseId,
      selectCatalogCase,
      openAtlasCase,
      closeMetadataDrawer,
      getCatalogCase,
      setSliceIndex,
      setSelectedOrgans,
      toggleOrgan,
      toggleGroup,
      applyFocusPreset,
      setLayerOpacity,
      resetLayerState,
      showAllLayers,
      hideAllLayers,
      setIsPlaying,
      selectedCohortId,
      setSelectedCohortId,
      lastAnalysis,
      setLastAnalysis,
      ctAnalysisResult,
      setCtAnalysisResult,
      reviewQueue,
      addToReviewQueue,
      activeSection,
      setActiveSection,
    }),
    [
      atlasReady,
      atlasLoading,
      catalog,
      summary,
      localAtlas,
      selectedCaseId,
      selectedCaseManifest,
      sliceIndex,
      selectedOrgans,
      layerOpacityById,
      isPlaying,
      focusPreset,
      selectedConsoleCaseId,
      metadataDrawerCaseId,
      setSelectedCaseId,
      selectCatalogCase,
      openAtlasCase,
      closeMetadataDrawer,
      getCatalogCase,
      toggleOrgan,
      toggleGroup,
      applyFocusPreset,
      resetLayerState,
      showAllLayers,
      hideAllLayers,
      selectedCohortId,
      lastAnalysis,
      ctAnalysisResult,
      reviewQueue,
      addToReviewQueue,
      activeSection,
    ]
  );

  return (
    <DemoWorkspaceContext.Provider value={value}>
      {children}
    </DemoWorkspaceContext.Provider>
  );
}

export function useDemoWorkspace(): DemoWorkspaceValue {
  const ctx = useContext(DemoWorkspaceContext);
  if (!ctx) {
    throw new Error("useDemoWorkspace must be used within DemoWorkspaceProvider");
  }
  return ctx;
}
