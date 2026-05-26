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
  FOCUS_PRESETS,
  loadPanTSGlobalManifest,
  loadPanTSCaseManifest,
  type FocusPresetId,
  type PanTSGlobalManifest,
  type PanTSCaseManifest,
} from "../data/pants-atlas";
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
  globalManifest: PanTSGlobalManifest | null;
  selectedCaseId: string;
  selectedCaseManifest: PanTSCaseManifest | null;
  sliceIndex: number;
  selectedOrgans: string[];
  overlayOpacity: number;
  isPlaying: boolean;
  focusPreset: FocusPresetId;
  disclaimer: string;
  setSelectedCaseId: (id: string) => void;
  setSliceIndex: (index: number) => void;
  setSelectedOrgans: (organs: string[]) => void;
  toggleOrgan: (organ: string) => void;
  applyFocusPreset: (preset: FocusPresetId) => void;
  setOverlayOpacity: (value: number) => void;
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

function defaultOrgansForManifest(manifest: PanTSCaseManifest): string[] {
  const preset = FOCUS_PRESETS.pancreas_screening.organs(manifest.availableOrgans);
  if (preset.length > 0) return preset;
  return manifest.availableOrgans.includes("pancreas")
    ? ["pancreas"]
    : manifest.availableOrgans.slice(0, 1);
}

export function DemoWorkspaceProvider({ children }: { children: ReactNode }) {
  const [globalManifest, setGlobalManifest] = useState<PanTSGlobalManifest | null>(
    null
  );
  const [atlasLoading, setAtlasLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseIdState] = useState("");
  const [selectedCaseManifest, setSelectedCaseManifest] =
    useState<PanTSCaseManifest | null>(null);
  const [sliceIndex, setSliceIndex] = useState(8);
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);
  const [overlayOpacity, setOverlayOpacity] = useState(48);
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusPreset, setFocusPreset] = useState<FocusPresetId>("pancreas_screening");
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(
    "PAN-EARLY-001"
  );
  const [lastAnalysis, setLastAnalysis] = useState<ModelAnalysisResponse | null>(
    null
  );
  const [ctAnalysisResult, setCtAnalysisResult] =
    useState<CtAnalysisResult | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueRow[]>(SEED_QUEUE);
  const [activeSection, setActiveSection] = useState<DemoSection>("atlas");

  const fallbackCaseId = DEMO_CASES[0]?.case_id ?? "";
  const atlasReady = globalManifest !== null && globalManifest.caseCount > 0;
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAtlasLoading(true);
      const global = await loadPanTSGlobalManifest();
      if (cancelled) return;
      if (global?.cases?.length) {
        setGlobalManifest(global);
        const first = global.cases[0].caseId;
        setSelectedCaseIdState(first);
        const manifest = await loadPanTSCaseManifest(first);
        if (cancelled) return;
        if (manifest) {
          setSelectedCaseManifest(manifest);
          setSliceIndex(Math.floor(manifest.sliceCount / 2));
          setSelectedOrgans(defaultOrgansForManifest(manifest));
        }
      } else {
        const legacy = getDemoCase(fallbackCaseId);
        setSelectedCaseIdState(legacy.case_id);
      }
      setAtlasLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackCaseId]);

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

  const loadCase = useCallback(async (caseId: string) => {
    if (globalManifest) {
      const manifest = await loadPanTSCaseManifest(caseId);
      if (manifest) {
        setSelectedCaseIdState(caseId);
        setSelectedCaseManifest(manifest);
        setSliceIndex(Math.floor(manifest.sliceCount / 2));
        setSelectedOrgans(defaultOrgansForManifest(manifest));
        setFocusPreset("pancreas_screening");
        return;
      }
    }
    const legacy = getDemoCase(caseId);
    setSelectedCaseIdState(legacy.case_id);
    setSelectedCaseManifest(null);
  }, [globalManifest]);

  const setSelectedCaseId = useCallback(
    (id: string) => {
      void loadCase(id);
    },
    [loadCase]
  );

  const toggleOrgan = useCallback((organ: string) => {
    setSelectedOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  }, []);

  const applyFocusPreset = useCallback(
    (preset: FocusPresetId) => {
      setFocusPreset(preset);
      if (!selectedCaseManifest) return;
      const organs = FOCUS_PRESETS[preset].organs(
        selectedCaseManifest.availableOrgans
      );
      setSelectedOrgans(organs.length > 0 ? organs : selectedCaseManifest.availableOrgans);
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
      globalManifest,
      selectedCaseId,
      selectedCaseManifest,
      sliceIndex,
      selectedOrgans,
      overlayOpacity,
      isPlaying,
      focusPreset,
      disclaimer: ATLAS_DISCLAIMER,
      setSelectedCaseId,
      setSliceIndex,
      setSelectedOrgans,
      toggleOrgan,
      applyFocusPreset,
      setOverlayOpacity,
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
      globalManifest,
      selectedCaseId,
      selectedCaseManifest,
      sliceIndex,
      selectedOrgans,
      overlayOpacity,
      isPlaying,
      focusPreset,
      setSelectedCaseId,
      toggleOrgan,
      applyFocusPreset,
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
